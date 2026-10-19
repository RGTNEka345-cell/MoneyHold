# Customer login

Run `npm run migrate:customer-sessions` in backend against the existing customer database, then restart the backend. No accounts or passwords are changed.

Endpoints: POST `/api/customer/login`, GET `/api/customer/me`, POST `/api/customer/logout`. Active, email-verified customers only. Correct credentials for an unverified account direct the frontend to email verification. Successful OTP verification also creates a customer session.

Sessions use HttpOnly SameSite=Lax cookies with Secure in production and random tokens hashed in MySQL. Normal sessions last up to 8 hours; Remember me lasts 7 days. Logout revokes the stored session. All protected requests recheck expiry, verified email and active status. Seller cookies and legacy customer JWTs cannot authorize these endpoints.

Frontend `/customer/account` (alias `/customer/dashboard`) is protected; navbar links show the signed-in state. Sessions are checked on page load, window focus and every minute. Profile data is read-only in this stage. No cart, order history or password recovery is implemented yet.

Use matching hosts (localhost on both frontend/backend), configure CLIENT_URL to the frontend origin and use HTTPS in production. Credentialed requests require an allowed Origin for writes. Multi-instance production setups need a shared login rate-limit store. Expired database sessions can be periodically removed.

`node --test tests/customerAuth.test.js` covers wrong credentials, unverified/inactive accounts, origin checks, expiry, seller isolation, logout, and OTP session creation without sending mail or modifying real accounts.
