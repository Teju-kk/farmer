# Architecture

Krishi Sahayak is a workspace monorepo: `frontend` is a React/Vite client, `backend` is an Express REST API, and `ai-service` is an isolated FastAPI boundary. PostgreSQL is accessed only through Prisma in the backend.

The API is organized as route → validation → controller → service → Prisma. Authentication verifies the signed JWT, then reloads the current account role, active status, and session version from PostgreSQL on every request. Route middleware enforces role access, and farmer services scope private records by the authenticated user ID rather than client-provided ownership fields. Bill downloads additionally check farmer ownership before reading private storage.

The frontend speaks to the backend through `src/services/api.js`; no frontend component accesses a database or backend secret directly. Role route guards are a UX boundary only; authorization is enforced by the API. Local bill storage is for development and production startup requires the private Supabase Storage adapter. See `docs/RBAC.md` for the permission matrix and provisioning rules.
