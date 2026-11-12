-- STACKED · promo codes with server-side validation and an idempotent checkout wrapper.
--
-- Depends only on objects the site already uses: public.products(id, price, stock, available, active),
-- public.profiles(id, balance), public.orders(id, user_id, total, status) and the existing
-- public.checkout_order(cart_items) / public.cancel_order(order_uuid) RPCs, which are NOT modified.
-- stackd_checkout() calls checkout_order() inside its own transaction, so stock, balance, order creation
-- and everything else stay exactly as they are; the promo discount is applied on top and the whole
-- operation commits or rolls back as one unit.
--
-- Safe to re-run: every statement is idempotent. Nothing is dropped or deleted.

begin;

-- ───────────────────────── admin check (server side) ─────────────────────────
-- Mirrors ADMIN_EMAIL in app.js. The email comes from the signed Supabase JWT, not from the client.
create or replace function public.stackd_is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'authenticated'
    and lower(auth.jwt() ->> 'email') = 'yuska20102010@gmail.com',
    false)
$$;

-- ───────────────────────── tables ─────────────────────────
create table if not exists public.promo_codes (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null,
  code_norm          text generated always as (upper(btrim(code))) stored,
  title              text not null,
  description        text,
  discount_type      text not null check (discount_type in ('percent', 'fixed', 'free_product')),
  percent_off        numeric(5,2),
  amount_off         numeric(10,2),
  scope              text not null default 'cart' check (scope in ('cart', 'product')),
  product_id         text,
  max_uses           integer check (max_uses is null or max_uses > 0),
  max_uses_per_user  integer not null default 1 check (max_uses_per_user > 0),
  uses_count         integer not null default 0 check (uses_count >= 0),
  starts_at          timestamptz,
  ends_at            timestamptz,
  active             boolean not null default true,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint promo_code_format  check (char_length(btrim(code)) between 3 and 40 and btrim(code) !~ '\s'),
  constraint promo_title_len    check (char_length(btrim(title)) between 1 and 80),
  constraint promo_dates        check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint promo_percent      check (discount_type <> 'percent' or (percent_off > 0 and percent_off <= 100)),
  constraint promo_fixed        check (discount_type <> 'fixed' or (amount_off > 0 and amount_off <= 100000)),
  constraint promo_product      check ((discount_type = 'free_product' or scope = 'product') = (product_id is not null))
);
create unique index if not exists promo_codes_code_norm_key on public.promo_codes (code_norm);

create table if not exists public.promo_redemptions (
  id               uuid primary key default gen_random_uuid(),
  promo_id         uuid not null references public.promo_codes(id) on delete restrict,
  user_id          uuid not null,
  order_id         uuid not null unique,
  request_id       uuid not null,
  code             text not null,
  subtotal         numeric(10,2) not null,
  discount_amount  numeric(10,2) not null check (discount_amount >= 0),
  free_product_id  text,
  status           text not null default 'applied' check (status in ('applied', 'released')),
  created_at       timestamptz not null default now(),
  released_at      timestamptz
);
create index if not exists promo_redemptions_user_idx on public.promo_redemptions (promo_id, user_id) where status = 'applied';

-- One row per checkout attempt key: replays of the same request return the original order instead of charging twice.
create table if not exists public.checkout_requests (
  request_id  uuid primary key,
  user_id     uuid not null,
  order_id    uuid,
  created_at  timestamptz not null default now()
);

-- Code entry attempts, used only for server-side rate limiting.
create table if not exists public.promo_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  ok          boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists promo_attempts_user_idx on public.promo_attempts (user_id, created_at desc);

-- Promo snapshot on the order (nullable / defaulted, existing rows are untouched).
alter table public.orders add column if not exists subtotal              numeric(10,2);
alter table public.orders add column if not exists discount_amount       numeric(10,2) not null default 0;
alter table public.orders add column if not exists promo_code_id         uuid;
alter table public.orders add column if not exists promo_code            text;
alter table public.orders add column if not exists promo_title           text;
alter table public.orders add column if not exists promo_free_product_id text;

-- ───────────────────────── RLS & privileges ─────────────────────────
alter table public.promo_codes       enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.checkout_requests enable row level security;
alter table public.promo_attempts    enable row level security;

revoke all on public.promo_codes, public.promo_redemptions, public.checkout_requests, public.promo_attempts from anon, authenticated;

-- Admin only. uses_count / code_norm / timestamps are deliberately not writable through the API.
grant select, delete on public.promo_codes to authenticated;
grant insert (code, title, description, discount_type, percent_off, amount_off, scope, product_id,
              max_uses, max_uses_per_user, starts_at, ends_at, active, archived_at) on public.promo_codes to authenticated;
grant update (code, title, description, discount_type, percent_off, amount_off, scope, product_id,
              max_uses, max_uses_per_user, starts_at, ends_at, active, archived_at) on public.promo_codes to authenticated;
grant select on public.promo_redemptions to authenticated;

drop policy if exists promo_codes_admin_all on public.promo_codes;
create policy promo_codes_admin_all on public.promo_codes
  for all to authenticated using (public.stackd_is_admin()) with check (public.stackd_is_admin());

drop policy if exists promo_redemptions_read on public.promo_redemptions;
create policy promo_redemptions_read on public.promo_redemptions
  for select to authenticated using (user_id = auth.uid() or public.stackd_is_admin());
-- checkout_requests / promo_attempts: no policies → reachable only through the SECURITY DEFINER functions below.

-- ───────────────────────── validation trigger ─────────────────────────
create or replace function public.stackd_promo_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.code  := btrim(new.code);
  new.title := btrim(new.title);
  new.updated_at := now();
  if new.discount_type = 'free_product' then
    new.scope := 'product'; new.percent_off := null; new.amount_off := null;
  elsif new.discount_type = 'percent' then
    new.amount_off := null;
  else
    new.percent_off := null;
  end if;
  if new.scope = 'cart' and new.discount_type <> 'free_product' then new.product_id := null; end if;
  if new.product_id is not null and not exists (select 1 from public.products p where p.id::text = new.product_id) then
    raise exception 'Product % not found', new.product_id using errcode = '23503';
  end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
  return new;
end $$;

drop trigger if exists stackd_promo_before_write on public.promo_codes;
create trigger stackd_promo_before_write before insert or update on public.promo_codes
  for each row execute function public.stackd_promo_before_write();

-- ───────────────────────── internals (not callable by clients) ─────────────────────────
-- Normalises [{id, qty}] against current DB prices. Never trusts client prices.
create or replace function public.stackd_cart_lines(p_items jsonb)
returns table (product_id text, qty integer, price numeric, name text, purchasable boolean)
language sql
stable
security definer
set search_path = public
as $$
  with raw as (
    select x ->> 'id' as id, sum((x ->> 'qty')::int) as qty
    from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) x
    where (x ->> 'qty') ~ '^\d{1,3}$' and (x ->> 'id') is not null
    group by x ->> 'id'
  )
  select p.id::text, r.qty::int, p.price::numeric, p.name::text,
         (coalesce(p.active, true) and coalesce(p.available, true) and (p.stock is null or p.stock >= r.qty)) as purchasable
  from raw r join public.products p on p.id::text = r.id
  where r.qty between 1 and 50
$$;

-- Computes the discount of a promo for a cart. reason: null when applicable.
create or replace function public.stackd_promo_compute(p_promo public.promo_codes, p_items jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_subtotal numeric := 0; v_eligible numeric := 0; v_discount numeric := 0;
  v_unit numeric; v_qty int; v_ok boolean;
begin
  select coalesce(sum(l.qty * l.price), 0) into v_subtotal from public.stackd_cart_lines(p_items) l;
  if p_promo.product_id is not null then
    select l.price, l.qty, l.purchasable into v_unit, v_qty, v_ok
    from public.stackd_cart_lines(p_items) l where l.product_id = p_promo.product_id;
    v_eligible := coalesce(v_unit * v_qty, 0);
  else
    v_eligible := v_subtotal;
  end if;

  if v_eligible <= 0 then
    return jsonb_build_object('subtotal', round(v_subtotal, 2), 'discount', 0, 'reason', 'not_applicable');
  end if;

  if p_promo.discount_type = 'percent' then
    v_discount := round(v_eligible * p_promo.percent_off / 100, 2);
  elsif p_promo.discount_type = 'fixed' then
    v_discount := least(p_promo.amount_off, v_eligible);
  else -- free_product: exactly one unit, at its current DB price
    if not coalesce(v_ok, false) then
      return jsonb_build_object('subtotal', round(v_subtotal, 2), 'discount', 0, 'reason', 'out_of_stock');
    end if;
    v_discount := v_unit;
  end if;

  v_discount := least(round(v_discount, 2), round(v_subtotal, 2));
  return jsonb_build_object('subtotal', round(v_subtotal, 2), 'discount', v_discount, 'reason', null,
                            'free_product_id', case when p_promo.discount_type = 'free_product' then p_promo.product_id end);
end $$;

-- Returns the reason a promo can not be used by p_user right now, or null.
create or replace function public.stackd_promo_unusable(p_promo public.promo_codes, p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_promo.id is null or not p_promo.active or p_promo.archived_at is not null
      or (p_promo.starts_at is not null and p_promo.starts_at > now())
      or (p_promo.ends_at is not null and p_promo.ends_at <= now())
      or (p_promo.max_uses is not null and p_promo.uses_count >= p_promo.max_uses) then 'invalid'
    when (select count(*) from public.promo_redemptions r
          where r.promo_id = p_promo.id and r.user_id = p_user and r.status = 'applied') >= p_promo.max_uses_per_user then 'already_used'
  end
$$;

-- Server-side rate limit for code entry: 8 wrong codes per 15 minutes, 30 checks per 10 minutes.
create or replace function public.stackd_promo_rate_limited(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.promo_attempts a where a.user_id = p_user and not a.ok and a.created_at > now() - interval '15 minutes') >= 8
      or (select count(*) from public.promo_attempts a where a.user_id = p_user and a.created_at > now() - interval '10 minutes') >= 30
$$;

-- ───────────────────────── public RPC: preview (does not consume a use) ─────────────────────────
create or replace function public.stackd_promo_preview(p_code text, p_items jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_norm text := upper(btrim(coalesce(p_code, '')));
  v_promo public.promo_codes;
  v_reason text; v_calc jsonb; v_product jsonb;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'auth_required'); end if;
  if public.stackd_promo_rate_limited(v_user) then return jsonb_build_object('ok', false, 'reason', 'rate_limited'); end if;
  delete from public.promo_attempts where created_at < now() - interval '2 days';

  if char_length(v_norm) between 3 and 40 then
    select * into v_promo from public.promo_codes where code_norm = v_norm;
  end if;
  v_reason := public.stackd_promo_unusable(v_promo, v_user);
  insert into public.promo_attempts (user_id, ok) values (v_user, v_reason is distinct from 'invalid');
  -- Not found, inactive, scheduled, expired and exhausted codes share one answer on purpose (no enumeration).
  if v_reason is not null then return jsonb_build_object('ok', false, 'reason', v_reason); end if;

  v_calc := public.stackd_promo_compute(v_promo, p_items);
  if v_promo.product_id is not null then
    select jsonb_build_object('id', p.id::text, 'name', p.name, 'price', p.price,
             'purchasable', coalesce(p.active, true) and coalesce(p.available, true) and (p.stock is null or p.stock > 0))
      into v_product from public.products p where p.id::text = v_promo.product_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', v_promo.code,
    'title', v_promo.title,
    'description', v_promo.description,
    'type', v_promo.discount_type,
    'percent', v_promo.percent_off,
    'amount', v_promo.amount_off,
    'scope', v_promo.scope,
    'ends_at', v_promo.ends_at,
    'product', v_product,
    'subtotal', v_calc -> 'subtotal',
    'discount', v_calc -> 'discount',
    'applicable', (v_calc ->> 'reason') is null,
    'reason', v_calc ->> 'reason');
end $$;

-- ───────────────────────── public RPC: checkout ─────────────────────────
-- p_request_id is generated by the client once per checkout attempt and reused on network retries.
create or replace function public.stackd_checkout(p_items jsonb, p_promo_code text default null, p_request_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_request uuid := coalesce(p_request_id, gen_random_uuid());
  v_norm text := nullif(upper(btrim(coalesce(p_promo_code, ''))), '');
  v_existing public.checkout_requests;
  v_promo public.promo_codes;
  v_calc jsonb; v_reason text;
  v_credit numeric := 0; v_discount numeric := 0;
  v_arg text; v_res jsonb; v_order_id uuid; v_total numeric; v_balance numeric;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Invalid cart' using errcode = '22023';
  end if;

  -- Idempotency: a concurrent duplicate blocks on the primary key until the first attempt commits or rolls back.
  insert into public.checkout_requests (request_id, user_id) values (v_request, v_user) on conflict (request_id) do nothing;
  if not found then
    select * into v_existing from public.checkout_requests where request_id = v_request;
    if v_existing.user_id <> v_user or v_existing.order_id is null then
      raise exception 'Invalid checkout request' using errcode = '22023';
    end if;
    select total, discount_amount into v_total, v_discount from public.orders where id = v_existing.order_id;
    return jsonb_build_object('order_id', v_existing.order_id, 'total', v_total, 'discount', coalesce(v_discount, 0), 'duplicate', true);
  end if;

  if v_norm is not null then
    if public.stackd_promo_rate_limited(v_user) then
      raise exception 'PROMO_RATE_LIMITED' using errcode = 'P0001';
    end if;
    -- Row lock serialises every redemption of this code: the last available use can be taken only once.
    select * into v_promo from public.promo_codes where code_norm = v_norm for update;
    v_reason := public.stackd_promo_unusable(v_promo, v_user);
    if v_reason = 'already_used' then raise exception 'PROMO_ALREADY_USED' using errcode = 'P0001'; end if;
    if v_reason is not null then raise exception 'PROMO_INVALID' using errcode = 'P0001'; end if;
    v_calc := public.stackd_promo_compute(v_promo, p_items);
    if (v_calc ->> 'reason') is not null then raise exception 'PROMO_NOT_APPLICABLE' using errcode = 'P0001'; end if;
    v_credit := (v_calc ->> 'discount')::numeric;
    -- Temporary credit so the unchanged checkout_order() balance check sees the discounted price.
    -- It is reconciled below and rolls back together with everything else on any error.
    update public.profiles set balance = balance + v_credit where id = v_user;
  end if;

  select format_type(p.proargtypes[0], null) into v_arg
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'checkout_order' and p.pronargs = 1
  limit 1;
  if v_arg is null then raise exception 'checkout_order(cart_items) not found'; end if;

  if v_arg = 'json' then
    select to_jsonb(r) into v_res from public.checkout_order(p_items::json) r limit 1;
  else
    select to_jsonb(r) into v_res from public.checkout_order(p_items) r limit 1;
  end if;

  -- checkout_order may return a uuid, text, json or a row; accept the shapes app.js already accepts.
  v_res := case when jsonb_typeof(v_res) = 'array' then v_res -> 0 else v_res end;
  begin
    v_order_id := case jsonb_typeof(v_res)
      when 'string' then (v_res #>> '{}')::uuid
      when 'object' then coalesce(v_res ->> 'id', v_res ->> 'order_id', v_res ->> 'orderId', v_res #>> '{checkout_order}', v_res #>> '{r}')::uuid
    end;
  exception when invalid_text_representation then v_order_id := null;
  end;
  if v_order_id is null then
    select o.id into v_order_id from public.orders o where o.user_id = v_user and o.created_at >= now() order by o.created_at desc limit 1;
  end if;

  select total into v_total from public.orders where id = v_order_id and user_id = v_user for update;
  if not found then raise exception 'Order was not created'; end if;

  if v_norm is not null then
    v_discount := least(v_credit, v_total);
    if v_discount < v_credit then
      update public.profiles set balance = balance - (v_credit - v_discount) where id = v_user;
    end if;
    update public.orders
       set subtotal = v_total, discount_amount = v_discount, total = v_total - v_discount,
           promo_code_id = v_promo.id, promo_code = v_promo.code, promo_title = v_promo.title,
           promo_free_product_id = v_calc ->> 'free_product_id'
     where id = v_order_id;
    insert into public.promo_redemptions (promo_id, user_id, order_id, request_id, code, subtotal, discount_amount, free_product_id)
    values (v_promo.id, v_user, v_order_id, v_request, v_promo.code, v_total, v_discount, v_calc ->> 'free_product_id');
    update public.promo_codes set uses_count = uses_count + 1 where id = v_promo.id;
    select balance into v_balance from public.profiles where id = v_user;
    if v_balance < 0 then raise exception 'Insufficient balance' using errcode = 'P0001'; end if;
    v_total := v_total - v_discount;
  end if;

  update public.checkout_requests set order_id = v_order_id where request_id = v_request;
  return jsonb_build_object('order_id', v_order_id, 'total', v_total, 'discount', v_discount, 'duplicate', false);
end $$;

-- ───────────────────────── cancellation releases the use ─────────────────────────
create or replace function public.stackd_promo_on_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_promo uuid;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.promo_redemptions set status = 'released', released_at = now()
     where order_id = new.id and status = 'applied'
     returning promo_id into v_promo;
    if v_promo is not null then
      update public.promo_codes set uses_count = greatest(uses_count - 1, 0) where id = v_promo;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists stackd_promo_on_order_status on public.orders;
create trigger stackd_promo_on_order_status after update of status on public.orders
  for each row execute function public.stackd_promo_on_order_status();

-- ───────────────────────── function privileges ─────────────────────────
revoke all on function public.stackd_cart_lines(jsonb)                                  from public, anon, authenticated;
revoke all on function public.stackd_promo_compute(public.promo_codes, jsonb)           from public, anon, authenticated;
revoke all on function public.stackd_promo_unusable(public.promo_codes, uuid)           from public, anon, authenticated;
revoke all on function public.stackd_promo_rate_limited(uuid)                           from public, anon, authenticated;
revoke all on function public.stackd_promo_on_order_status()                            from public, anon, authenticated;
revoke all on function public.stackd_promo_preview(text, jsonb)                         from public, anon;
revoke all on function public.stackd_checkout(jsonb, text, uuid)                        from public, anon;
grant execute on function public.stackd_promo_preview(text, jsonb)                      to authenticated;
grant execute on function public.stackd_checkout(jsonb, text, uuid)                     to authenticated;
grant execute on function public.stackd_is_admin()                                      to authenticated;

commit;
