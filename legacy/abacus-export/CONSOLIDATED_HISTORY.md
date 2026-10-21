# MyGyaan CMO Portal — Consolidated History, Architecture & Knowledge Base

**Product:** CMO-as-a-Service multi-tenant marketing platform
**Live at:** https://cmo.mygyaan.ai (custom domain) and https://mygyaan-cmo.abacusai.app
**Owner:** Dr Raghu — MyGyaan
**First tenant / proof case:** Nandan GSE — `cmo.mygyaan.ai/nandan`
**Document generated:** 20-Oct-2026
**Purpose of this document:** A single, self-contained record of everything that has been built for the CMO portal, why it was built that way, the decisions behind it, and the sources every piece of information came from — written so the whole project can be rebuilt, understood, and self-hosted independently.

> This is the master index. Alongside it in this bundle you will find the full source code (`app/`), the database (`database/`), the self-host install guide (`INSTALL_SELF_HOST.md`), and every prior planning/handover document (`docs/`). Where a fact came from a specific earlier document or decision, the source is named inline or in **Section 13 — Sources**.

---

## 1. What the product is

One portal that runs a company's **entire marketing up to the MQL (Marketing Qualified Lead) stage**, then hands qualified leads to the customer's CRM of choice — or lets the customer keep working inside the portal. It is a single codebase and (today) a single database serving **many tenants**; every customer is a *company* parameterised in settings, with **no customer-specific code, ever**.

The portal is a **single source of truth for all marketing** at a tenant across **LinkedIn, Email, WhatsApp, Calls, SEO and SEM**.

Two sides to the product:

- **Organic / Intelligence** — knowledge base, interview, ICP builder, strategy, website & SEO audit, content and social calendar, LinkedIn posting, blogs, press releases.
- **Outbound** — customers upload contact databases; the portal segments and enriches them; sequences go out from one identity per company; replies come back into the portal; MQLs are handed off.

MyGyaan also powers **agencies**: an agency can bring its own customers onto the platform and run them. MyGyaan itself is the default agency. **Nandan GSE is tenant #1 and the proof case.**

*Source: MYGYAAN_CMO_SCOPE.md (build scope, 07-Oct-2026); Project Memory → Overview, Product Scope.*

---

## 2. Origin & planning history (chronological)

| Date | Milestone |
|---|---|
| **Early planning** | Product conceived as "CMO as a Service" for B2B companies (originally scoped as "B2B manufacturers"). Reference sites studied: **growsalt.com**, **youngcaesar.digital**, and the Aarvi × YoungCaesar example (https://aarvi-youngcaesar.netlify.app). An early Google-Sheet spec was set aside and explicitly ignored for planning. |
| **07-Oct-2026** | **Build scope finalised** (`MYGYAAN_CMO_SCOPE.md`). Phase 1/2/3 module breakdown, tenancy model, seven-role permission matrix, data model, and acceptance criteria written. Phase 1 build began the same day. |
| **09-Oct-2026** | **Master plan v1.1** produced (`MYGYAAN_CMO_MASTER_PLAN.md` + PDF + Word). Hosting decision recorded: **Abacus AI chosen** for building and hosting (over a Claude Code + Vercel + Supabase stack). First export archive created (`MyGyaan_CMO_v1.1_2026-10-09.zip`). Abacus support email drafted re: India hosting + per-tenant DB. |
| **10-Oct-2026** | **Handover document** produced (`CMO_PORTAL_HANDOVER.md`). Slice 1 (marketing site, admin console, tenant shells) live; all other modules built in preview awaiting deploy approval. |
| **11-Oct-2026** | Large deploy to both hostnames: security fixes (tenant-membership authorization, write-role gating, input hardening, env-supplied seed passwords); Marketing Plan module; Rule of One; admin company logo upload; Book Summaries + Books CMS (22 books); Partner page/banner/form + Partner Leads admin; public Testimonials page; prospect CSV upload on Lists; API Access page with tenant-scoped keys + `/api/v1` REST endpoints; **Voice module (Speed-to-Lead) in sandbox mode**. |
| **12–14-Oct-2026** | Landing-page messaging refinements; "Book a demo" popup; homepage polish. |
| **17-Oct-2026** | **Release v1.2** assembled: Workflows (Vault) module (all 3 phases), Email Campaigns, SEO Audit/KPIs, nav overhaul, Mailer Cloud email integration, user management in tenant Settings, Knowledge-Base "Add Document" 500 fix. LinkedIn module (4 tabs, sandbox) deployed live. |
| **18-Oct-2026** | Tenant **Audience page** + **co-branded frozen header** across all tenant pages live on both hostnames. Sidebar group-state persistence built in preview. |
| **Current** | Dr Raghu is moving the project **off the Abacus managed platform to self-hosting in India** (this export bundle). |

*Source: Project Memory → Status, Planning and Roadmap; docs/MYGYAAN_CMO_MASTER_PLAN.md; docs/CMO_PORTAL_HANDOVER.md.*

---

## 3. Core architecture

### 3.1 Tenancy & URLs

| Level | Entity | Example |
|---|---|---|
| Platform | MyGyaan | `cmo.mygyaan.ai` (platform admin + agency console) |
| Agency | `agencies` | MyGyaan (default), any partner agency |
| Company (tenant) | `companies` | `cmo.mygyaan.ai/nandan`, `cmo.mygyaan.ai/fabro` |

- The **public marketing site** lives at `cmo.mygyaan.ai`; it attracts customers via LinkedIn + email outreach.
- `cmo.mygyaan.ai/admin` is the **admin console**.
- `cmo.mygyaan.ai/<slug>` is each **per-company tenant instance**.
- Every company belongs to exactly one agency. Company slug is the URL path segment (lowercase `[a-z0-9-]`, unique, immutable after creation).
- **Tenants are 100% isolated** (separate contacts, campaigns, users). Every data row carries `companyId` and every query is scoped by it.
- `mygyaan.ai` is a **separate site** and is NOT the CMO portal. The CMO must never be deployed on mygyaan.ai.

### 3.2 Current data isolation model vs. the target

- **Today:** ONE shared PostgreSQL database with **row-level isolation** (`companyId` on every row) + application-level + role-level gating.
- **Target (absolute requirement — see Section 4):** **database-per-tenant** — each tenant gets its own physically separate database, pinnable to the customer's required region.

### 3.3 Versioning & release flow

- A version number is configured in admin and applied per customer.
- **Updates reach a customer only after their agreement** (customer-agreement rule). Current state: Nandan on v1.1, others on v1.0; Release v1.2 pending tenant-admin approval.

### 3.4 Pluggable channel model

- Channels are pluggable: a company can add multiple Email channels, multiple WhatsApp channels, and LinkedIn channels, with **no dependency on any one provider**.
- Each channel has a **name** and a **type** — SMTP (SMTP details) or API (access key) — added in the company's admin; each campaign chooses which channel to send from.

### 3.5 Technology stack (as actually built)

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives), lucide-react icons, framer-motion.
- **Database:** PostgreSQL via **Prisma ORM** (schema: `app/prisma/schema.prisma`, 102 tables).
- **Auth:** NextAuth v5 (`next-auth@5.0.0-beta`), credentials + Prisma adapter; helper at `app/auth.ts`, imported as `@/auth`.
- **AI:** LLM calls via an OpenAI-compatible client pointed at Abacus RouteLLM (swappable — see install guide).
- **File storage:** S3-compatible (AWS SDK v3).
- **Charts:** Chart.js, Recharts, Plotly.

> **Note on the original scope doc:** `MYGYAAN_CMO_SCOPE.md` (07-Oct) *assumed* a Supabase + Vercel stack. The project was actually built on the Abacus platform with **Next.js + Prisma + PostgreSQL + NextAuth**. Where the scope doc says "Supabase/RLS", the delivered equivalent is **Prisma + application/role-level scoping on `companyId`**. This export reflects what was actually built.

*Source: Project Memory → Architecture, Product Scope; app/package.json; app/prisma/schema.prisma; docs/CMO_PORTAL_HANDOVER.md.*

---

## 4. Foundational decisions (non-negotiable requirements)

These are the standing decisions recorded for the project. They must survive the migration.

### 4.1 Data residency (absolute, Dr Raghu)
Data residency is decided **per tenant at onboarding**, as a first-class step — not an afterthought.
- An India-based customer's data **must physically reside in India** (DPDP Act); a Europe-based customer's data must reside in their own region (EU/GDPR).
- The **core application code should be hosted in India**.
- Model: **one shared application (hosted in India) + each tenant's data store pinned to the customer's required region.**

### 4.2 Database-per-tenant (absolute, Dr Raghu, 09-Oct-2026)
Each tenant **must** have its own physically separate database — NOT the current shared-DB + row-level model.
- Rationale: strongest isolation; aligns with per-tenant data residency (each DB pinned to a region).
- Moving to DB-per-tenant requires: (a) a **tenant registry/catalog DB** mapping slug → that tenant's DB connection string + region; (b) **dynamic per-request DB connection routing** (a Prisma client per tenant); (c) a **provisioning step at onboarding** that creates + migrates a new DB per tenant; (d) **schema-migration fan-out** across all tenant DBs on every release.
- **This is the single biggest architectural change** the self-hosted build should plan for. See `INSTALL_SELF_HOST.md` → Section 8 for the recommended implementation path.

### 4.3 Company Brain is secret
The Company Brain is used **only by MyGyaan AI** and is **never shown or shared with users** (not even as readable content). Reason given: if shared, it will be stolen.

### 4.4 Hosting
Originally decided: Abacus AI as the single source for building and hosting (chosen over Claude Code + Vercel + Supabase). **Now superseded** by the decision to self-host in India (this bundle).

### 4.5 Scope boundary
The Blog, MyGyaan Cloud, Podcast, Feature Request and 99-day-plan page requests (and the Google-Doc book list) were meant for the **separate mygyaan.ai site**, not the CMO app. Nothing related to Nandan goes on mygyaan.ai unless Dr Raghu says so.

### 4.6 Access rule (standing constraint)
**Only the admin can see all records; other users cannot.** (Applies especially to any shared/discovery data such as the proposed Coresignal module.)

*Source: Project Memory → Decisions, Open Questions and Blockers.*

---

## 5. Roles & permissions

Seven roles. A user can hold several memberships; permissions are additive across memberships but never cross a scope the membership doesn't grant.

| Role | Scope | Data (read) | Data (write) | Settings | Billing |
|---|---|---|---|---|---|
| **MyGyaan admin** (platform_admin) | Platform | All | All | All incl. platform config, plans, flags | All |
| **Agency manager** | One agency | All its companies | All its companies | Agency + its companies | View |
| **Agency RM** | Allocated companies | Allocated only | Allocated only | Allocated company settings | View |
| **Client admin** | One company | None by default (toggle) | None | Own company (users, integrations, branding, identity) | View invoices, pay |
| **Client manager** | One company | All company data | All company data | Own company | View invoices |
| **Client user** | One company | All company data | All (no delete of records they didn't create; no exports unless granted) | None | None |
| **Client viewer** | One company | Read-only | None | None | None |

Implementation notes:
- `memberships` table carries `userId`, `scopeType` (`platform`|`agency`|`company`), `scopeId`, `role`, allocation for Agency RM.
- In code, `lib/tenant-access.ts` → `resolveTenant(tenant)` returns `{error,status}` OR `{session, company, role, isAdmin, userId}`. `ADMIN_ROLES = ['platform_admin','agency_manager','client_admin','client_manager']`.
- Every permission check must happen in the app's `can()` gate **and** at the data layer; the app gate must never be the only guard. (In the self-hosted DB-per-tenant model, physical DB separation becomes the strongest guard.)

*Source: MYGYAAN_CMO_SCOPE.md §3; app/lib/tenant-access.ts; docs/CMO_PORTAL_HANDOVER.md.*

---

## 6. Modules built (complete inventory)

All of the following are **built and in the codebase**. Deployment status as of this export is noted where relevant.

### 6.1 Platform & admin
- **Public marketing site** (homepage, positioning, pain points, "What you gain", Resources, Projection Calculator lead capture, testimonials, partner banner). Live.
- **Admin console** (`/admin`): companies list (logo upload per company, open in new tab), feature flags, integrations request queue, Books CMS, Partner Leads, releases/versioning.
- **Tenant shells** with a collapsible grouped sidebar + co-branded frozen header (MyGyaan CMO left, tenant logo right), onboarding %, per-tenant menu group-state persistence.

### 6.2 Intelligence / Organic
- **Company Brain** (`/[tenant]/brain`) — MyGyaan-AI internal only, never shown to users.
- **Knowledge Base** (`/[tenant]/kb`) — upload PDF/PPTX/DOCX/images/URLs, extracted text, tags, completeness score (coverage of 6 doc types), Notes/paste field. Upload goes to S3.
- **Industries & Segments** — first-class entities; many-to-many (industry↔segment, contact↔industry); per-industry detail pages.
- **Competition Intel** (`/[tenant]/competition`) — per-segment competitors; positive vs. "should-not-follow" learnings; AI drafts, human confirms.
- **ICP Builder + Personas** — nine ICP questions → generated ICP sentence shown atop list views; up to 6 personas.
- **Interview** — question set from KB gaps + ICP questions; answers write back.
- **Strategy** — generated strategy doc; draft → reviewed → signed off.
- **Marketing Plan** (`/[tenant]/marketing-plan`) — one living doc combining Positioning & Offer, 1-Page Marketing Plan (9 squares), Business Model Canvas (9 blocks); AI drafts from brain + products.
- **Rule of One** (`/[tenant]/rule-of-one`) — positioning-validation wizard (Prep + Result tabs); produces a change list (each item with a "Why") + a **verified LinkedIn audience pulled from Apollo** (real contacts only, never fabricated). Needs Apollo key configured at tenant Integrations.
- **Audience** (`/[tenant]/audience`) — SEO Content Funnel graphic + "From our audience" render.
- **Website & SEO Audit** (`/[tenant]/seo-audit`) — 0–100 baseline score, week-on-week column, keyword surfacing, "send audit report" to comma-separated emails (remembers last-emailed date). Weekly automatic job not yet scheduled (needs tenant URL).
- **KPIs** (`/[tenant]/kpis`) — default KPIs on login; tenant can add / soft-hide; propagation to other tenants supported in schema.

### 6.3 Channels / Outbound
- **Email Studio** (`/[tenant]/email-studio`) — AI drafts from ICP; one-click AI tweak buttons; hand-edit + regenerate; per-recipient personalisation for 100–200 recipients.
- **Email Campaigns** (`/[tenant]/email-campaigns`) — create → audience (all contacts or a list) → compose → send/schedule/pause → monitor (recipients, sent, delivered, opens, clicks, replies, bounces). Live delivery works once an email provider is connected; otherwise "send" marks sent and metrics are manual.
- **WhatsApp** (`/[tenant]/whatsapp`) — provider-agnostic API (number + message + attachment); every communication listed.
- **Calling / VoIP** (`/[tenant]/calling`) — Indian/US/worldwide numbers; Plivo default adapter (Twilio alt); click-to-call logs every call.
- **LinkedIn** (`/[tenant]/linkedin`) — 4 tabs (Compose, Published, Comment Wall, Outreach); **Sandbox mode**: AI compose, schedule, simulated publish/engagement/comments, AI-drafted outreach (human sends). Real publishing needs LinkedIn Community Management API approval + token. Auto-follow/auto-DM deliberately NOT automated (against LinkedIn terms).
- **Voice Agent (Speed-to-Lead)** (`/[tenant]/voice`) — **Phase 1 built, sandbox mode.** Goal: every inbound web/ad lead gets an AI voice call within 60s, is qualified (5 questions < 3 min), scored Hot/Warm/Cold, and pushed to Sales Genie with a summary. Token-secured per-tenant lead-intake webhook; Vapi end-of-call webhook; WhatsApp alerts; Test Call simulator; 12 tenant settings. Stack: Vapi (orchestration), Claude (reasoning), Indian number via Exotel/Plivo SIP, ElevenLabs voice. Goes live once credentials are entered. **Retry-ladder caveat:** platform scheduler has a 1-hour minimum, so +5min/+2h retries need Vapi's own scheduler or a frequent cron hitting the voice-retry endpoint.

### 6.4 Workflows ("Vault") module
- `/[tenant]/workflows` — all 3 phases built and deployed. Job-based front door ("What do you want to get done?") → wizard → AI-drafted marketing asset grounded in company facts → push into execution channels (Email Studio / Templates / Campaigns).
- 5 starter workflows: offer architect, sales-page copy, paid-ad campaign, email nurture, webinar/VSL.
- **Verified Facts guardrail:** AI uses only facts on file and marks unverifiable claims inline (`[CONFIRM: …]`, needs-client-proof, suggested-not-on-file).
- Phase 3: campaign container with versioning, regenerate, and an "Ask the experts" 3-expert stress-test.
- Models: `WorkflowCampaign`, `WorkflowRun`, `WorkflowRunVersion`; engine in `lib/workflows.ts`.
- **Decision:** build in-house; do NOT integrate the reference product's (marketerprompts.com / The Marketing Vault) MCP servers — that would send tenant data off-platform, breaking India residency, Company-Brain secrecy, and tenant isolation.

### 6.5 CRM / Records (lightweight in-portal)
- Opportunities & Orders, Lists & Contacts, Templates, Sequences, Inbox (schema + partial UI). The full CRM is a **separate product** at `cmo.nandan.co.in/crm` (see Section 9).

### 6.6 Billing / Admin
- Plans, balances, credit packs/ledger, invoices, lock events (Phase 3 schema; admin surfaces partial). Credits page per tenant (balance / credited / used + activity).

### 6.7 Integrations
- **Integrations** (`/[tenant]/integrations`) is a major top-level section: catalogue by category with Add / Choose-active / Request. Each integration configured **per tenant** here.
- Catalogue includes: Email (SendGrid, Amazon SES, **Mailer Cloud**), WhatsApp providers, Calling (Plivo/Twilio/Exotel), **Apollo** (Rule of One audience), Voice AI (Vapi, Exotel, Sales Genie), LinkedIn (catalogue-only).
- **Mailer Cloud** is fully integrated as a live email-sending channel (Email API for transactional, Marketing API for bulk campaigns); `lib/email.ts` is a provider-agnostic sender that reads the tenant's active email integration.
- **API Access** (`/[tenant]/api-access`) — per-tenant API keys + `/api/v1` REST endpoints (`/me`, `/contacts`, `/opportunities`) scoped to the key's company, for outbound sync to **Genie CRM**.

### 6.8 Marketing content & Partner program
- **Book Summaries** — public `/books` + per-book SEO pages `/books/[slug]`; 22 books; admin Books CMS.
- **Partner page** `/partner` — agency pitch, top banner, nav link; applications saved as hot leads (source `partner_page`) in admin Partner Leads + email alert.
- **Testimonials** — public `/testimonials`.

*Source: Project Memory (Product Scope, Integrations and Channel Providers, Workflows Module, Voice Agent, Tenant Modules, Marketing Content and Partner Program, Portal Navigation and Branding); docs/BUILD_NOTES_project_instructions.md; app source tree.*

---

## 7. Domain model (key entities)

- **Lead scoring:** every contact has a 0–100 AI-computed score. Bands: **hot ≥75, warm ≥50, cool ≥25, else cold**. Shown so the team knows which leads are warm.
- **Industry** is first-class; each has a detail page. Industries apply to segments and contacts.
- **Many-to-many:** industry↔segment; contact↔industry (contacts inherit industries).
- Full schema: `app/prisma/schema.prisma` (102 models) and `database/schema_only.sql`.

*Source: Project Memory → Domain Model; app/prisma/schema.prisma.*

---

## 8. Database — current contents

102 tables, ~261 rows (early stage, mostly seed + a little test data). Highlights at export time:

- **Tenants:** 3 companies (Nandan active; Fabro exists; one more). 1 agency (MyGyaan default).
- **Users:** 46; **Memberships:** 6; **Password-set tokens:** 7.
- **Seeded content:** 22 book summaries, 18 integrations, 53 feature flags, 11 KPIs, 6 personas, 4 industries, 3 segments, 4 competitors, 5 contacts, 2 ICP profiles, 2 lists, 2 channels, 3 releases, 23 interview questions, 4 SEO audits, 5 demo requests.
- **Empty/operational tables:** campaigns, posts, email_campaigns, voice_leads, api_keys, integration_configs, email_providers, whatsapp_providers, mailbox_connections — all 0 rows, so **no third-party secrets are stored in the database dump.**

The full dump (`database/full_dump.sql`) contains schema + all data. `database/schema_only.sql` is DDL only; `database/data_only_inserts.sql` is readable column-level INSERTs.

*Source: live `get_database_stats` run 20-Oct-2026; pg_dump output in `database/`.*

---

## 9. The CRM surface (separate product)

The CRM at `cmo.nandan.co.in/crm` is a **pure CRM, separate from the CMO portal**. It is NOT in this codebase but is documented because the CMO hands MQLs to it.
- Funnel: Inbound → Assigned → Qualifying → Proposal sent → Negotiating → Won/Lost.
- All inbound CMO leads (demo requests, MQLs, replies, referrals) flow into the CRM.
- RM assignment in the CRM; proposals sent as token-gated private links (`cmo.mygyaan.ai/<slug>-<token>`, noindex, tracked).
- Hard rule: **no external docs/Excel/PPT anywhere in the product workflow.**

*Source: Project Memory → CRM Surface.*

---

## 10. Open questions & blockers (carried forward)

- **India hosting + per-tenant DB** — the core blocker that triggered this migration. The Abacus support email (`docs/Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md`) lists the exact questions. Self-hosting in India is now the chosen path.
- **Coresignal** discovery module — *scoped/discussed, NOT built.* Proposed model: shared credit pool, chargeable discovery, **only the admin sees all records**. Open: whether discovered records are per-tenant or shared.
- SEO weekly audit job not yet scheduled (needs tenant website URL).
- GA / Google Ads / LinkedIn KPI auto-sources populate only once integrations are connected with credentials.
- Fabro tenant has no dedicated login yet.
- Previously exposed seed credentials should be rotated.
- Live Gmail/Outlook sync needs Google/Microsoft OAuth app credentials (manual paste-import works today).

*Source: Project Memory → Open Questions and Blockers, Pending Work Bugs and Team Notes, Access Accounts and Security.*

---

## 11. What is NOT built (be honest)

- **Database-per-tenant routing** — still shared-DB + `companyId` (the headline migration task).
- **Coresignal discovery** — scoped only.
- **Weekly automated SEO audit scheduling.**
- **Live LinkedIn publishing** (sandbox only; needs API approval + token).
- **Live Voice calls** (sandbox; needs Indian telephony, Vapi key, WhatsApp API, Genie endpoint).
- **Live Gmail/Outlook OAuth sync.**
- **The separate CRM** at cmo.nandan.co.in/crm.
- Agency white-label is partial (Branding tab exists).

---

## 12. Accounts (for the migrated system)

> Passwords below are the **seed defaults set via environment variables** at seed time — change them immediately after first login on your own server. They are NOT real secrets in this bundle.

| Role | Email | Seed password source |
|---|---|---|
| Platform Admin | `admin@mygyaan.ai` | `SEED_ADMIN_PASSWORD` env |
| Nandan tenant | `nandan@mygyaan.ai` | `SEED_NANDAN_PASSWORD` env |
| Hidden test account | (seeded) | `SEED_TEST_PASSWORD` env |

New users set their own password via a single-use `/set-password` link (72-hour expiry; `PasswordSetToken` model). There is no auto-email yet, so links are forwarded manually.

*Source: docs/CMO_PORTAL_HANDOVER.md; Project Memory → Access, Accounts and Security.*

---

## 13. Sources — where every piece of information came from

This document and the bundle were compiled from the following first-party project records (all included in `docs/` or reproduced here):

1. **`docs/MYGYAAN_CMO_SCOPE.md`** — the 07-Oct-2026 build scope (product definition, tenancy, 7-role matrix, data model, phases, acceptance criteria). *Note: assumed a Supabase/Vercel stack; actual build is Next.js + Prisma + PostgreSQL.*
2. **`docs/MYGYAAN_CMO_MASTER_PLAN.md`** (+ .docx) — master plan v1.1 (09-Oct-2026).
3. **`docs/CMO_PORTAL_HANDOVER.md`** (+ .pdf, .docx) — 10-Oct-2026 handover (feature status, files, constraints, blockers).
4. **`docs/Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md`** — the hosting/DB-per-tenant requirements, as questions to the platform.
5. **`docs/BUILD_NOTES_project_instructions.md`** — detailed, dated build notes for the Voice, Workflows, Mailer Cloud, LinkedIn, Knowledge-Base-fix and user-management modules (the agent's working memory).
6. **`docs/project_memory_wiki/`** — the full Project Memory wiki (20 pages): Overview, Status, Decisions, Product Scope, Architecture, Domain Model, CRM Surface, Integrations and Channel Providers, Workflows Module, Voice Agent, Open Questions and Blockers, Portal Navigation and Branding, Marketing Content and Partner Program, Tenant Modules, Landing Page and Home Page Messaging, Access Accounts and Security, Pending Work Bugs and Team Notes, Planning and Roadmap, Links, and more.
7. **Live database stats** — `get_database_stats` run 20-Oct-2026 (table/row counts in Section 8).
8. **The source code itself** — `app/` (the authoritative record of what is actually implemented), `app/prisma/schema.prisma` (the data model), `app/package.json` (the dependency stack).
9. **Reference sites studied (external, by the team):** growsalt.com, youngcaesar.digital, https://aarvi-youngcaesar.netlify.app (home-page content reference), marketerprompts.com (Workflows/Vault benchmark), coresignal.com (discovery data source, under consideration).

---

## 14. Where to go next in this bundle

- **To stand the app up on your India server:** read **`INSTALL_SELF_HOST.md`** (step by step).
- **To understand the data:** `database/schema_only.sql` + `app/prisma/schema.prisma`; load `database/full_dump.sql`.
- **To read the full history & decisions:** `docs/project_memory_wiki/` and the planning docs in `docs/`.
- **The code:** `app/` (everything except `node_modules`, which `yarn install` regenerates).

*End of consolidated history.*
