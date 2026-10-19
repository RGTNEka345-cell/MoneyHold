# COD checkout and orders

## Setup

1. Ensure customer, seller, catalog and cart tables already exist.
2. Run `npm run migrate:orders` from `backend`. It creates orders, order_items and order_status_history without replacing existing data.
3. Set `CHECKOUT_DELIVERY_FEE_LKR` in **backend/.env** to the store's chosen fixed delivery fee. For example, `350` means LKR 350; `0` explicitly enables free delivery. Blank/invalid values disable checkout with a clear message. The implementation does not choose a fee on behalf of the store.
4. Restart the backend. Customer: bag → checkout → order confirmation / My Orders. Seller: dashboard → Orders.

Delivery is currently Sri Lanka only with a fixed configured fee. Area-based fees, online payment, courier integration and returns are not included. Order notifications and automated customer emails are now available; see NOTIFICATIONS_SETUP.md and run its migration before using the updated order code. COD is the payment method; delivered status does not verify cash collection or settlement.

## Correctness and access

- All customer order endpoints require the existing verified/active customer session and scope queries by customer ID. Seller endpoints require the existing seller session and mutating-origin checks.
- `GET /api/customer/orders/quote` returns server prices, quantity, fee, total and a fingerprint. `POST /api/customer/orders` accepts `{requestKey, quoteToken, paymentMethod: 'cod', delivery: {name, phone, addressLine1, addressLine2, city, postalCode, country: 'LK'}}`.
- Checkout locks the customer, products and variants, revalidates the bag and prices, snapshots order lines, decrements stock, increments catalog versions and clears the bag in **one transaction**. Failures roll back every change. No stock reservation occurs while merely reviewing the form.
- A changed quote requires renewed review. The fingerprint is not an authentication token; ownership and pricing are independently derived from the session/database.
- A unique customer/request key prevents duplicate orders on retry. The request payload hash detects incompatible reuse. Browser session storage retains only an opaque request key, not the delivery address. On reload or uncertain failure, the customer can recover the committed order via `/orders/request/:key` or My Orders.
- `GET /orders` is paginated (20/page), `GET /orders/:id` returns snapshots plus status history. Equivalent list/detail seller endpoints are under `/api/seller/orders`.
- Seller PATCH `/api/seller/orders/:id/status` takes `{status, expectedStatus}`. Allowed progression: placed → processing → shipped → delivered. Cancellation is permitted from placed/processing only, atomically restores stock once, and cannot be reversed here. Deleted ordered variants block automatic cancellation to prevent silent inventory loss.
- Order/address snapshots persist independently of subsequent product edits. Orders and order items are not cascade-deleted when a customer or catalog entry is removed.
- Private SSE updates customer history and seller lists; catalog/cart invalidations reflect stock changes. As with the existing cart, the event emitter assumes one backend process; use shared pub/sub for multiple workers.

## Verification

`node --test tests/checkoutValidation.test.js tests/orders.test.js`

Integration tests use a new timestamped `money_hold_orders_test_*` database and drop only that database in cleanup. No real customer orders are created. Requires local MySQL with CREATE/DROP DATABASE and CREATE TRIGGER permissions.

Manual acceptance: set your intended fee, add an in-stock variant, place a COD order, confirm cart is empty and stock reduced, open My Orders and seller Orders in separate tabs, progress/cancel the order and observe updates. Check mobile layout and keyboard navigation. No browser visual verification was performed in this environment.
