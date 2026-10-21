# MyGyaan CMO Portal — Full Export Bundle

**Generated:** 20-Oct-2026 · **Owner:** Dr Raghu · **Product:** cmo.mygyaan.ai

This is a complete, self-contained export of the MyGyaan CMO portal: the full source code, the database, the entire project history with its sources, and a step-by-step guide to running it on your own server in India.

## Read in this order

1. **`CONSOLIDATED_HISTORY.md`** — START HERE. The whole story from the beginning: what the product is, every module built, the architecture, the decisions (India residency, database-per-tenant, Company-Brain secrecy), the domain model, what is and isn't built, and **the sources every fact came from**. (PDF and Word copies are alongside it.)
2. **`INSTALL_SELF_HOST.md`** — how to stand the app up on an India VPS: prerequisites, database load, build, Nginx + SSL, replacing the Abacus-provided services for full India residency, and **how to implement the database-per-tenant / movable-per-country architecture**.

## What's in this bundle

```
.
├─ README.md                     <- this file
├─ CONSOLIDATED_HISTORY.md       <- master history + architecture + sources (+ .pdf/.docx)
├─ INSTALL_SELF_HOST.md          <- self-hosting / deployment guide
├─ app/                          <- COMPLETE application source code
│   ├─ app/  components/  lib/  hooks/  types/  public/  scripts/
│   ├─ prisma/schema.prisma      <- the full data model (102 tables)
│   ├─ package.json  yarn.lock   <- dependencies (run `yarn install` to restore node_modules)
│   └─ .env.example              <- environment template (NO real secrets — fill in your own)
├─ database/
│   ├─ full_dump.sql             <- schema + all current data (use to restore everything)
│   ├─ schema_only.sql           <- DDL only (table structure)
│   └─ data_only_inserts.sql     <- readable column-level INSERTs of the data
└─ docs/                         <- every prior planning & reference document
    ├─ MYGYAAN_CMO_MASTER_PLAN.md/.docx
    ├─ MYGYAAN_CMO_SCOPE.md/.docx
    ├─ CMO_PORTAL_HANDOVER.md/.pdf/.docx
    ├─ Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md
    ├─ BUILD_NOTES_project_instructions.md   <- dated module build notes
    └─ project_memory_wiki/      <- the full 20-page project knowledge wiki
```

## Notes

- **No secrets are included.** `.env.example` has placeholders only; fill in real values on your server. The database dump contains no third-party API keys (those tables are empty).
- **`node_modules` is not included** (it is ~hundreds of MB and machine-specific). Run `yarn install` to recreate it from `yarn.lock`.
- Seed account passwords are supplied via `SEED_*` environment variables at seed time — change them after first login.
- The app is **Next.js 16 + React 19 + PostgreSQL (Prisma) + NextAuth v5**. It needs a **Node.js VPS/Cloud server** (not shared hosting).

For anything unclear, `CONSOLIDATED_HISTORY.md` §13 lists exactly where each fact originated.
