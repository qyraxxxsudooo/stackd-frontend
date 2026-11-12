-- STACKED promo system. NOT applied to production by the assistant: review, then apply via Supabase SQL editor or `supabase db push`.
-- Admin identity follows the existing project policies (JWT email of the site owner).
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- tables
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null default '',
  kind text not null check (kind in ('percent','fixed','free_product')),
  value numeric(10,2),
  scope text not null default 'all' check (scope in ('all','product')),
  product_id uuid,
  max_uses integer check (max_uses is null or max_uses > 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_code_format check (code ~ '^[A-Z0-9!_-]{3,32}$'),
  constraint promo_value_rules check (
    (kind = 'percent' and value > 0 and value <= 100)
    or (kind = 'fixed' and value > 0)
    or (kind = 'free_product' and value is null)),
  constraint promo_scope_rules check (
    (kind = 'free_product' and product_id is not null)
    or (kind <> 'free_product' and ((scope = 'all' and product_id is null) or (scope = 'product' and product_id is not null)))),
  constraint promo_dates check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index promo_codes_code_key on public.promo_codes (code);

create table public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_id uuid not null references public.promo_codes(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid unique references public.orders(id) on delete set null,
  code text not null,
  discount numeric(10,2) not null check (discount >= 0),
  status text not null default 'applied' check (status in ('applied','released')),
  created_at timestamptz not null default now(),
  released_at timestamptz
);
create index promo_redemptions_user_idx on public.promo_redemptions (promo_id, user_id) where status = 'applied';

create table private.promo_attempts (
  user_id uuid primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);

alter table public.orders
  add column if not exists subtotal numeric,
  add column if not exists discount numeric not null default 0,
  add column if not exists promo_code text,
  add column if not exists checkout_request_id uuid,
  add column if not exists qr_notified_at timestamptz,
  add column if not exists qr_tg_photo_message_id bigint;
create unique index if not exists orders_user_request_key on public.orders (user_id, checkout_request_id) where checkout_request_id is not null;

-- ---------------------------------------------------------------- RLS / grants
alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
revoke all on public.promo_codes, public.promo_redemptions from public, anon, authenticated;

create or replace function public.stackd_is_admin() returns boolean
language sql stable set search_path = '' as
$$ select lower(coalesce(auth.jwt() ->> 'email', '')) = 'yuska20102010@gmail.com' $$;
revoke all on function public.stackd_is_admin() from public, anon;
grant execute on function public.stackd_is_admin() to authenticated;

-- Only the site owner can read or manage promo rows directly; there is no policy for anyone else, so no public SELECT.
grant select, delete on public.promo_codes to authenticated;
grant insert (code, title, kind, value, scope, product_id, max_uses, per_user_limit, starts_at, ends_at, active, archived_at) on public.promo_codes to authenticated;
grant update (code, title, kind, value, scope, product_id, max_uses, per_user_limit, starts_at, ends_at, active, archived_at, updated_at) on public.promo_codes to authenticated;
create policy promo_admin_all on public.promo_codes for all to authenticated
  using ((select public.stackd_is_admin())) with check ((select public.stackd_is_admin()));
grant select on public.promo_redemptions to authenticated;
create policy promo_redemptions_admin_read on public.promo_redemptions for select to authenticated
  using ((select public.stackd_is_admin()));

create or replace function private.promo_touch() returns trigger language plpgsql set search_path = '' as
$$ begin new.code := upper(btrim(new.code)); new.updated_at := now(); return new; end $$;
create trigger promo_codes_touch before insert or update on public.promo_codes for each row execute function private.promo_touch();

-- ---------------------------------------------------------------- pricing / evaluation
-- Builds server-side priced lines from the cart (client prices are never read) and evaluates a promo.
create or replace function private.promo_eval(p_user uuid, p_code text, p_cart jsonb, p_lock boolean, p_virtual boolean default false)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_promo public.promo_codes%rowtype;
  v_eligible numeric := 0; v_subtotal numeric := 0; v_discount numeric := 0;
  v_free_unit numeric; v_used_user integer; v_added boolean := false;
begin
  if v_code !~ '^[A-Z0-9!_-]{3,32}$' then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  if p_lock then
    select * into v_promo from public.promo_codes where code = v_code for update;
  else
    select * into v_promo from public.promo_codes where code = v_code;
  end if;
  -- Missing, inactive, archived, not started, expired and exhausted codes are deliberately indistinguishable.
  if not found or not v_promo.active or v_promo.archived_at is not null
     or (v_promo.starts_at is not null and v_promo.starts_at > now())
     or (v_promo.ends_at is not null and v_promo.ends_at <= now())
     or (v_promo.max_uses is not null and v_promo.uses_count >= v_promo.max_uses) then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  select count(*) into v_used_user from public.promo_redemptions where promo_id = v_promo.id and user_id = p_user and status = 'applied';
  if v_used_user >= v_promo.per_user_limit then return jsonb_build_object('ok', false, 'reason', 'already_used'); end if;

  select coalesce(sum(l.price * l.qty), 0),
         coalesce(sum(l.price * l.qty) filter (where v_promo.scope = 'all' or l.pid = v_promo.product_id), 0),
         max(l.price) filter (where l.pid = v_promo.product_id)
    into v_subtotal, v_eligible, v_free_unit
  from (
    select p.id as pid, p.price, sum((c.item ->> 'qty')::int) as qty
    from jsonb_array_elements(p_cart) as c(item)
    join public.products p on p.id::text = c.item ->> 'id'
    group by p.id, p.price
  ) l;

  if v_promo.kind = 'percent' then
    v_discount := round(v_eligible * v_promo.value / 100, 2);
  elsif v_promo.kind = 'fixed' then
    v_discount := least(v_promo.value, v_eligible);
  else
    if v_free_unit is null and p_virtual then
      -- preview only: the product is not in the cart yet, the client will add it
      select price into v_free_unit from public.products where id = v_promo.product_id
        and coalesce(active, true) and coalesce(available, true) and (stock is null or stock > 0);
      v_added := found;
    end if;
    if v_free_unit is null then return jsonb_build_object('ok', false, 'reason', 'not_applicable'); end if;
    v_discount := v_free_unit; v_eligible := v_free_unit;
  end if;
  if v_discount <= 0 then return jsonb_build_object('ok', false, 'reason', 'not_applicable'); end if;
  return jsonb_build_object('ok', true, 'promo_id', v_promo.id, 'code', v_promo.code, 'title', v_promo.title, 'kind', v_promo.kind,
    'value', v_promo.value, 'scope', v_promo.scope, 'product_id', v_promo.product_id, 'discount', v_discount, 'subtotal', v_subtotal,
    'total', greatest(v_subtotal - v_discount, 0), 'ends_at', v_promo.ends_at, 'remaining', case when v_promo.max_uses is null then null else v_promo.max_uses - v_promo.uses_count end, 'add_product', v_added);
end $$;
revoke all on function private.promo_eval(uuid, text, jsonb, boolean, boolean) from public, anon, authenticated;

create or replace function private.promo_rate_ok(p_user uuid) returns boolean
language plpgsql set search_path = '' as $$
declare v_count integer;
begin
  insert into private.promo_attempts as a (user_id, window_started_at, attempts) values (p_user, now(), 1)
  on conflict (user_id) do update set
    window_started_at = case when a.window_started_at <= now() - interval '60 seconds' then now() else a.window_started_at end,
    attempts = case when a.window_started_at <= now() - interval '60 seconds' then 1 else a.attempts + 1 end
  returning attempts into v_count;
  return v_count <= 8;
end $$;
revoke all on function private.promo_rate_ok(uuid) from public, anon, authenticated;

-- Preview: never consumes an activation.
create or replace function public.promo_validate(p_code text, cart_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if jsonb_typeof(cart_items) is distinct from 'array' or jsonb_array_length(cart_items) > 50 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if not private.promo_rate_ok(v_user) then return jsonb_build_object('ok', false, 'reason', 'rate_limited'); end if;
  return private.promo_eval(v_user, p_code, cart_items, false, true);
end $$;
revoke all on function public.promo_validate(text, jsonb) from public, anon;
grant execute on function public.promo_validate(text, jsonb) to authenticated;

-- ---------------------------------------------------------------- checkout (replaces checkout_order(cart_items))
drop function if exists public.checkout_order(jsonb);
create or replace function public.checkout_order(cart_items jsonb, promo_code text default null, request_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_existing uuid; v_balance numeric; v_subtotal numeric := 0; v_total numeric; v_discount numeric := 0;
  v_promo jsonb; v_lines jsonb := '[]'::jsonb; v_order uuid; v_free_pid uuid; v_free_done boolean := false;
  r record; v_qty int;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if jsonb_typeof(cart_items) is distinct from 'array' or jsonb_array_length(cart_items) = 0 or jsonb_array_length(cart_items) > 50 then
    raise exception 'Корзина пуста или некорректна';
  end if;
  if request_id is not null then
    select id into v_existing from public.orders where user_id = v_user and checkout_request_id = request_id;
    if found then return v_existing; end if;
  end if;

  select balance into v_balance from public.profiles where id = v_user for update;
  if not found then raise exception 'Профиль не найден'; end if;

  -- Lock products in a stable order, merge duplicate cart lines, read prices from the database only.
  for r in
    select p.id, p.name, p.price, p.stock, p.active, p.available, sum(least(greatest((c.item ->> 'qty')::int, 0), 50)) as qty
    from jsonb_array_elements(cart_items) c(item)
    join public.products p on p.id::text = c.item ->> 'id'
    group by p.id, p.name, p.price, p.stock, p.active, p.available
    order by p.id
  loop
    perform 1 from public.products where id = r.id for update;
    select stock into r.stock from public.products where id = r.id;
    if r.qty < 1 then continue; end if;
    if coalesce(r.active, true) = false or coalesce(r.available, true) = false then raise exception 'Товар недоступен (ID: %)', r.id; end if;
    if r.stock is not null and r.stock < r.qty then raise exception 'Товар закончился (ID: %)', r.id; end if;
    v_subtotal := v_subtotal + r.price * r.qty;
  end loop;
  if v_subtotal <= 0 and not exists (select 1 from jsonb_array_elements(cart_items)) then raise exception 'Корзина пуста'; end if;

  if promo_code is not null and btrim(promo_code) <> '' then
    if not private.promo_rate_ok(v_user) then raise exception 'promo_rate_limited'; end if;
    v_promo := private.promo_eval(v_user, promo_code, cart_items, true);   -- locks the promo row until commit
    if not (v_promo ->> 'ok')::boolean then raise exception 'promo_%', v_promo ->> 'reason'; end if;
    v_discount := (v_promo ->> 'discount')::numeric;
    if v_promo ->> 'kind' = 'free_product' then v_free_pid := (v_promo ->> 'product_id')::uuid; end if;
  end if;

  v_total := greatest(v_subtotal - v_discount, 0);
  if v_balance < v_total then raise exception 'Недостаточно средств. Нужно: %, у вас: %', v_total, v_balance; end if;

  -- Build the stored order lines (server-priced). The free unit is split off its product line.
  for r in
    select p.id, p.name, p.price, sum(least(greatest((c.item ->> 'qty')::int, 0), 50))::int as qty
    from jsonb_array_elements(cart_items) c(item) join public.products p on p.id::text = c.item ->> 'id'
    group by p.id, p.name, p.price order by p.id
  loop
    if r.qty < 1 then continue; end if;
    v_qty := r.qty;
    if v_free_pid is not null and r.id = v_free_pid and not v_free_done then
      v_lines := v_lines || jsonb_build_object('id', r.id, 'name', r.name, 'qty', 1, 'price', 0, 'promo', true);
      v_free_done := true; v_qty := r.qty - 1;
    end if;
    if v_qty > 0 then v_lines := v_lines || jsonb_build_object('id', r.id, 'name', r.name, 'qty', v_qty, 'price', r.price); end if;
    update public.products set stock = stock - r.qty where id = r.id and stock is not null;
  end loop;

  update public.profiles set balance = balance - v_total where id = v_user;
  insert into public.orders (user_id, items, total, status, subtotal, discount, promo_code, checkout_request_id)
  values (v_user, v_lines, v_total, 'pending', v_subtotal, v_discount, case when v_promo is not null then v_promo ->> 'code' end, request_id)
  returning id into v_order;

  if v_promo is not null then
    insert into public.promo_redemptions (promo_id, user_id, order_id, code, discount)
    values ((v_promo ->> 'promo_id')::uuid, v_user, v_order, v_promo ->> 'code', v_discount);
    update public.promo_codes set uses_count = uses_count + 1 where id = (v_promo ->> 'promo_id')::uuid;
  end if;
  return v_order;
end $$;
revoke all on function public.checkout_order(jsonb, text, uuid) from public, anon;
grant execute on function public.checkout_order(jsonb, text, uuid) to authenticated;

-- ---------------------------------------------------------------- cancellation releases the activation
create or replace function private.promo_release(p_order uuid) returns void language plpgsql set search_path = '' as $$
declare v_promo uuid;
begin
  update public.promo_redemptions set status = 'released', released_at = now()
  where order_id = p_order and status = 'applied' returning promo_id into v_promo;
  if v_promo is not null then update public.promo_codes set uses_count = greatest(uses_count - 1, 0) where id = v_promo; end if;
end $$;
revoke all on function private.promo_release(uuid) from public, anon, authenticated;

create or replace function public.cancel_order(order_uuid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_order record; v_item jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  select * into v_order from public.orders where id = order_uuid and user_id = auth.uid() for update;
  if not found then raise exception 'Заказ не найден'; end if;
  if v_order.status != 'pending' then raise exception 'Заказ уже принят, отмена невозможна'; end if;
  if v_order.created_at < (now() - interval '2 minutes') then raise exception 'Время на отмену истекло (2 минуты)'; end if;
  update public.profiles set balance = balance + v_order.total where id = auth.uid();
  for v_item in select * from jsonb_array_elements(v_order.items) loop
    update public.products set stock = stock + (v_item ->> 'qty')::int where id::text = v_item ->> 'id' and stock is not null;
  end loop;
  perform private.promo_release(order_uuid);
  update public.orders set status = 'cancelled' where id = order_uuid;
end $$;
revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

create or replace function public.stackd_admin_cancel_order(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype; v_rows integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'not_pending', 'status', v_order.status); end if;
  update public.profiles set balance = coalesce(balance, 0) + coalesce(v_order.total, 0) where id = v_order.user_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'Profile row not found for order %', p_order_id; end if;
  perform private.promo_release(p_order_id);
  update public.orders set status = 'cancelled', telegram_notification_claimed_at = null where id = p_order_id and status = 'pending';
  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'refunded', coalesce(v_order.total, 0));
end $$;
revoke all on function public.stackd_admin_cancel_order(uuid) from public, anon, authenticated;
grant execute on function public.stackd_admin_cancel_order(uuid) to service_role;

-- ---------------------------------------------------------------- Telegram customer link
create table public.telegram_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null unique,
  linked_at timestamptz not null default now()
);
create table private.telegram_link_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);
alter table public.telegram_links enable row level security;
revoke all on public.telegram_links from public, anon, authenticated;
grant select on public.telegram_links to authenticated;
create policy telegram_links_own on public.telegram_links for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.create_telegram_link() returns text
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_token text;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if not private.promo_rate_ok(v_user) then raise exception 'rate_limit_exceeded'; end if;
  v_token := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
  delete from private.telegram_link_tokens where user_id = v_user;
  insert into private.telegram_link_tokens (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_user, now() + interval '15 minutes');
  return v_token;
end $$;
revoke all on function public.create_telegram_link() from public, anon;
grant execute on function public.create_telegram_link() to authenticated;

create or replace function public.stackd_consume_telegram_link(p_token text, p_chat_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  update private.telegram_link_tokens set used_at = now()
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and used_at is null and expires_at > now()
  returning user_id into v_user;
  if v_user is null then return false; end if;
  delete from public.telegram_links where chat_id = p_chat_id and user_id <> v_user;
  insert into public.telegram_links (user_id, chat_id) values (v_user, p_chat_id)
  on conflict (user_id) do update set chat_id = excluded.chat_id, linked_at = now();
  return true;
end $$;
revoke all on function public.stackd_consume_telegram_link(text, bigint) from public, anon, authenticated;
grant execute on function public.stackd_consume_telegram_link(text, bigint) to service_role;

commit;
