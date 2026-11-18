# STACKED: project map

Static site on Vercel (no build step) + Supabase (ref `wjlkztgmbqaflcdldapi`). Visible brand: **STACKED**. Technical names (repo, files, ids) keep `stackd`.

## Frontend files (load order matters: later layers wrap earlier globals)
| File | Role |
|---|---|
| `index.html` | Markup, dialogs (`#drawer` cart, `#orders`, `#topup`, `#detail`, `#auth`, `#editor` admin), settings panel, theme bootstrap |
| `app.js` | Core: state `S`, i18n (`translations`, RU/EN/AZ), catalog, cart, checkout, orders + QR, promo codes, top-up form, admin catalog |
| `stackd-enhancements.js/.css` | Profile menu, swipe-to-order, news, admin extras, translations of products, top-up history |
| `stackd-maintenance.js/.css` | Maintenance screen + its admin editor |
| `stacked-shop.js/.css` | Card stepper, cart dock (card stack), genie fly-to-cart, footer socials, product mini icons |
| `stacked-motion.js/.css` | `<stacked-logo>` web component, splash |
| `stacked-ui.js/.css` | Glass chrome, phone tab bar + bottom sheets, orange loaders, balance count-up, pending top-up indicator, quick amounts |

## Supabase
- Tables: `profiles(balance, role)`, `products`, `orders(items jsonb, total, status, qr_code_url, qr_expires_at, discount_amount, promo_*)`, `topups(status pending/approved/rejected)`, `site_settings(key,value)`, `slides`, `promo_codes`, `promo_redemptions`, `checkout_requests` (idempotency), `telegram_links`, `telegram_link_tokens`, `telegram_qr_messages`, `stackd_rate_limits`, `stackd_bot_settings`, `site_maintenance_settings`.
- Admin = `stackd_is_admin()` (JWT email check).
- RPC called by the site: `stackd_checkout(p_items, p_promo_code, p_request_id)`, `stackd_promo_preview(p_code, p_items)`, `cancel_order(order_uuid)`, `stackd_telegram_link_token()`, `stackd_rate_limit(...)`.
- `checkout_order(jsonb)` is internal only (no EXECUTE for API roles); `stackd_checkout` calls it. It validates qty > 0, availability, stock, balance, with row locks.
- Edge functions: `submit-topup` (multipart receipt upload), `notify-telegram` (order to operator), `telegram-webhook` (operator decisions, QR delivery).
- Storage buckets: `product-images` (admin write), `images` (admin write), `order-qrs` (owner read via signed URLs), `payment-proofs` (owner insert, admin read).

## Flows
- **Order:** cart → `stackd_checkout` → order `pending` → `notify-telegram` → operator → `qr_code_url` + `qr_expires_at` → card shows QR. Cancel allowed 2 min while pending (refund + stock back, row-locked).
- **Top-up:** form → `submit-topup` → row `pending` → operator approves in Telegram → balance credited. Site polls the user's own pending count and animates the balance.

## Security fixes applied (Nov 2026)
Removed `admin_add_balance` (anyone could credit any balance); hardened checkout (negative qty); top-up inserts only `pending` + positive amount; revoked anon EXECUTE on definer RPCs; trimmed table grants; `images` bucket writes admin-only; `cancel_order` locks the row.

## Testing
No test suite. QA is done with Playwright against a local mock of Supabase (the sandbox cannot reach supabase.co): iPhone 390, Android 360, tablet 768, desktop 1440, light and dark. Checks: no horizontal overflow, no console errors, fly-to-cart frames, tab bar sheets.
