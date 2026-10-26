# Customer profile and saved addresses

Run `npm run migrate:addresses` from `backend`, then restart the backend. The migration is safe to repeat. No existing customer or order data is changed.

Customers manage their profile and addresses at `/customer/account`. First name, last name and phone are editable; the verified login email is read-only. Phone numbers remain unique. Password and email changes are outside this feature.

Up to 10 addresses can be saved. The first address becomes the default. Selecting another default or deleting the current default keeps exactly one default while the book is nonempty. Address mutations are serialized per customer. Version checks reject stale edits with HTTP 409; the UI lets the customer reload explicitly without silently replacing drafts. Creation request keys prevent duplicate addresses on retries.

Checkout offers saved addresses and initially fills the default only if delivery fields have not been edited. Customers can still enter an address manually. Subsequent background updates never replace checkout input automatically. Orders retain their own delivery snapshot; editing or deleting a saved address does not change previous orders.

Authenticated routes under `/api/customer`:

- `GET /profile`, `PATCH /profile` (firstName, lastName, phone, version)
- `GET /addresses`, `POST /addresses` (delivery fields, label, isDefault, requestKey)
- `PUT /addresses/:id` (delivery fields, label, isDefault, version)
- `PATCH /addresses/:id/default`, `DELETE /addresses/:id` (version)
- `GET /profile/events` (private account invalidations)

All data access is scoped to the authenticated customer, with the existing origin checks. Account events use the existing single-process event bus; multi-instance hosting will need shared event distribution. Focus refresh is also supported. Address details are not broadcast in events.

Verification: `node --test tests/customerProfile.test.js` from backend uses a uniquely named temporary database and removes it on completion; MySQL test credentials need CREATE/DROP DATABASE privileges. Frontend component tests cover saved-address selection and preservation of edited checkout fields.
