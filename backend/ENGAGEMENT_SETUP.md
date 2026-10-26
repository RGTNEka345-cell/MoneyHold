# Reviews and wishlist

Run `npm run migrate:engagement` from backend and restart. Product pages offer Save to wishlist and reviews. My Account links to `/customer/wishlist` (login required). Saved items are product-level, not size/colour reservations. Customers choose variants on the product page. Maximum 100 saved products; duplicate saves are idempotent. Hidden products remain removable but cannot be opened or newly saved; hard-deleted products are removed by foreign keys.

Only customers with a delivered order containing the product may write a review. One review per customer/product, 1–5 stars, 5–2000 characters. Customers can edit/delete only their own review; version checks reject conflicting edits. Reviews publish immediately without seller approval; seller moderation/reporting is not included. Verified purchase means an order was delivered, not that the item was never returned. Public responses show only first name, text, stars and creation time; email, phone and customer ID are excluded. React renders review text as text, not HTML. Public review pages show 10 entries plus the overall average/count.

Authenticated routes: GET /api/customer/wishlist, PUT/DELETE /api/customer/wishlist/:productId; GET/PUT/DELETE /api/customer/reviews/:productId. Review writes include rating, body and version (0 for new). Public: GET /api/shop/products/:productId/reviews?page=1.

Account and catalog SSE invalidations refresh saved/review data without page reload. Existing event bus is single-process; multi-instance deployments need shared events. Review writes are rate limited. Test: `node --test tests/engagement.test.js` creates and removes an isolated database; no email is sent.
