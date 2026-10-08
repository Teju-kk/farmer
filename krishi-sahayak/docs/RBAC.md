# Roles and Access Control

Krishi Sahayak uses one authentication system and one password per account. The backend reads each user's current role and active status from PostgreSQL for every authenticated request; a role claim in a signed token is not used to grant permissions. Role or active-status changes increment the user's session version and revoke existing sessions.

## Roles

| Feature | Admin | Farmer | Marketer |
| --- | --- | --- | --- |
| Admin dashboard and user counts | Yes | No | No |
| User search/details and account activation | Yes | No | No |
| Create marketer accounts | Yes | No | No |
| Grant or promote to Admin | Bootstrap only | No | No |
| Own account settings, password, export, deletion | Own account | Own account | Own account |
| Farm, crop, finance, bills, schemes, assistant, weather | No | Own records | No |
| Product catalog | Public catalog read | Read and demo cart/order | Public catalog read |
| Harvest listings | No | Own listings | Public details only |
| Make offers on harvest listings | No | No | Yes |
| Review/respond to offers on own listings | No | Own listings only | No |
| Notifications | Own notifications | Own notifications | Own notifications |

Administrators receive aggregate platform counts and limited user account details. The admin UI does not expose private farm records or bill contents. Market listings expose only the harvest details intentionally posted by the farmer; they do not expose farmer identifiers, contact information, farms, bills, or other private records. A farmer can only list or answer offers attached to that farmer's own listings.

## Account creation

- Public registration always creates a `FARMER`. Any submitted `role` field is ignored by the registration schema and service.
- Administrators use the dedicated `/admin/login` page. The regular `/login` page is for farmers and marketers and will direct administrator accounts to the dedicated page. Both pages use the same backend credential verification; the administrator page accepts a session only when the server returns the `ADMIN` role.
- Marketers are created by an authenticated administrator. The application generates a random unusable temporary password and requests a secure password-reset/setup email. If mail delivery is unavailable, the account is created but cannot be used until an administrator configures email and the marketer completes a password reset.
- There is no public marketer or admin registration flow.
- Create the first production administrator with `npm run admin:create -w backend`. The command requires an interactive terminal, the exact confirmation phrase, a strong password entered without echo, and verifies there is no active administrator. It does not print the password.
- Local demo seeding creates a random password for each demo account and prints those development-only credentials once. Seeding requires `NODE_ENV=development`, `ALLOW_DEMO_SEED=true`, and a loopback PostgreSQL host. Never use demo seeding in production.

## Migration

The migration `20261007120000_three_role_rbac` changes the enum without deleting account rows: existing admins remain admins, farmers remain farmers, and legacy buyer/supplier/service-provider roles map to marketers. It creates an optional marketer profile table. Review `backend/prisma/migrations/20261007120000_three_role_rbac/migration.sql` before applying to any shared database. Apply through the normal migration deployment command only after a verified backup and target check:

```sh
npm run db:generate
npm run db:migrate:deploy
```

Do not use `prisma migrate reset` on a database with user data.

## Local verification

Use a non-production database configured in `backend/.env`, then run:

```sh
npm test
npm run lint
npm run build
```

The API tests cover default farmer registration even when a forged role is submitted, role-bearing login results, role-only routes, farmer record ownership, marketer offer visibility/response, bill boundaries, password reset, and account lifecycle.
