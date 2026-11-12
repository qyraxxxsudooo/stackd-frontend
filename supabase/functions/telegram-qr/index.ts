// STACKED · telegram-qr
// 1) Database Webhook (orders UPDATE) → when an order becomes "ready" with a QR, the customer gets
//    "Ваш QR-код готов!" in their private chat with an inline "Открыть мой QR-код" button.
// 2) Telegram webhook (or updates forwarded from an existing bot webhook):
//    - /start link_<token>  links the private chat to a site account (token from stackd_telegram_link_token()).
//    - callback "qr:<order uuid>" → answerCallbackQuery, ownership + status + expiry checks, then the QR
//      image is uploaded as a protected photo (no public or permanent links, nothing secret in callback_data).
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, QR_NOTIFY_SECRET
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.)
// Deploy with: supabase functions deploy telegram-qr --no-verify-jwt   (auth is done with the secrets above)
import { createClient } from 'npm:@supabase/supabase-js@2';

const BOT = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const TG_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
const NOTIFY_SECRET = Deno.env.get('QR_NOTIFY_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Lang = 'ru' | 'en' | 'az';
const T: Record<Lang, Record<string, string>> = {
  ru: {
    ready: 'Ваш QR-код готов!', order: 'Заказ', until: 'Действует до', show: 'Покажите QR-код на кассе — заказ выдадут сразу.',
    open: 'Открыть мой QR-код', opening: 'Открываю QR-код…', caption: 'QR-код заказа', expired: 'Срок действия QR-кода истёк.',
    expiredMsg: 'Срок действия QR-кода истёк', unavailable: 'QR-код недоступен для этого аккаунта.', below: 'QR-код отправлен ниже.',
    linked: 'Telegram подключён к вашему аккаунту STACKED. Сюда придёт QR-код, когда заказ будет готов.',
    linkBad: 'Ссылка устарела. Откройте сайт STACKED и нажмите «Подключить Telegram» ещё раз.',
    hello: 'Это бот STACKED. Подключите его на сайте в профиле: «Подключить Telegram».', baku: 'Баку',
  },
  en: {
    ready: 'Your QR code is ready!', order: 'Order', until: 'Valid until', show: 'Show the QR code at the counter to collect your order.',
    open: 'Open my QR code', opening: 'Opening your QR code…', caption: 'QR code for order', expired: 'This QR code has expired.',
    expiredMsg: 'QR code expired', unavailable: 'This QR code is not available for your account.', below: 'QR code sent below.',
    linked: 'Telegram is now linked to your STACKED account. Your QR code will arrive here when the order is ready.',
    linkBad: 'This link has expired. Open STACKED and press “Connect Telegram” again.',
    hello: 'This is the STACKED bot. Connect it from your profile on the website: “Connect Telegram”.', baku: 'Baku',
  },
  az: {
    ready: 'QR kodunuz hazırdır!', order: 'Sifariş', until: 'Etibarlıdır', show: 'Sifarişi almaq üçün QR kodu kassada göstərin.',
    open: 'QR kodumu aç', opening: 'QR kod açılır…', caption: 'Sifarişin QR kodu', expired: 'QR kodun müddəti bitib.',
    expiredMsg: 'QR kodun müddəti bitib', unavailable: 'Bu QR kod hesabınız üçün əlçatan deyil.', below: 'QR kod aşağıda göndərildi.',
    linked: 'Telegram STACKED hesabınıza qoşuldu. Sifariş hazır olanda QR kod buraya gələcək.',
    linkBad: 'Keçidin müddəti bitib. STACKED saytında «Telegram qoş» düyməsini yenidən basın.',
    hello: 'Bu STACKED botudur. Saytda profilinizdən qoşun: «Telegram qoş».', baku: 'Bakı',
  },
};
const lang = (v: unknown): Lang => (v === 'en' || v === 'az' ? v : 'ru');
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const short = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function same(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function tg(method: string, payload: Record<string, unknown> | FormData) {
  const res = await fetch(`https://api.telegram.org/bot${BOT}/${method}`, payload instanceof FormData
    ? { method: 'POST', body: payload }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.error(`telegram ${method} failed`, data.description);
  return data;
}

function bakuTime(iso: string, l: Lang) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const time = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Baku', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(d);
  return `${time} (${T[l].baku})`;
}

type Order = { id: string; user_id: string; total: number; status: string; qr_code_url: string | null; qr_expires_at: string | null };
const qrExpired = (o: Order) => Boolean(o.qr_expires_at && new Date(o.qr_expires_at).getTime() <= Date.now());

function readyText(o: Order, l: Lang) {
  const t = T[l];
  const lines = [`<b>${t.ready}</b>`, '', `${t.order} <code>#${short(o.id)}</code> · ${Number(o.total).toFixed(2)} AZN`];
  if (o.qr_expires_at) lines.push(`${t.until} ${esc(bakuTime(o.qr_expires_at, l))}`);
  lines.push('', t.show);
  return lines.join('\n');
}
const openKeyboard = (o: Order, l: Lang) => ({ inline_keyboard: [[{ text: T[l].open, callback_data: `qr:${o.id}` }]] });

// ───── QR image: read with the service role, never exposed as a URL ─────
async function qrBytes(o: Order): Promise<Blob | null> {
  const raw = String(o.qr_code_url || '');
  if (!raw) return null;
  if (/^https:\/\//i.test(raw)) {
    const u = new URL(raw);
    if (u.origin !== new URL(SUPABASE_URL).origin) return null; // only our own storage
    const res = await fetch(u); return res.ok ? await res.blob() : null;
  }
  // Private bucket objects must live under the owner's folder (same rule as app.js).
  const bucket = raw.startsWith(`${o.user_id}/`) ? 'order-qrs' : 'product-images';
  const { data, error } = await db.storage.from(bucket).download(raw);
  if (error) { console.error('qr download failed', error.message); return null; }
  return data;
}

// ───── 1. order became ready → notify the owner (one message per order, edited on change) ─────
async function onOrderUpdate(record: Order, old: Partial<Order> | null) {
  if (!record?.id || record.status !== 'ready' || !record.qr_code_url || qrExpired(record)) return { skipped: 'not_ready' };
  if (old && old.status === 'ready' && old.qr_code_url === record.qr_code_url && old.qr_expires_at === record.qr_expires_at) return { skipped: 'unchanged' };
  const { data: link } = await db.from('telegram_links').select('chat_id,language').eq('user_id', record.user_id).maybeSingle();
  if (!link) return { skipped: 'not_linked' };
  const l = lang(link.language);
  const ref = `${record.qr_code_url}|${record.qr_expires_at ?? ''}`;
  const { data: prev } = await db.from('telegram_qr_messages').select('chat_id,message_id,qr_ref').eq('order_id', record.id).maybeSingle();
  if (prev && prev.qr_ref === ref) return { skipped: 'already_sent' };
  if (prev && Number(prev.chat_id) === Number(link.chat_id)) {
    const edited = await tg('editMessageText', { chat_id: link.chat_id, message_id: prev.message_id, text: readyText(record, l), parse_mode: 'HTML', reply_markup: openKeyboard(record, l) });
    if (edited.ok) { await db.from('telegram_qr_messages').update({ qr_ref: ref, updated_at: new Date().toISOString() }).eq('order_id', record.id); return { ok: true, edited: true }; }
  }
  const sent = await tg('sendMessage', { chat_id: link.chat_id, text: readyText(record, l), parse_mode: 'HTML', reply_markup: openKeyboard(record, l), protect_content: true });
  if (!sent.ok) return { ok: false };
  await db.from('telegram_qr_messages').upsert({ order_id: record.id, chat_id: link.chat_id, message_id: sent.result.message_id, qr_ref: ref, updated_at: new Date().toISOString() });
  return { ok: true };
}

// ───── 2a. callback "qr:<uuid>" ─────
async function onCallback(cq: any) {
  const chat = cq.message?.chat;
  const orderId = String(cq.data || '').slice(3);
  const { data: link } = await db.from('telegram_links').select('user_id,language,chat_id').eq('chat_id', cq.from?.id).maybeSingle();
  const l = lang(link?.language);
  // Private chat only, the chat must be the linked one, and the order must belong to that user.
  if (!link || chat?.type !== 'private' || Number(chat.id) !== Number(link.chat_id) || !UUID.test(orderId)) {
    return tg('answerCallbackQuery', { callback_query_id: cq.id, text: T[l].unavailable, show_alert: true });
  }
  const { data: order } = await db.from('orders').select('id,user_id,total,status,qr_code_url,qr_expires_at').eq('id', orderId).eq('user_id', link.user_id).maybeSingle<Order>();
  if (!order || order.status !== 'ready' || !order.qr_code_url) {
    return tg('answerCallbackQuery', { callback_query_id: cq.id, text: T[l].unavailable, show_alert: true });
  }
  if (qrExpired(order)) {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: T[l].expired, show_alert: true });
    await tg('editMessageText', { chat_id: chat.id, message_id: cq.message.message_id, parse_mode: 'HTML',
      text: `<b>${T[l].expiredMsg}</b>\n\n${T[l].order} <code>#${short(order.id)}</code>` });
    const { data: m } = await db.from('telegram_qr_messages').select('photo_message_id').eq('order_id', order.id).maybeSingle();
    if (m?.photo_message_id) await tg('deleteMessage', { chat_id: chat.id, message_id: m.photo_message_id });
    return;
  }
  await tg('answerCallbackQuery', { callback_query_id: cq.id, text: T[l].opening });
  const img = await qrBytes(order);
  if (!img) return tg('sendMessage', { chat_id: chat.id, text: T[l].unavailable });

  // Replace the previous QR photo instead of stacking duplicates in the chat.
  const { data: m } = await db.from('telegram_qr_messages').select('photo_message_id').eq('order_id', order.id).maybeSingle();
  if (m?.photo_message_id) await tg('deleteMessage', { chat_id: chat.id, message_id: m.photo_message_id });
  const form = new FormData();
  form.append('chat_id', String(chat.id));
  form.append('photo', img, `stacked-${short(order.id)}.png`);
  form.append('parse_mode', 'HTML');
  form.append('protect_content', 'true');
  form.append('reply_to_message_id', String(cq.message.message_id));
  form.append('caption', [`<b>${T[l].caption} #${short(order.id)}</b>`, order.qr_expires_at ? `${T[l].until} ${esc(bakuTime(order.qr_expires_at, l))}` : '', T[l].show].filter(Boolean).join('\n'));
  const sent = await tg('sendPhoto', form);
  if (sent.ok) {
    await db.from('telegram_qr_messages').upsert({
      order_id: order.id, chat_id: chat.id, message_id: cq.message.message_id, qr_ref: `${order.qr_code_url}|${order.qr_expires_at ?? ''}`,
      photo_message_id: sent.result.message_id, opened_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  }
}

// ───── 2b. /start link_<token> ─────
async function onMessage(msg: any) {
  if (msg.chat?.type !== 'private') return; // never answer or send QR into groups
  const l = lang(String(msg.from?.language_code || '').slice(0, 2));
  const m = /^\/start(?:@\w+)?\s+link_([0-9a-f]{32})$/i.exec(String(msg.text || '').trim());
  if (!m) { if (/^\/start\b/.test(String(msg.text || ''))) await tg('sendMessage', { chat_id: msg.chat.id, text: T[l].hello }); return; }
  const { data: tok } = await db.from('telegram_link_tokens').delete().eq('token', m[1].toLowerCase()).gt('expires_at', new Date().toISOString()).select('user_id').maybeSingle();
  if (!tok) return tg('sendMessage', { chat_id: msg.chat.id, text: T[l].linkBad });
  await db.from('telegram_links').delete().eq('chat_id', msg.chat.id).neq('user_id', tok.user_id);
  await db.from('telegram_links').upsert({ user_id: tok.user_id, chat_id: msg.chat.id, language: l, linked_at: new Date().toISOString() });
  return tg('sendMessage', { chat_id: msg.chat.id, text: T[l].linked });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  if (!BOT) return json({ ok: false, error: 'not_configured' }, 500);
  const tgHeader = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  const auth = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false }, 400); }

  if (TG_SECRET && same(tgHeader, TG_SECRET)) {
    try {
      if (body.callback_query && String(body.callback_query.data || '').startsWith('qr:')) await onCallback(body.callback_query);
      else if (body.message) await onMessage(body.message);
    } catch (e) { console.error('telegram update failed', e); }
    return json({ ok: true }); // always 200 so Telegram does not retry-storm
  }
  if (NOTIFY_SECRET && same(auth, NOTIFY_SECRET)) {
    if (body.table !== 'orders' || body.type !== 'UPDATE') return json({ ok: true, skipped: 'ignored' });
    return json(await onOrderUpdate(body.record, body.old_record));
  }
  return json({ ok: false }, 401);
});
