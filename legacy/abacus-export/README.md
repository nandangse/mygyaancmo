# Abacus export (20-Oct-2026) — docs archive

The Abacus build's **application code now lives at `/cmomygyaanai`** (the deployable app, with the
database-per-tenant architecture added on 22-Oct-2026). This folder keeps the export's documents:
the history, the install guides and the planning/wiki records.

`legacy/` and `cmomygyaanai/` are excluded from the root `tsc` and `eslint` runs.

## What's here

| Path | Contents |
| --- | --- |
| `CONSOLIDATED_HISTORY.md` | Start here: product, modules built, architecture, decisions, sources |
| `INSTALL_SELF_HOST.md` | Original self-host guide (generic India VPS) |
| `BUNDLE_README.md` | The export bundle's own README |
| `HOSTINGER_DEPLOY.md` | **The deployment runbook for the Hostinger VPS** |
| `database/schema_only.sql` | DDL of the Abacus database at export time, no rows |
| `docs/` | Scope, master plan, handover, build notes, 20-page project wiki (Markdown only) |

## Deliberately left out

- **`database/full_dump.sql` and `data_only_inserts.sql`** — they contain real user records
  (emails, password hashes, set-password tokens). Keep them off GitHub; store them privately and
  restore them straight onto the server if needed.
- **`.docx` / `.pdf` copies** of the docs — duplicates of the Markdown files here.
- **`node_modules`** — never included in the export.

## Hosting on Hostinger

The target is Hostinger. Points to settle before buying a plan:

1. **Plan type: KVM VPS, not shared/web/cloud hosting.** The app is a long-running Node.js
   server on PostgreSQL. Hostinger's shared and Cloud web-hosting plans give no root access and
   offer MySQL, not PostgreSQL. A **KVM 2** (2 vCPU, 8 GB RAM) or larger is the floor: a Next.js 16
   production build of this size needs roughly 4 GB RAM.
2. **Location: India.** Pick the India data centre when creating the VPS, so code and data sit in
   India (DPDP; decision 4.1 in `CONSOLIDATED_HISTORY.md`).
3. **OS: Ubuntu 24.04.** Then follow `INSTALL_SELF_HOST.md` §1–6 as written (Node 20, PostgreSQL,
   Nginx, certbot, PM2).
4. **DNS:** point an A-record for `cmo.mygyaan.ai` at the VPS IP before running certbot. Set
   `NEXTAUTH_URL=https://cmo.mygyaan.ai`.
5. **Fix before `yarn install`:** `app/.yarnrc.yml` points `globalFolder` at
   `/opt/hostedapp/node/yarn/global`, an Abacus-only path. Delete that line (and the
   `nmMode: hardlinks-global` line) on the server.
6. **Fix before go-live:** `app/next.config.js` lists Abacus preview hosts in `allowedDevOrigins`
   and sets `typescript.ignoreBuildErrors: true`; drop the hosts and plan to turn type-checking back on.

Still tied to Abacus (they leave India or stop working once off the platform) — replace per
`INSTALL_SELF_HOST.md` §7:

| Dependency | Where | Replace with |
| --- | --- | --- |
| LLM calls → `apps.abacus.ai/v1/chat/completions` | `app/api/tenant/[tenant]/icp/generate`, `lib/` | Any OpenAI-compatible endpoint, e.g. Claude via an India-region provider |
| Notification email → `apps.abacus.ai/api/sendNotificationEmail` | audit email, partner apply, projection routes | SMTP or Mailer Cloud (`lib/email.ts`) |
| Script `apps.abacus.ai/chatllm/appllm-lib.js` | `app/layout.tsx` | Remove |
| Images on `cdn.abacus.ai` | `scripts/seed.ts` (book covers) | Re-host in your own S3-compatible bucket |
| File storage (`AWS_*`) | `lib/s3.ts` | S3-compatible bucket in Mumbai (`ap-south-1`) |

Database-per-tenant (decision 4.2) is implemented in `/cmomygyaanai` — see its README.
