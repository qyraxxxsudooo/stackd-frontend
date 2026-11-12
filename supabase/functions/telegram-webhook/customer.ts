// Customer side of the Stackd bot (account linking + "Your QR code is ready" + secure QR reveal).
// Imported by index.ts; every dependency is injected so the logic can be tested without Telegram or Supabase.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnyRecord = Record<string, any>;
export interface Deps {
  db: SupabaseClient;
  telegram: (method: string, payload: Record<string, unknown>) => Promise<any>;
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const short = (id: unknown) => String(id ?? "").slice(0, 8).toUpperCase();
const money = (v: unknown) => `${(Number.isFinite(Number(v)) ? Number(v) : 0).toFixed(2)} AZN`;
const clock = (iso: unknown) => new Date(String(iso)).toLocaleTimeString("ru-RU", { timeZone: "Asia/Baku", hour: "2-digit", minute: "2-digit" });

/** /start link_<token> from a private chat: binds this Telegram chat to the site account that created the token. */
export async function linkCustomer({ db, telegram }: Deps, message: AnyRecord, token: string): Promise<void> {
  if (message.chat?.type !== "private") return;
  const { data, error } = await db.rpc("stackd_consume_telegram_link", { p_token: token, p_chat_id: message.chat.id });
  if (error) console.error("link failed:", error.message);
  await telegram("sendMessage", {
    chat_id: message.chat.id, parse_mode: "HTML",
    text: data === true
      ? "<b>Telegram подключён</b>\nКак только оператор подтвердит заказ, QR-код придёт сюда."
      : "Ссылка недействительна или устарела. Создайте новую в настройках на сайте STACKED.",
  });
}

/** Called after the admin QR is stored and the order is "ready". Sends one notification per order. */
export async function notifyQrReady({ db, telegram }: Deps, orderId: string): Promise<boolean> {
  if (!UUID_RE.test(orderId)) return false;
  const { data: order } = await db.from("orders").select("id,user_id,total,status,qr_expires_at,qr_notified_at").eq("id", orderId).maybeSingle();
  if (!order || order.status !== "ready" || order.qr_notified_at) return false;
  const { data: link } = await db.from("telegram_links").select("chat_id").eq("user_id", order.user_id).maybeSingle();
  if (!link) return false;
  // Claim first: a retried webhook must not send a second message.
  const { data: claimed } = await db.from("orders").update({ qr_notified_at: new Date().toISOString() }).eq("id", order.id).is("qr_notified_at", null).select("id").maybeSingle();
  if (!claimed) return false;
  try {
    await telegram("sendMessage", {
      chat_id: link.chat_id, parse_mode: "HTML", protect_content: true,
      text: `<b>Ваш QR-код готов!</b>\n\nЗаказ <b>№ ${short(order.id)}</b> · ${money(order.total)}\nПокажите QR-код при получении.${order.qr_expires_at ? ` Он действует до ${clock(order.qr_expires_at)}.` : ""}`,
      reply_markup: { inline_keyboard: [[{ text: "Открыть мой QR-код", callback_data: `qr:${order.id}` }]] },
    });
    return true;
  } catch (error) {
    await db.from("orders").update({ qr_notified_at: null }).eq("id", order.id);
    console.error("QR notification failed:", error);
    return false;
  }
}

/** Callback "qr:<orderId>". callback_data carries only an order id; ownership is verified on the server every time. */
export async function openQr({ db, telegram }: Deps, callback: AnyRecord): Promise<void> {
  const answer = (text: string, alert = true) => telegram("answerCallbackQuery", { callback_query_id: callback.id, text, show_alert: alert }).catch(() => {});
  const message = callback.message;
  const match = /^qr:([0-9a-f-]{36})$/i.exec(String(callback.data || ""));
  // Private chats only, never groups or channels.
  if (!match || !UUID_RE.test(match[1]) || message?.chat?.type !== "private" || String(message.chat.id) !== String(callback.from?.id)) return void await answer("Недоступно.");
  const { data: link } = await db.from("telegram_links").select("user_id,chat_id").eq("chat_id", callback.from.id).maybeSingle();
  if (!link) return void await answer("Аккаунт не подключён. Откройте ссылку из настроек сайта.");
  const { data: order } = await db.from("orders").select("id,status,qr_code_url,qr_expires_at,qr_tg_photo_message_id").eq("id", match[1]).eq("user_id", link.user_id).maybeSingle();
  if (!order) return void await answer("Заказ недоступен.");
  const expired = !order.qr_expires_at || new Date(order.qr_expires_at).getTime() <= Date.now();
  if (order.status !== "ready" || !order.qr_code_url || expired) {
    await answer(order.status === "ready" ? "Срок действия QR-кода истёк." : "QR-код больше недоступен.");
    await telegram("editMessageReplyMarkup", { chat_id: message.chat.id, message_id: message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return;
  }
  const { data: signed, error } = await db.storage.from("order-qrs").createSignedUrl(order.qr_code_url, 120);
  if (error || !signed?.signedUrl) return void await answer("Не удалось открыть QR-код. Попробуйте позже.");
  await answer("Открываю QR-код…", false);
  if (order.qr_tg_photo_message_id) await telegram("deleteMessage", { chat_id: link.chat_id, message_id: order.qr_tg_photo_message_id }).catch(() => {});
  const sent = await telegram("sendPhoto", {
    chat_id: link.chat_id, photo: signed.signedUrl, parse_mode: "HTML", protect_content: true,
    caption: `<b>QR · № ${short(order.id)}</b>\nДействует до ${clock(order.qr_expires_at)} (Баку)\nПокажите на выдаче.`,
  });
  if (sent?.message_id) await db.from("orders").update({ qr_tg_photo_message_id: sent.message_id }).eq("id", order.id);
  await telegram("editMessageReplyMarkup", { chat_id: message.chat.id, message_id: message.message_id, reply_markup: { inline_keyboard: [[{ text: "Показать QR снова", callback_data: `qr:${order.id}` }]] } }).catch(() => {});
}
