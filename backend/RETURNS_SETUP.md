# Returns and size exchanges

Run `npm run migrate:returns` in backend before restarting the updated API/worker. Requires existing order, tracking and notification migrations. No historical requests are created. A return is an after-delivery workflow separate from order fulfilment and payment.

## Customer

My Orders → order details → Returns & size exchanges. Choose a delivered order line, quantity, return/exchange, and a reason. A size exchange is another size of the same product and colour. Live stock is shown but not reserved. Request submission and approval do not deduct replacement stock or restock the original item. Wait for seller approval and return address/instructions before sending anything.

Only the order owner can submit/view requests. Combined active/completed requests cannot exceed the original delivered line quantity. Rejected requests release the quantity for another submission. One request concerns one order line; multiple requests support different items/quantities. Unique customer request keys protect identical retries; reuse with different content is rejected. Replacements are not treated as new purchasable order lines and cannot be returned again through this initial flow.

## Seller

Orders → select order → Returns & size exchanges. A new request also creates an unread seller notification.

- **Requested → Approved / Rejected:** enter a customer-visible decision. Approval note must include return address/instructions. No stock changes.
- **Approved → Received & inspected:** explicitly confirm the full parcel was physically received and inspected. Enter resellable units, 0–requested quantity; default is 0. Restock only these units, once. Damaged/unresellable units do not re-enter stock.
- **Received → Closed** (return): confirm closure. This does NOT issue or confirm a refund; arrange refunds separately.
- **Received → Replacement dispatched** (exchange): enter replacement courier/name/reference and optional HTTPS URL. The same-product/colour replacement must still exist, be active and have sufficient stock. Stock is atomically deducted at dispatch; no reservation occurs before that. If unavailable, leave the request open while resolving with the customer.
- **Dispatched → Closed:** seller explicitly confirms replacement delivery. The customer can use the replacement's own tracking card; the original order tracking remains unchanged.

Completed/rejected requests are terminal. No automatic returns/exchange cancellation, replacement-change or refund workflow is supplied. Short shipments should not be marked received as a full request; coordinate resolution with the customer first. Edits are version-checked and history preserves the decision, note, actor and timestamp. Original order totals, payment method and delivered status remain unchanged.

## Inventory and messaging

Every update locks the order/request; inventory writes follow product-before-variant locking. Inspection and dispatch stock changes, version increments, audit history, notifications and durable email jobs commit together. Failed writes roll back; stale/double actions cannot restock/deduct twice. Product version increments prevent old seller catalog forms overwriting the new stock.

Private order SSE refreshes requests; catalog SSE invalidates stock after inspection/dispatch. The existing single-process pub/sub limitation still applies. Non-fulfilment events (`return_*`) do not change the original delivery timeline. Messages direct the customer to My Orders for the latest request and instructions; no refund/payment completion is implied.

## Policy before launch

No arbitrary return window, fee, approval guarantee or legal policy is imposed. Only delivered status and quantity rules are enforced automatically; sellers review eligibility manually. Agree and publish return time limits, condition requirements, return address, exchange shipping charges and refund process before accepting live returns. Product photos and customer-uploaded evidence are not included in this step.

## API and tests

Customer POST `/api/customer/orders/:id/returns` with `{itemId,kind,quantity,reason,replacementVariantId,requestKey}`. Seller PATCH `/api/seller/orders/:id/returns/:returnId` with `{status,version,note}` plus `inspected:true,restockQuantity` on receipt, `tracking:{courierName,trackingNumber,trackingUrl}` on exchange dispatch, and `confirmed:true` on completion. Standard role/session/origin checks apply.

Authenticated order detail exposes `returns:{requests,options}` with request history and replacement choices. No public returns endpoint exists.

`node --test tests/returns.test.js tests/orders.test.js` uses isolated timestamped test databases and no real emails/orders. Tests cover authorization, delayed eligibility, quantity limits, idempotency, rollback, stale actions, one-time restock, damaged items, stock shortages and exchange dispatch. Browser visual QA and live courier delivery were not performed automatically.
