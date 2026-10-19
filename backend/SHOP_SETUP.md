# Customer shop

Public routes live under `/api/shop`: GET `/products`, `/products/:id`, `/categories`, `/images/:id`, and `/events` (SSE). No seller cookie is needed. Product lists, details, photos and category counts are restricted to active products. Prices and stock come from the catalog tables; no new migration is required.

Listing parameters: `q` (name/description), `category` (ID), `stock=true`, `sort=newest|price_asc|price_desc`, `page` (12 results per page). All SQL values are bound parameters; sort expressions are allowlisted. Responses are not cached so newly deactivated products stop being served.

Frontend routes: `/shop`, `/shop/:id`. The homepage's featured section uses real active products. Size/colour selection shows current inventory, including sold-out combinations. See CART_SETUP.md and CHECKOUT_SETUP.md for cart and COD checkout setup.

Catalog change events refresh customers' lists/details automatically, including after reconnect. This shares the existing single-process event bus; multiple backend instances require shared pub/sub. Restart the backend after deploying these routes. Existing active products immediately appear; drafts remain seller-only.

Checks: `node --test tests/catalog.test.js tests/sellerAuth.test.js` includes public draft/photo visibility, search, stock filtering, detail retrieval and live event tests using a temporary database.
