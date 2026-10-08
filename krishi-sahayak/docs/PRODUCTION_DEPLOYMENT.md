# Production Deployment

This guide describes the selected deployment layout for the existing React/Vite + Express + Prisma application. `vercel.json` configures the static frontend build and SPA fallback. `render.yaml` configures the API build, start, readiness, and secret prompts. Database migrations remain a separate, explicit release step. No production provider has been provisioned or live-tested from this repository.

## Recommended architecture

- **Frontend:** Vercel static hosting, with `vercel.json` in the repository root.
- **API:** Render Node.js Web Service, configured by `render.yaml`.
- **Database:** Neon managed PostgreSQL is the recommended independent database. The API uses Prisma; the database is not Supabase. Render PostgreSQL is also compatible if co-location is preferred.
- **Bill files:** private Supabase Storage bucket.
- **Email:** Resend for recovery and support forwarding.
- **Weather:** commercial Open-Meteo API from the backend.
- **AI:** optional OpenAI Responses API, called only by the backend.

Keep the Vite frontend and Express API as separate deployed services. The browser talks to the API at `VITE_API_URL`; the API permits only the exact origins in `FRONTEND_URL`. All non-`VITE_` credentials belong only in the backend service environment.

## Build and runtime commands

Run commands from the repository root (`krishi-sahayak/`):

```sh
npm ci --include=dev
npm run db:generate
npm run build
```

Use `--include=dev` in the build/release environment because the Prisma CLI used for client generation and migrations is currently a development dependency. The generated Prisma Client and `@prisma/client` runtime are included in the backend build.

The backend build is `npm run build -w backend`; the frontend local build is `npm run build -w frontend`. For a deployable static asset bundle, use the guarded production command shown below. Static assets are written to `frontend/dist/`.

This workspace currently has no `.git` directory or configured remote. Push the existing project to a Git repository accessible to both providers before importing it; do not include `.env` files. Connect that repository to Render and apply `render.yaml`; keep the repository root as the service root. The manifest configures:

- Build command: `npm ci --include=dev && npm run db:generate && npm run build -w backend`
- Start command: `npm start -w backend`
- Health check path: `/api/health`

The manifest deliberately does not run migrations automatically. Before the first API deploy, run `npm run db:generate` and `npm run db:migrate:deploy` from a controlled release environment with the verified production `DATABASE_URL` and a current backup. Do not run Prisma development migrations (`db:migrate`) on production. The API binds to Render's assigned `PORT` (fallback `4000`).

Vercel reads the root `vercel.json`. Add the project with repository root as its root directory. The production-only command in that file validates the public API URL and support contact before Vite emits assets; it refuses missing, non-HTTPS, IP/local, or reserved-example API URLs:

- Install/build command: `npm ci --include=dev && npm run build:production -w frontend`
- Publish directory: `frontend/dist`
- SPA fallback: serve `/index.html` for client-side routes such as `/login`, `/privacy`, and `/my-farm`.

Set `VITE_API_URL` and `VITE_SUPPORT_EMAIL` in the frontend build environment before building. These are public build-time settings, not secrets. Changing either requires a new frontend build/deploy.

## Production environment

### Frontend build variables

| Variable | Required | Value |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public API base URL ending in `/api`, e.g. `https://api.<your-domain>/api` |
| `VITE_SUPPORT_EMAIL` | Yes | Public, monitored support/privacy contact. Must match the operator's intended public contact. |

Never define backend credentials as `VITE_*`; Vite embeds those values in public browser assets.

### Backend service variables

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | Production PostgreSQL connection string from your managed database |
| `JWT_SECRET` | Yes | Unique cryptographically random secret, at least 32 characters; do not reuse a development value |
| `FRONTEND_URL` | Yes | Exact HTTPS frontend origin(s), without path, comma-separated if needed, e.g. `https://app.example.com` |
| `PORT` | Host assigned | Leave to the API host unless it explicitly requires a configured port |
| `TRUST_PROXY_HOPS` | Yes | Exact count of trusted reverse proxies between the client and Express. Use the host's documented topology; do not guess or trust arbitrary forwarded headers. |
| `JWT_EXPIRES_IN` | Optional | Session lifetime; defaults to `7d` |
| `RESEND_API_KEY` | Yes | Server-only Resend API key |
| `EMAIL_FROM` | Yes | Sender identity on a domain verified in Resend, e.g. `Krishi Sahayak <noreply@example.com>` |
| `SUPPORT_EMAIL` | Yes | Destination inbox for contact form submissions |
| `WEATHER_API_KEY` | Yes | Commercial Open-Meteo credential, backend only |
| `STORAGE_PROVIDER` | Yes | `supabase` |
| `SUPABASE_URL` | Yes | Supabase project URL (`https://...supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role secret, backend only |
| `SUPABASE_STORAGE_BUCKET` | Yes | Exact pre-created private bucket name |
| `AI_API_KEY` | Optional | OpenAI API key; only configure if exposing the assistant |
| `AI_MODEL` | Optional | Responses API model identifier; defaults to `gpt-4o-mini` |

`backend/.env.example` is the non-secret template for backend and provider variables. `.env.example` at the root is for frontend build variables. Never copy live credentials into either example file.

## Database provisioning and migrations

1. Create a Neon production PostgreSQL project/database (or another managed PostgreSQL instance) in a region near the Render service. Enable the provider's TLS and automated backups.
2. Copy its connection URL into the API host's secret environment as `DATABASE_URL`. Use the provider's runtime connection URL (not an admin/migration URL unless their docs require it). If the provider requires pooled runtime connections, follow its Prisma guidance and retain a direct connection URL for migrations if needed.
3. The Render build command runs `npm ci --include=dev` and `npm run db:generate` using this repository's lockfile; generation itself does not require connecting to the production database.
4. Apply checked-in migrations once, as a release step against the intended production DB:

   ```sh
   npm run db:migrate:deploy
   ```

   This command applies pending migrations; inspect migration SQL and confirm a database backup first. Do not point it at an unknown database. It was not run against a production database as part of this preparation.
5. The API's `/api/health` route executes `SELECT 1` and returns `503` when PostgreSQL is unavailable. Production startup fails clearly if `DATABASE_URL` is missing.
6. Do not run `npm run db:seed` in production. The seed script explicitly exits in `NODE_ENV=production`; it creates demo users and records in development only. Existing development data is not changed by this guide.

## Private Supabase Storage setup

1. Create a Supabase project and open **Storage**.
2. Create a bucket named for `SUPABASE_STORAGE_BUCKET` (the template default is `krishi-bills`). Ensure **Public bucket is off**. Do not enable public object listing or public download URLs.
3. Keep the bucket private and do not grant broad anonymous policies. The API uses the service-role credential server-side; the application checks authentication, bill ownership, and the user-id prefix in the object key before download/delete.
4. Configure `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` only on the backend service. Never add the service-role key to frontend variables or client bundles.
5. Review Supabase's backup, object versioning, and retention options for the plan you choose. Database backups do not automatically prove object backups. Record actual retention in the privacy notice.
6. After deployment, test upload, download, and delete with two accounts. Confirm account A cannot fetch account B's bill and that deletion removes the private object. Mocked adapter tests are not live storage verification.

Uploads accept PDF, PNG, or JPEG based on file signatures, with a 5 MB limit. Object keys include the authenticated user ID plus a random UUID and validated extension; user-provided filenames are not used as storage paths.

## Resend setup

1. Create a Resend account and add the sending domain you control.
2. Publish the DNS records Resend provides and wait for domain verification.
3. Create a restricted API key for this application.
4. Set `RESEND_API_KEY`, `EMAIL_FROM` to an address on the verified domain, and `SUPPORT_EMAIL` to the support destination on the backend service. Set `VITE_SUPPORT_EMAIL` to the public contact shown in the frontend build.
5. Send a password recovery request and a support message after deployment; verify delivery and sender alignment. Recovery responses are generic regardless of account existence. Do not log or share reset links/tokens.

Email delivery has not been live-verified without provider credentials.

## Weather and optional AI

- **Weather:** create/enable a commercial Open-Meteo API credential, then set `WEATHER_API_KEY` only in the backend service environment. No client-side key is used. Requests time out; missing credentials/provider failures are surfaced as unavailable rather than fabricated conditions. Verify a real forecast after deploy.
- **AI:** the assistant is optional. If it is not part of launch, leave `AI_API_KEY` unset; other application features continue to work. To enable it, set `AI_API_KEY` and, if needed, `AI_MODEL` on the backend only. Verify a request after deploy. Do not publish provider error payloads or credentials.

## Domains, HTTPS, CORS, and proxy

1. Deploy API and frontend, then attach the intended custom domains using each host's instructions.
2. Enable HTTPS at both domains and wait for valid certificates before public testing.
3. Set frontend `VITE_API_URL=https://<api-domain>/api` and rebuild/redeploy the frontend.
4. Set backend `FRONTEND_URL=https://<frontend-domain>` to the exact origin (scheme + host + optional port only). For multiple exact origins, separate them with commas. Do not include a path or trailing slash.
5. Configure `TRUST_PROXY_HOPS` based on the actual proxy chain documented by the backend host. The value affects client IP handling and rate limits. Do not set a broad trust-proxy mode.
6. Verify the host forwards its assigned `PORT` to the Node process and uses `/api/health` for readiness.
7. Configure the static host's SPA fallback so direct visits and refreshes on React Router paths return `index.html`.

## Privacy and trust pages

Before public registration, replace every occurrence of these placeholders in Privacy, Terms, and About pages with operator-approved information:

- `[OPERATOR LEGAL NAME]`
- `[PRIVACY CONTACT EMAIL]`
- `[BACKUP RETENTION PERIOD]`
- `[SUPPORT CONTACT EMAIL]`

Do not invent the entity, contact, or retention schedule. Determine actual database and file backup retention with the hosting providers. Have counsel review the text for the jurisdictions where the service will operate. The current pages are templates and do not claim legal compliance.

## Post-deploy verification

Use non-sensitive test accounts and non-production records. Verify `/api/health` returns HTTP 200; registration, login, logout, password reset, export, and account deletion; support message delivery; weather; optional AI if enabled; bill upload/download/delete; cross-user file denial; unknown-route 404; and mobile, tablet, and desktop layouts. Review browser console, API logs, CORS behavior, and rate limiting. Do not use real customer data for smoke tests.
