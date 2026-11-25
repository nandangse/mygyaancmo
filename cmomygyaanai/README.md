# MyGyaan CMO portal — `cmo.mygyaan.ai`

Multi-tenant "CMO as a Service" platform. Next.js 16 + React 19, Prisma 6 on PostgreSQL, NextAuth v5.
Tenant #1 is Nandan GSE at `cmo.mygyaan.ai/nandan`; the admin console is `cmo.mygyaan.ai/admin`.

Deploying it: `../legacy/abacus-export/HOSTINGER_DEPLOY.md`. Product history and decisions:
`../legacy/abacus-export/CONSOLIDATED_HISTORY.md`.

## Database per tenant

Each company's data lives in **its own database**, pinned to the customer's region (decisions 4.1 and 4.2).

```
DATABASE_URL  →  cmo_registry        agencies, companies, users, logins, roles, billing, admin data
                 cmo_t_nandan   (in)  ┐
                 cmo_t_fabro    (in)  ├─ one DB per tenant: all its marketing data
                 <any-host>/db  (eu)  ┘  (on this server or any other Postgres, anywhere)
```

| Piece | Where |
| --- | --- |
| Registry client `prisma` | `lib/db.ts` → `lib/tenant-db.ts` |
| Tenant client | `ctx.db` from `resolveTenant()` in API routes; `getTenantDb(companyId)` in pages and libs |
| Which tables are which | `lib/tenant-models.json` (platform vs tenant) |
| Connection strings | `Company.dbUrlEnc`, AES-256-GCM with `TENANT_DB_KEY` (`lib/tenant-crypto.ts`) |
| Provisioning | `lib/tenant-provision.ts`: create DB → apply `prisma/tenant-schema.sql` → mirror Company/Agency rows → seed default KPIs |
| Admin | Create Company in `/admin/companies` picks region + optional Database URL; `POST /api/admin/companies/[id]/provision` re-provisions |
| CLI | `yarn tenant list \| provision <slug> \| mirror <slug> \| migrate-all` |

Rules when writing code:
- Tenant tables (contacts, lists, campaigns, …) go through `ctx.db` / `getTenantDb`, **never** `prisma`.
- Platform tables (users, memberships, feature flags, audit log, API keys, billing) go through `prisma`.
- A tenant DB holds a mirrored copy of its own `companies` + `agencies` rows so `companyId` FKs resolve;
  `prisma.company.update` keeps the mirror in sync.
- Cross-tenant admin views iterate tenants (see `app/admin/integrations/page.tsx`).

## Running locally

```bash
yarn install && yarn prisma generate
cp .env.example .env            # DATABASE_URL, TENANT_DB_ADMIN_URL, TENANT_DB_KEY, auth secrets, ADMIN_*
yarn prisma db push             # registry tables
yarn bootstrap                  # agency, admin login, integration catalogue, book summaries
yarn dev                        # then /admin/companies → Create Company
```

Schema changes: edit `prisma/schema.prisma` → `yarn tenant:ddl` (also runs on `yarn build`) →
`yarn tenant migrate-all` to push to the registry and every tenant database.

## CRM modules (added 25-Nov-2026)

| Page | What it does |
| --- | --- |
| `/[t]/dashboard` | 8 KPI tiles (qualified leads to sales first), lifecycle funnel, hot leads, triggers, activity, AMC renewals |
| `/[t]/contacts`, `/[t]/contacts/[id]` | List with KPI row, filters, fixed-width table; Contact 360 with enrichment ring, engagement health, tags, data-card groups, Activity/Deals/Emails/WhatsApp/Calls/Triggers/Notes tabs, edit drawer |
| `/[t]/accounts`, `/[t]/accounts/[id]` | Account list with ICP fit; Account 360 with account health, key contacts, fleet & install base |
| `/[t]/tags` | Tag vocabulary with one-click manufacturing taxonomy |
| `/[t]/automations`, `/[t]/automations/[id]` | Trigger → steps engine (email, WhatsApp, wait, condition, tags, score, webhook, goal), enrolment + re-entry rules, 3-panel builder, run log. Cron: `POST /api/webhooks/automation-tick` every 5 min with `x-tick-key` |
| `/[t]/icp` → Fit scoring | Weighted ICP rules (total 100) → `icpFit` on every account and contact |
| `/[t]/integrations` | Readiness OK/Fix panels (email, WhatsApp, AI) and sending-domain DNS verification (MX/SPF/DKIM/DMARC) |
| Email campaigns | Audience by account (ABM) and an open-pixel toggle |

Shared UI lives in `components/crm/` (page shell, KPI tile, score ring, health bars, data card, health check, pills, timeline, typeahead, filter bar, edit drawer, tag picker). Vocabulary and derived scores in `lib/crm.ts`; queries in `lib/crm-queries.ts`; engine in `lib/automations.ts`; fit in `lib/icp-scoring.ts`.

Local demo data for review: `yarn dev:seed nandan` (never on production).

## Still on Abacus services

AI calls, owner notification emails and the book-cover images still point at Abacus; see the table in `../legacy/abacus-export/README.md` for replacements.
