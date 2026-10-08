# Database workspace

The canonical Prisma schema and seed script are maintained in `../backend/prisma/` because the Express backend owns all database access. Prisma migration history is generated in that same folder with:

```powershell
npm run db:migrate -- --name init
```

Use PostgreSQL in development; SQLite is intentionally not used so development matches the production data model.
