-- STACKED · personal Telegram notifications for ready QR codes.
-- Used by supabase/functions/telegram-qr. Safe to re-run; nothing is dropped.

begin;

-- Site user ↔ private Telegram chat, created by the bot from a one-time /start token.
create table if not exists public.telegram_links (
  user_id     uuid primary key,
  chat_id     bigint not null unique,
  language    text not null default 'ru' check (language in ('ru', 'en', 'az')),
  linked_at   timestamptz not null default now()
);

create table if not exists public.telegram_link_tokens (
  token       text primary key,
  user_id     uuid not null,
  expires_at  timestamptz not null
);
create index if not exists telegram_link_tokens_user_idx on public.telegram_link_tokens (user_id);

-- One notification message per order (edited instead of re-sent) + the last QR photo message.
create table if not exists public.telegram_qr_messages (
  order_id          uuid primary key,
  chat_id           bigint not null,
  message_id        bigint not null,
  qr_ref            text not null,
  photo_message_id  bigint,
  opened_at         timestamptz,
  updated_at        timestamptz not null default now()
);

alter table public.telegram_links       enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.telegram_qr_messages enable row level security;
revoke all on public.telegram_links, public.telegram_link_tokens, public.telegram_qr_messages from anon, authenticated;

grant select, delete on public.telegram_links to authenticated;
drop policy if exists telegram_links_own on public.telegram_links;
create policy telegram_links_own on public.telegram_links
  for all to authenticated using (user_id = auth.uid());
-- tokens / messages: service role only (Edge Function).

-- Issues a short-lived one-time token for t.me/<bot>?start=link_<token>.
create or replace function public.stackd_telegram_link_token()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid(); v_token text;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  delete from public.telegram_link_tokens where user_id = v_user or expires_at < now();
  -- gen_random_uuid() is core (no pgcrypto/search_path dependency): 122 random bits, 32 hex chars.
  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into public.telegram_link_tokens (token, user_id, expires_at) values (v_token, v_user, now() + interval '15 minutes');
  return v_token;
end $$;

revoke all on function public.stackd_telegram_link_token() from public, anon;
grant execute on function public.stackd_telegram_link_token() to authenticated;

commit;
