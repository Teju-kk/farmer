# Production Launch Checklist

## Before deployment

- [ ] Source repository pushed to a Git provider accessible to Vercel and Render
- [ ] Vercel project created from repository root; `vercel.json` detected
- [ ] Render Web Service created from `render.yaml`
- [ ] Controlled release environment ready for production migrations
- [ ] Production PostgreSQL created
- [ ] `DATABASE_URL` configured on the backend service
- [ ] `JWT_SECRET` configured with a unique random value of at least 32 characters
- [ ] `FRONTEND_URL` configured to the exact HTTPS frontend origin
- [ ] `VITE_API_URL` configured to the HTTPS backend URL ending in `/api`
- [ ] `VITE_SUPPORT_EMAIL` configured to a real monitored public address
- [ ] Supabase project and Storage bucket created
- [ ] Supabase bucket is private; no public access enabled
- [ ] `STORAGE_PROVIDER=supabase` configured on backend
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` configured only on backend
- [ ] Resend configured and `RESEND_API_KEY` kept server-side
- [ ] Sender domain verified and `EMAIL_FROM` configured
- [ ] `SUPPORT_EMAIL` configured on backend and `VITE_SUPPORT_EMAIL` configured for frontend build
- [ ] Commercial Open-Meteo key configured as backend `WEATHER_API_KEY`
- [ ] Optional `AI_API_KEY` configured only if assistant is enabled
- [ ] `TRUST_PROXY_HOPS` matches the backend host's documented proxy topology
- [ ] `NODE_ENV=production` configured; host-assigned `PORT` forwarded to API
- [ ] Migrations reviewed and production backup confirmed before `npm run db:migrate:deploy`
- [ ] `npm run db:migrate:deploy` applied to the verified production database before API traffic is enabled
- [ ] Demo seed command excluded from production deployment
- [ ] Privacy, Terms, and About placeholders completed and jurisdiction-specific review obtained
- [ ] Actual backup and object-retention periods recorded in privacy notice
- [ ] HTTPS and custom domains prepared for frontend and backend
- [ ] Static host SPA fallback configured for direct client-side routes

## After deployment

- [ ] Backend `/api/health` works and reports ready
- [ ] Frontend loads over HTTPS
- [ ] Registration works
- [ ] Login works
- [ ] Logout works and session is rejected afterward
- [ ] Password reset request is generic and reset email arrives
- [ ] Password reset token expires and cannot be reused
- [ ] Support form validates and message arrives at support inbox
- [ ] Weather works with provider credentials, or shows unavailable state
- [ ] AI works if enabled; without a key the rest of the app remains usable
- [ ] Bill upload works
- [ ] Bill download works for its owner
- [ ] Bill deletion removes the object
- [ ] Cross-user bill access is denied using two accounts
- [ ] Account export works
- [ ] Account deletion works and revokes sessions/removes associated bill objects
- [ ] Invalid route displays the 404 page
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Browser console has no application errors
- [ ] API logs contain no secrets, reset tokens, or sensitive provider payloads
- [ ] CORS rejects an unconfigured origin
- [ ] No demo data or demo accounts exist in production

## Operator placeholders to resolve

- [ ] `[OPERATOR LEGAL NAME]`
- [ ] `[PRIVACY CONTACT EMAIL]`
- [ ] `[BACKUP RETENTION PERIOD]`
- [ ] `[SUPPORT CONTACT EMAIL]`
