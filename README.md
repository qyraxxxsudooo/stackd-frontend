# Stacked — Food Deals & Ordering in Baku

Stackd is a food deals and ordering platform based in Baku, Azerbaijan.

Website: https://stackd-frontend.vercel.app/

## What is Stacked?

Stackd provides a platform where users can discover food offers,
browse a product catalog, search for items, add products to their cart
and place orders.

After an order is processed and confirmed by an operator,
a QR code becomes available in the user's account.

## Main Features

- Food deals and product catalog
- Search and product categories
- Shopping cart and order checkout
- Order history and status
- QR codes for confirmed orders
- User accounts and profiles
- Discounts and product availability
- Three interface languages: Russian, Azerbaijani and English

## Location

Baku, Azerbaijan.

## Languages

- English
- Русский
- Azərbaycan dili

## Technology

- HTML
- CSS
- JavaScript
- Supabase
- Vercel
- Telegram integration

## Search Keywords

Stacked, Stacked Baku, Stacked Azerbaijan, food deals Baku,
food offers Baku, food ordering Baku, Stacked QR,
QR code orders, скидки на еду Баку, Stackd Азербайджан.

## Official Website

https://stackd-frontend.vercel.app/

## Promo codes and Telegram QR notifications (setup)

Server code lives in `supabase/`; nothing there is applied automatically.

1. **Database** — run in the Supabase SQL editor, in order:
   - `supabase/migrations/20261112120000_promo_codes.sql` — promo tables with RLS, `stackd_promo_preview`, `stackd_checkout` (wraps the existing `checkout_order` in one transaction, idempotent by request id, row-locked limits), release of a use on cancellation.
   - `supabase/migrations/20261112121000_telegram_qr.sql` — Telegram chat links and one-time link tokens.
   Until the first migration is applied the site keeps using `checkout_order` directly and promo codes report "temporarily unavailable".
2. **Edge Function** — `supabase functions deploy telegram-qr --no-verify-jwt`, with secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `QR_NOTIFY_SECRET`.
3. **Database Webhook** — Database → Webhooks: table `orders`, event `UPDATE`, target the `telegram-qr` function, header `Authorization: Bearer <QR_NOTIFY_SECRET>`.
4. **Bot webhook** — if the bot has no webhook yet: `setWebhook` to the function URL with `secret_token=<TELEGRAM_WEBHOOK_SECRET>`. If another webhook already serves the bot, forward to this function every `callback_query` whose data starts with `qr:` and every `/start link_…` message, sending the same secret header.
5. **Site** — Catalog → Site settings → "Telegram bot for QR notifications": enter the bot username. Customers then use "Connect Telegram" in the profile menu.
