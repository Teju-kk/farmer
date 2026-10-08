# API

Base path: `/api`. Responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`. Authenticated requests send `Authorization: Bearer <token>`. Every protected request checks the current database account status and role. `401` means missing/invalid/expired authentication; `403` means the authenticated role lacks permission. See [RBAC.md](RBAC.md) for the permission matrix.

## Authentication and account

- `POST /auth/register` creates a FARMER account; client-supplied roles are not accepted as authority.
- `POST /auth/login`, `GET /auth/me`, `POST /auth/password/forgot`, `POST /auth/password/reset`, and authenticated `POST /auth/password/change`.
- `GET /account/export`, `PATCH /account/profile`, and password-confirmed `DELETE /account` are scoped to the authenticated user's own account.

## Farmer

FARMER-only routes include `GET|POST /farms`, `GET|PATCH|DELETE /farms/:id`, `GET|POST /crops`, `GET|PATCH|DELETE /crops/:id`, `POST /crops/:id/activities`, `GET /finance/summary`, `GET|POST /income`, `GET|POST /expenses`, `GET|POST|PATCH|DELETE /schemes`, `GET /weather`, `POST /assistant`, and `GET|POST /bills`, `GET /bills/:id/file`, `DELETE /bills/:id`.

Farmer marketplace routes are `GET /listings/mine`, `POST /listings`, `DELETE /listings/:id`, `GET /farmer/offers`, and `PATCH /farmer/offers/:id`. Records and offers are filtered by the authenticated owner on the server.

## Marketer

MARKETER-only routes are `GET /marketer/summary`, `GET|PATCH /marketer/profile`, `GET /marketer/listings`, `GET /marketer/offers`, and `POST /marketer/listings/:listingId/offers`. Listing reads return public harvest fields only. Marketers cannot read private farmer records or bills.

## Admin

ADMIN-only routes are `GET /admin/overview`, `GET /admin/users`, `GET /admin/users/:id`, `POST /admin/marketers`, and `PATCH /admin/users/:id`. Admin account changes revoke existing sessions. The API cannot promote or create an administrator; the first administrator uses the interactive bootstrap command. At least one active administrator must remain.

## Shared/public

`GET /health` checks API and PostgreSQL readiness. `POST /contact` is rate-limited and public. `GET /products` and `GET /categories` return catalog data. `GET|PATCH /notifications` routes require authentication and only access notifications belonging to that account. Farmer cart and checkout routes are farmer-only: `GET /cart`, `POST /cart/items`, `DELETE /cart/items/:productId`, and `POST /orders/checkout`.
