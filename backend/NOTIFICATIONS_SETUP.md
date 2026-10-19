# Order notifications and customer emails

Run `npm run migrate:notifications` in backend **before restarting the API with this code**. The existing customer/seller/order/history tables are required. New orders and status transitions atomically create notifications plus one durable email job per history event. Replayed checkout requests do not duplicate them. Existing past orders are not backfilled and no historical emails are sent.

Customer navbar and seller dashboard/catalog/orders show a bell, unread count, paginated inbox and explicit Mark as read. Updates use private authenticated SSE with 60-second reconnects and focus refresh. Reads/updates are scoped by role and recipient ID. Seller new-order notifications go to currently active sellers; status notifications go to the owning customer. This follows the project's single-store seller model.

`GET /api/{customer|seller}/notifications?page=1`, `GET .../notifications/events`, `PATCH .../notifications/:id/read`. Existing origin/session checks apply. Event delivery currently uses the single-process emitter; multiple API workers require shared pub/sub for immediate UI updates.

## Email worker

`npm run dev` / `npm start` starts the worker with the API. It polls every 15 seconds, claims up to ten jobs sequentially per tick, and sends confirmation/status emails using the existing SMTP/EMAIL credentials. Email includes the order number, saved item names/prices, totals, delivery address, and COD wording. No SMTP request runs inside checkout. A database enqueue failure rolls the transaction back instead of losing the notification; SMTP failures do not affect saved orders.

Jobs persist across restarts. Atomic claims and five-minute leases prevent ordinary concurrent-worker duplication. Failed sends retry with exponential backoff (1, 2, 4, 8 minutes), up to five attempts, then stay failed for inspection. Expired leases are recoverable. SMTP is **at least once**, not exactly once: if the provider accepts mail and the process crashes before recording success, a retry can duplicate delivery. Stable Message-ID helps identification but is not a guarantee of provider deduplication. `sent` means accepted by SMTP, not proof of inbox delivery. Delayed status messages may arrive out of order; My Orders shows the current state.

`MAIL_FALLBACK=true` records `simulated` jobs and does NOT send email or log the customer's email/address. Keep it false for real delivery. Test SMTP settings without disclosing credentials.

Inspect queue health with:

```sql
SELECT id, order_id, event_status, status, attempts, last_error, available_at
FROM order_email_jobs ORDER BY id DESC LIMIT 50;
```

After fixing SMTP credentials/network issues, retry one failed/simulated job:

```text
npm run retry:order-email -- JOB_ID
```

This command does not reset sent/processing jobs. Do not manually requeue accepted emails unless a duplicate is intentional. Error storage is restricted to safe codes; SMTP responses/credentials are not stored in queue errors. Notification/email records contain order-related personal data: apply the store's retention/access policies.

## Verification

`node --test tests/orders.test.js tests/orderEmail.test.js` uses an isolated database, injected mail transport and no real email sends. Coverage includes authorization, idempotent creation, unread state, HTML escaping, retries, lease recovery, concurrency, fallback handling and order persistence after send failure. Frontend notification tests cover SSE, read updates and keyboard dismissal. Live SMTP inbox delivery and browser visual QA must be checked separately; they were not performed automatically.
