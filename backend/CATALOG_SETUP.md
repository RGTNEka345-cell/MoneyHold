# Catalog and stock

Run `npm run migrate:catalog` from backend to create the catalog tables in the configured database. This migration is additive and preserves existing data. Restart the backend after installing dependencies. Visit `/seller/catalog` after signing in.

Categories support add/edit; products support add/edit, active/draft status and a required category. Active products need at least one photo. Upload up to four JPEG/PNG/WebP photos, 5 MB each. Images are decoded, resized and re-encoded to JPEG, with bytes stored in MySQL and served through seller-authenticated image routes. They are not yet connected to the public storefront. Photos removed during product editing are deleted on successful save.

Each product has unique size/colour variants with non-negative integer stock. Existing variant identities are preserved for future order references; stock zero disables availability. Product versions and database transactions prevent concurrent edits from silently overwriting stock. A stale form must be cancelled and reopened with fresh data.

Seller catalog lists receive server-sent events for changes on the same backend process and refresh after saves and window focus. Draft forms are not replaced by background refreshes. Event streams reconnect every minute to recheck authentication. For multiple backend instances, use a shared event broker before deploying this feature at scale.

Run `node --test tests/catalog.test.js tests/sellerAuth.test.js`. The catalog test creates an isolated timestamped test database and drops only that database afterward; it requires CREATE/DROP DATABASE privileges and does not change the application's catalog data.
