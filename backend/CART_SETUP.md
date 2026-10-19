# Customer shopping bag

Run `npm run migrate:cart` in `backend`, then restart the backend. The customer and catalog tables must already exist. The migration creates `carts` and `cart_items`; it does not replace existing tables.

Customers select a colour and size on `/shop/:id`, then add a quantity. `/customer/cart` requires a customer session. Bags are stored per customer in MySQL and survive logout. Repeated additions combine the same variant.

API under `/api/customer/cart`: GET `/`, GET `/events`, POST `/items` with `{variantId, quantity}`, PATCH `/items/:id` with `{quantity}`, DELETE `/items/:id`. Mutations validate ownership, product availability and stock on the server. Quantity is 1–99; maximum 100 variants per bag. Prices come from products, not request data. Cart actions never reserve or decrement inventory.

Private SSE invalidations refresh bag count and contents on changes, including catalog price/stock changes. This uses the existing single-process event emitter; multiple backend workers need shared pub/sub. Mutations made directly in SQL do not emit events. SSE reconnects every minute and focus also refreshes data.

COD checkout and order management are now available: see CHECKOUT_SETUP.md for migrations and the required delivery fee configuration. Deleted variants cascade out of carts; inactive products remain flagged until removed.

Verification: `node --test tests/cart.test.js` uses an isolated timestamped database and removes only that test database. Requires local MySQL and CREATE/DROP DATABASE permissions. Frontend: `npm test -- --watchAll=false`, `npm run build`.
