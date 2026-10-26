# Customer password recovery

Run `npm run migrate:password-resets` in backend and restart it. Set `CLIENT_URL` to the trusted frontend origin (HTTPS in production). Reset links use the first configured origin, never the incoming Host header. Existing SMTP / EMAIL credentials are reused. With MAIL_FALLBACK=true, development messages are printed rather than delivered; do not enable that in production.

Customer login links to `/forgot-password`. The emailed link opens `/reset-password#token=...`; the page removes the fragment from browser history and keeps the token only in memory. Refreshing that page requires opening the email link again. No token is stored in localStorage or sent in a query string.

- POST `/api/customer/forgot-password`: `{email}`. Uniform response for known, unknown, inactive and unverified accounts. Delivery runs after responding; a success response is not proof of SMTP delivery. Delivery failures log only an error code. Retry after 60 seconds if needed.
- POST `/api/customer/reset-password`: `{token,password,confirmPassword}`. Passwords follow registration's letter/number and minimum 8-character policy, with an explicit bcrypt maximum of 72 UTF-8 bytes.
- Cryptographically random tokens expire after 30 minutes; only their SHA-256 hashes are stored. A replacement invalidates the old link. Reset atomically changes the bcrypt password hash, consumes the token and deletes existing customer sessions. No automatic login or email-verification bypass.
- Both endpoints have IP rate limits; issuance also has a persisted 60-second account cooldown. For multi-instance production, use a shared rate-limit store. Delivery currently runs in-process, so interrupted sends require requesting a new link; durable mail queue integration can be added for deployment.

Seller recovery is deliberately not enabled by this customer feature. Test with `node --test tests/passwordReset.test.js`; it creates and removes an isolated test database and does not send email.
