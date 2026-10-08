# Database

`backend/prisma/schema.prisma` is the source of truth. It models users and role profiles, farm/crop lifecycle, marketplace and ordering, selling/offers, finance/bills/documents, schemes/payments, healthcare/transport, notifications and future AI conversations.

Run `npm run db:generate`, then `npm run db:migrate -- --name init` against a configured PostgreSQL database. Seeded rows are explicitly demo data and must never be presented as live market, weather, scheme, or benefit data.

