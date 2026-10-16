# Seller access

From `backend`, run `npm run setup:seller`. This applies the additive seller/session migration to the database configured in `.env`, then prompts for a name, email, and visible password (12+ characters, at most 72 UTF-8 bytes). Password characters appear in the terminal while typing; passwords are still bcrypt-hashed before storage. Existing seller accounts are never overwritten. No public seller registration or default password exists.

Restart the backend and visit `http://localhost:3000/seller/login`. Login redirects to `/seller/dashboard`. Product/order tools are labelled coming soon; this implementation covers seller authentication and dashboard access only.

Sessions are random tokens in HttpOnly, SameSite=Lax cookies, with only their SHA-256 hashes stored in MySQL. Normal sessions expire after 8 hours; Keep me signed in uses 7 days. Logout revokes the session server-side. Every protected API request checks the seller's active status. Customer JWTs cannot authorize seller requests.

Keep frontend/backend on the same site (use localhost consistently in development), set CLIENT_URL to the exact frontend origin, and use HTTPS with NODE_ENV=production in deployment. Mutating seller requests require an allowed Origin. For multi-instance deployments replace the in-memory login rate-limit store with a shared store. Expired sessions can be periodically removed using `DELETE FROM seller_sessions WHERE expires_at < NOW()`.

Run `node --test tests/sellerAuth.test.js` for HTTP tests using an isolated in-memory model; these do not create real seller accounts.
