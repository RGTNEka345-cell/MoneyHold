# Courier tracking

Run `npm run migrate:tracking` in backend before starting the updated API. Existing orders and notification migrations are prerequisites. This creates a separate order_tracking table without rewriting existing orders.

Seller → Orders → select an order → Courier tracking. Enter the courier name, tracking number and full official HTTPS tracking page URL. Courier name and the real tracking number are required; the tracking URL is optional. Missing URLs are stored as empty strings in the existing column, so no database alteration is needed. Customers still see the courier/reference; the Track parcel button appears only when a URL is present. This is one shipment per order; split shipments and courier API integration are not included.

Saving does not change order fulfilment status. Continue to mark processing/shipped/delivered separately. Cancelled and delivered orders cannot be edited. Repeated identical saves do not create duplicate notification/email events. Concurrent edits are rejected using a version check; reload saved details before editing again.

`PATCH /api/seller/orders/:id/tracking` accepts `{courierName, trackingNumber, trackingUrl, version}`. Version is 0 initially. Existing seller authentication and origin protection apply. The authenticated order detail endpoints expose `tracking` to the owning customer/seller only.

Tracking saves atomically record a `tracking_updated` history event plus a customer notification and durable email job. The order's delivery status remains unchanged. The visual delivery timeline ignores non-status events. Existing private order SSE refreshes customer and seller screens. Email uses the latest tracking details when prepared, so delayed emails do not preserve superseded links.

My Orders shows the courier, reference and a Track parcel button opening a new tab with noopener/noreferrer. The destination hostname is displayed explicitly. Only public-format HTTPS URLs without credentials, IP literals or custom ports are accepted. URLs are not fetched by the backend; domain ownership and courier legitimacy are not automatically verified. Seller must supply the courier's official website, not an arbitrary redirect/shortener. A tracking page may require the customer to enter the displayed reference manually. Cancelled orders retain the reference but hide the button.

Tests: `node --test tests/trackingValidation.test.js tests/orders.test.js`. Integration tests use an isolated database and mock email delivery, not real orders/emails. Live courier tracking pages and browser visual layout were not externally verified.
