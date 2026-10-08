# Krishi Sahayak

Krishi Sahayak is a farm workspace for keeping farm details, crop plans, income and expenses, bill files, scheme reminders, and harvest listings together. One authenticated application supports three server-authoritative roles: administrators manage accounts and platform summaries, farmers manage their own farm records, and marketers browse public harvest listings and send offers. English and Kannada are available across the core dashboards and role navigation.

## Current capabilities

- Farmer account registration, sign in, and session restoration
- Three-role access control (ADMIN, FARMER, MARKETER), server-side authorization, and admin-managed marketer onboarding
- Role-specific admin and marketer workspaces, with the existing farmer dashboard retained at `/farmer`
- Farmer-owned harvest offers and marketer responses using existing crop listing/offer data
- Password reset by email, signed-in password change, and revocation of old sessions
- Account profile editing, JSON data export, and password-confirmed account deletion
- Farm and crop records with ownership checks
- Income and expense records with a live balance summary
- Crop sale listings linked to a farmer's crop records
- Seed and fertilizer catalog with search, category filtering, and a demo cart/order flow
- English and Kannada dashboard and core form labels
- Private bill file upload, download, and deletion (PDF/PNG/JPEG, up to 5 MB; no OCR)
- Weather search and forecast via Open-Meteo
- Private, user-maintained government-scheme application tracker (not an official scheme directory)
- In-app notifications for saved farm actions
- Optional farm assistant through the server-side OpenAI Responses API
- Support contact form and public privacy notice
- Demo seed data for local development only

Weather forecasts use Open-Meteo; configure its commercial API key before production. Scheme records are a private user-maintained tracker, not an official catalog or eligibility decision. Bill files are private and owner-checked. Notifications are generated from saved farm actions. The farm assistant is available only when a server-side OpenAI API key is configured and returns general information, not diagnoses. The marketplace catalog and order flow are demos; there is no payment collection, supplier onboarding, or live stock guarantee.

## Stack

- React, Vite, React Router, Axios, and Lucide
- Express API with JWT authentication and Zod validation
- PostgreSQL with Prisma

## Local setup

Requirements: Node.js 20.19 or newer, npm, and PostgreSQL.

1. From this directory, install dependencies with `npm install`.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and a development `JWT_SECRET`. Copy `.env.example` to the project-root `.env` for the frontend. Email and weather integrations are optional locally; account recovery/contact sending needs email credentials, and weather uses the public endpoint only for local development.
3. Create the PostgreSQL database named `krishi_sahayak` or update the URL to your database.
4. Generate Prisma Client and apply pending migrations to the configured development database:

   ```sh
   npm run db:generate
   npm run db:migrate:deploy
   ```

   Optional local demo records use randomized credentials. Seed only a loopback development PostgreSQL instance, with explicit opt-in. In PowerShell, set `$env:NODE_ENV='development'` and `$env:ALLOW_DEMO_SEED='true'`, run `npm run db:seed`, then remove those two process variables. The command prints temporary demo passwords once. Demo seeding is blocked for production, non-development mode, and non-loopback databases.

5. Start the frontend and API with `npm run dev`. Vite listens on the local network, while the development API stays bound to this computer and is reached through Vite's `/api` proxy.
6. Open `http://localhost:5173` on this computer. To test on another phone or laptop connected to the same trusted Wi-Fi, find this computer's LAN IPv4 address with `Get-NetIPAddress -AddressFamily IPv4` and open `http://<LAN-IPv4>:5173`. If Windows Firewall prompts, allow Node/Vite on **Private networks only**. Do not expose the development server through router port forwarding or a public network. The API health check is available through the proxy at `http://localhost:5173/api/health`.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API / Prisma | PostgreSQL connection string, configured in `backend/.env` locally |
| `ALLOW_DEMO_SEED` | API seed command | Must be set to `true` together with `NODE_ENV=development` for explicitly opted-in, loopback-only demo seeding; keep it `false` otherwise |
| `JWT_SECRET` | API | Signing key; use a unique random value with at least 32 characters in production |
| `JWT_EXPIRES_IN` | API | Token lifetime, defaults to `7d` |
| `PORT` | API | HTTP port, defaults to `4000` |
| `FRONTEND_URL` | API | Allowed browser origin(s); separate multiple exact origins with commas |
| `TRUST_PROXY_HOPS` | API | Exact trusted reverse-proxy hop count for secure client IP/rate-limit handling; local default is `0` |
| `VITE_API_URL` | Frontend build | API base URL including `/api`; defaults to `http://localhost:4000/api` |
| `VITE_SUPPORT_EMAIL` | Frontend build | Public support/privacy contact shown in the UI; configure a monitored address |
| `RESEND_API_KEY` | API | Server-only Resend API key for password recovery and contact forwarding |
| `EMAIL_FROM` | API | Sender address verified by Resend |
| `SUPPORT_EMAIL` | API | Destination inbox for support contact requests |
| `WEATHER_API_KEY` | API | Commercial Open-Meteo key used only by the backend; required in production |
| `AI_API_KEY` | API | Server-side OpenAI key for the optional farm assistant; never expose it as a `VITE_*` variable |
| `AI_MODEL` | API | OpenAI model name, defaults to `gpt-4o-mini` |
| `STORAGE_PROVIDER` | API | `local` for development; production startup requires `supabase` |
| `SUPABASE_URL` | API | Supabase project URL for the private Storage REST API |
| `SUPABASE_SERVICE_ROLE_KEY` | API | Server-only service key; never put it in frontend variables |
| `SUPABASE_STORAGE_BUCKET` | API | Pre-created **private** bucket for bill objects |
| `UPLOAD_DIR` | API | Local-only development file directory; not used for production storage |

The root `.env.example` is for frontend build variables; `backend/.env.example` is for API, database, provider, and storage variables. Only `VITE_*` values are embedded in browser assets. Never put secrets in a `VITE_*` variable. Keep `.env` files out of source control.

## Roles and first administrator

Public registration always creates a farmer account. Admin accounts are not available through public registration. Create the first administrator from an interactive terminal with `npm run admin:create`; it requires an explicit confirmation, securely prompts for a strong password, and refuses to run if an active admin already exists. Afterward, admins can create marketers and send password setup links. See [docs/RBAC.md](docs/RBAC.md) for the permission matrix, data boundaries, bootstrap procedure, and migration notes.

The RBAC migration preserves existing records. Existing `ADMIN` and `FARMER` roles remain unchanged; legacy buyer, supplier, healthcare-provider, and transport-provider roles are mapped to `MARKETER`. The migration adds an optional marketer profile and never resets the database.

## Production build

```sh
npm run lint
npm test
npm run build
```

For a production frontend artifact, configure `VITE_API_URL` as the public HTTPS API URL ending in `/api` and `VITE_SUPPORT_EMAIL`, then run `npm run build:production -w frontend`. This guarded command rejects missing, localhost, IP-literal, reserved-example, or non-HTTPS API URLs and missing/placeholder support addresses. Run `npm test` only with a non-production `DATABASE_URL`; it creates and removes disposable accounts and checks health, access control, reset-token expiry/reuse, generic recovery, account export/deletion/session revocation, local bill upload/download/delete and cross-user denial, plus mocked Supabase storage requests. There is no deployed-browser E2E suite in this repository; production-domain workflows must still be tested after deployment.

## Deployment

See [Production Deployment](docs/PRODUCTION_DEPLOYMENT.md) for the recommended frontend/API/database/storage architecture, exact build/start/migration commands, provider configuration, domains, and smoke tests. Use the [Production Launch Checklist](docs/PRODUCTION_CHECKLIST.md) to track required manual setup and post-deploy verification.

The deployment files select Vercel for the static frontend (`vercel.json`), Render for Express (`render.yaml`), and Neon as the recommended managed PostgreSQL provider. Supabase Storage remains private for bills; Resend sends email; commercial Open-Meteo provides weather; OpenAI remains optional. No provider account, production database, custom domain, or live integration has been provisioned or verified from this workspace. Do not seed production with demo records.

The marketplace catalog/order workflow remains a demonstration, and the schemes area is a personal tracker rather than a verified government directory. The app does not claim legal compliance; legal placeholders must be replaced and reviewed before public registration.

## Screenshots

Screenshots will be added after a production deployment is configured.

## Known limits and follow-up work

- Automated browser end-to-end tests against deployed authentication and external providers
- Live weather and market data from documented, trusted sources
- Production supplier workflows and payment integration
- Verified official scheme directory and application eligibility integrations
- Bill OCR, if a future product/privacy review supports it
