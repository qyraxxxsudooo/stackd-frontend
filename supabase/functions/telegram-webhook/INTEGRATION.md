# Telegram webhook: three small edits to the deployed `index.ts` (v17)

Put `customer.ts` next to `index.ts`, then:

1. Imports (top of file):
   `import { linkCustomer, notifyQrReady, openQr } from "./customer.ts";`
   and after `createAdminClient()` is defined nothing else is needed: build deps where used: `{ db, telegram }`.

2. `handleCallback(db, callback)`, first lines (BEFORE the `isAdmin` check):
   ```ts
   if (String(callback.data || "").startsWith("qr:")) return openQr({ db, telegram }, callback);
   ```

3. `handleMessage(db, message)`, before `if (!isAdmin(message.chat, message.from)) {`:
   ```ts
   const linkStart = text.match(/^\/start(?:@\w+)?\s+link_([A-Za-z0-9_-]{16,64})$/);
   if (linkStart) return linkCustomer({ db, telegram }, message, linkStart[1]);
   ```

4. `handleQrReply`, right after the "QR СОХРАНЁН" admin `sendMessage` at the end:
   ```ts
   await notifyQrReady({ db, telegram }, order.id).catch((e) => console.error("customer notify failed:", e));
   ```

Also set `site_settings` row `tg_bot_username` (without @) so the site shows the "Connect Telegram" button.
