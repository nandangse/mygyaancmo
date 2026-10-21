# Mygyaan.ai CMO — Build Scope for Claude Code

**Product:** cmo.mygyaan.ai — multi-tenant "CMO as a Service" platform for B2B manufacturers.
**Owner:** Dr Raghu (product, commercials). **Cofounder / build lead:** Vikas.
**Date:** 07-10-26. **Status:** Phase 1 build starts today.

This document is the single source of truth for scope. Read it fully before writing code. Where it says "Phase 1", build it now. Where it says "Phase 2/3", design the schema for it but do not build the UI yet.

---

## 1. What this product is

One portal that runs a manufacturer's entire marketing up to the MQL stage, then hands qualified leads to the customer's CRM. One codebase, one database, many tenants. Every customer is a *company* parameterised in settings; no customer-specific code, ever.

Two sides:

- **Organic / Intelligence** — knowledge base, interview, ICP, strategy, website audit, content and social calendar, LinkedIn posting, blogs, press releases.
- **Outbound** — customer uploads databases, portal segments and enriches, sequences go out from one identity per company (`<slug>@mygyaan.ai` + one WhatsApp Business number), replies come back, MQLs hand off.

Mygyaan also powers **agencies**: an agency can bring its own customers onto the platform and run them. Mygyaan itself is the default agency. Nandan GSE is tenant #1 and the proof case.

**Reference customers for naming:** `cmo.mygyaan.ai/nandangse`, `cmo.mygyaan.ai/fabro`.

---

## 2. Tenancy and URLs

| Level | Entity | Example |
| --- | --- | --- |
| Platform | Mygyaan | `cmo.mygyaan.ai` (platform admin + agency console) |
| Agency | `agencies` | Mygyaan (default), any partner agency |
| Company (tenant) | `companies` | `cmo.mygyaan.ai/nandangse`, `cmo.mygyaan.ai/fabro` |

- Every company belongs to exactly one agency.
- Company slug is the URL path segment: lowercase, `[a-z0-9-]`, unique, immutable after creation.
- Every data row carries `company_id`. Every query is scoped by it. Row Level Security enforces this at the database, not only in the app.
- Agency-level rows carry `agency_id`. Platform-level rows carry neither.

---

## 3. Roles and permissions

Seven roles. A user can hold several memberships (e.g. Agency RM for one agency, Client viewer at a company elsewhere). Permissions are additive across memberships but never cross a scope the membership doesn't grant.

| Role | Scope | Sees | Settings | Data (read) | Data (write) | Billing |
| --- | --- | --- | --- | --- | --- | --- |
| **Mygyaan admin** | Platform | All agencies, all companies | All, incl. platform config, plans, feature flags | All | All | All |
| **Agency manager** | One agency | All companies under that agency | Agency settings; company settings for its companies | All its companies | All its companies | View its companies' billing; cannot post payments |
| **Agency RM** | Allocated companies only | Only companies allocated to them | Company settings of allocated companies | Allocated companies | Allocated companies | View only |
| **Client admin** | One company | Own company | Own company settings (users, integrations, branding, identity) | None by default (toggle: "admin can view data") | None | View invoices, pay |
| **Client manager** | One company | Own company | Own company settings | All company data | All company data | View invoices |
| **Client user** | One company | Own company | None | All company data | All company data (no delete of records they didn't create; no exports unless granted) | None |
| **Client viewer** | One company | Own company | None | All company data (read-only) | None | None |

Rules:

- `memberships` table: `user_id`, `scope_type` (`platform` | `agency` | `company`), `scope_id`, `role`, `allocated_company_ids[]` (Agency RM only), `granted_by`, `created_at`.
- Allocation of companies to an Agency RM is done by the Agency manager or Mygyaan admin.
- "Settings" means: company profile, users and roles, sending identity, integrations, branding, notification rules, plan and credits view. It never means data.
- "Data" means: knowledge base, interview, ICP, strategy, campaigns, lists, contacts, sequences, inbox, MQLs, reports.
- Client admin is deliberately settings-only (an owner who wants control of users and billing without touching marketing data). A toggle on the company lets an admin also read data; default off.
- Destructive actions (delete company, purge data, change slug) are Mygyaan admin only, with a typed confirmation.
- Every permission check happens in two places: RLS policy in Postgres and a `can(user, action, resource)` helper in the app. The app helper must never be the only gate.

---

## 4. Modules and phases

### Phase 1 — build now

**1.1 Platform spine**
- Auth (email + password, magic link, Google), session, password reset.
- Agencies, companies, users, memberships, roles, RLS.
- Company creation wizard (Mygyaan admin / Agency manager): name, slug, agency, plan, primary contact, RM allocation.
- Audit log: who did what, on which company, when. Every write.
- Settings pages per scope (platform, agency, company).
- Feature flags per company (so modules can be switched on per plan).

**1.2 Intelligence**
- **Knowledge base**: upload area per company. Accepts PDF, PPTX, DOCX, XLSX, images, URLs (website pages, LinkedIn page, YouTube), flipbook links. Stores file, extracted text, metadata, tags (brochure / presentation / website / social / pricing / case study / other). Full-text search. Versioning on re-upload.
- **Product and competition analysis**: structured records for products (name, category, specs, USP, target buyer, price band) and competitors (name, site, products, positioning, where they win/lose). Generated drafts from the knowledge base; human edits and marks as confirmed.
- **ICP Builder**: the nine questions, in order, each stored as a field:
  1. Minimum deal size worth pursuing
  2. Typical deal size of a good-fit customer
  3. Primary buyer (technical / financial / operational) + ranking of the other two
  4. Strongest verticals (1–3, with 3+ closed deals in 24 months)
  5. Company size band (revenue or headcount)
  6. Top three regions by revenue
  7. Typical sales cycle length
  8. Average customer LTV relative to deal size
  9. Anti-ICP: disqualifiers
  Output: one generated **ICP sentence** stored on the company and shown at the top of every list view. Buyer personas (up to 6) hang off the ICP.
- **Interview**: question set generated from knowledge base gaps + the nine ICP questions; conducted on a call; answers entered or pasted (transcript upload allowed); answers write back into knowledge base and ICP.
- **Strategy planning**: a generated strategy document per company with sections: positioning, pyramid-layer mapping (3% buying / 7% thinking / 30% unaware / 30% not yet / 30% never), keyword list by layer, website audit summary, social channels and links, LinkedIn calendar, blog plan, press release plan, WhatsApp broadcast plan, KPI sheet. Status: draft → reviewed → signed off (Client admin/manager signs). Nothing in Campaigns can be scheduled until a strategy is signed off.

**1.3 Social media campaigns**
- Channels: LinkedIn (personal + company page), with Instagram/Facebook/X/YouTube as channel records for later.
- Content calendar: month view and list view; posts with status (idea → drafted → approved → scheduled → published → measured); every post tagged to pyramid layer, persona, topic cluster, and a strategy section.
- Post editor: text, images, links, hashtags; generated drafts from knowledge base and strategy; approval step (Client manager or RM).
- Publishing: via connected LinkedIn account (OAuth) where API allows; otherwise "copy and mark published" with the manual publish URL stored.
- Metrics capture: impressions, reactions, comments, clicks per post (manual entry or API where available).
- Campaign grouping: a campaign = a theme + date range + set of posts + target KPI.

**1.4 Opportunities and orders (lightweight)**
- Simple records only: Opportunity (company, contact, value, stage, source campaign, owner, notes) and Order (opportunity, value, date, reference). No pipeline automation. Purpose: close the loop from marketing to revenue for reporting. Export to CSV. Push to external CRM is Phase 2.

**1.5 Reporting (Phase 1 slice)**
- Per company: knowledge base completeness, ICP status, strategy status, posts scheduled/published this month, engagement totals, opportunities created from campaigns.
- Agency view: table of all companies under the agency with the same columns (the "control tower"), filterable, sortable, exportable.

### Phase 2 — schema now, build next

**2.1 Outbound: lists and enrichment**
- Ingest CSV / XLSX / Google Sheets link / CRM export; de-duplicate on email + domain; source tag; ICP fit score against the ICP sentence; segment by layer, persona, vertical, region.
- Enrichment via pluggable providers (Apollo, InstaFinancials, others). Credits are per company, prepaid, decremented per call.
- Trigger watch: per-account watcher for hires, expansions, funding, trade-show attendance; triggers raise tasks; 14-day expiry.

**2.2 Outbound: identity and sending**
- One sending identity per company: `<slug>@mygyaan.ai` on a Mygyaan-owned sending domain; warm-up schedule; SPF/DKIM/DMARC; daily caps; auto-pause on bounce > 3% or complaints > 0.1%.
- Email provider is pluggable (adapter interface; first adapter = any transactional/outreach API). Replies are captured by inbound webhook or IMAP into the portal inbox.
- WhatsApp Business API per company on the same identity; opt-in/opt-out store; templates; throttling.

**2.3 Outbound: templates, sequences, inbox**
- Template library: persona, angle (curiosity / specificity / relevance), body, variables, "why it works".
- Sequence runner: multi-step, multi-channel (email, LinkedIn task, WhatsApp, call task); three default cadences (C-level 6/21d, Operations 7/30d, Technical 6/28d); every sequence ends with a breakup step carrying a gift.
- Gift library: downloadable assets tagged to persona and step; send/open tracking.
- Inbox: every reply attached to contact + step; auto-classification (interested, not interested, has vendor, no budget, next quarter, in-house, too busy, send info, OOO, wrong person, unsubscribe); suggested handler text; MQL flag; hand-off to CRM (webhook/Zapier-style first).

**2.4 Organic engines**
- Website audit runner (technical checklist + score), keyword list by layer, blog and press-release drafting from the knowledge base, publishing checklist.

### Phase 3

- **Billing and lock**: plans, prepaid balances, credit packs (enrichment, email volume, WhatsApp conversations), invoices with GST, payment posting (gateway + manual), renewal reminders, **hard lock**: if balance/renewal is overdue past the grace period, company enters `locked` state — no sending, no scheduling, read-only data; unlocks the same day payment is posted. Data is never deleted on lock.
- **Exports and exit**: full export of knowledge base, lists, content and reports.
- Agency white-label (logo, colours, custom domain).
- Phone outbound via a calling provider.

---

## 5. Data model (Postgres / Supabase)

Core tables — all with `id uuid`, `created_at`, `updated_at`, `created_by`, soft-delete `deleted_at` where noted.

**Platform / tenancy**
- `agencies` (name, slug, is_default, branding jsonb, status)
- `companies` (agency_id, name, slug, status: `active|trial|locked|archived`, plan_id, settings jsonb, icp_sentence text, strategy_status, sending_identity_email, whatsapp_number, lock_reason, locked_at)
- `users` (Supabase auth), `profiles` (user_id, name, phone, avatar)
- `memberships` (user_id, scope_type, scope_id, role, allocated_company_ids uuid[], granted_by)
- `audit_log` (actor_id, company_id nullable, agency_id nullable, action, resource_type, resource_id, before jsonb, after jsonb)
- `feature_flags` (company_id, flag, enabled)

**Intelligence**
- `kb_documents` (company_id, type, title, source_url, storage_path, mime, extracted_text, tags text[], version, status)
- `products` (company_id, name, category, specs jsonb, usp, target_buyer, price_band, confirmed)
- `competitors` (company_id, name, site, positioning, wins, loses, confirmed)
- `icp_profiles` (company_id, q1..q9 fields typed, icp_sentence, version, confirmed_by)
- `personas` (company_id, name, family: `sales|operations|finance|plant|purchasing|technical`, pains, kpis, pyramid_layers text[])
- `interviews` (company_id, scheduled_at, conducted_by, transcript_path, status)
- `interview_questions` (interview_id, question, source: `icp|kb_gap|custom`, answer, applied_to)
- `strategies` (company_id, version, status: `draft|reviewed|signed_off`, signed_by, signed_at, sections jsonb)
- `keywords` (company_id, keyword, layer, intent, monthly_volume, target_url)

**Social**
- `channels` (company_id, type, handle, url, oauth_ref, status)
- `campaigns` (company_id, name, theme, starts_on, ends_on, kpi jsonb, status)
- `posts` (company_id, campaign_id, channel_id, body, media jsonb, layer, persona_id, topic, status, scheduled_at, published_at, published_url, approved_by)
- `post_metrics` (post_id, captured_at, impressions, reactions, comments, clicks, source: `manual|api`)

**Records**
- `contacts` (company_id, name, email, phone, title, account_id, persona_id, layer, source, icp_fit, opt_in_email, opt_in_whatsapp, status)
- `accounts` (company_id, name, domain, vertical, region, size_band, enrichment jsonb, icp_fit)
- `opportunities` (company_id, account_id, contact_id, value, stage, source_campaign_id, owner_id, notes)
- `orders` (company_id, opportunity_id, value, order_date, reference)

**Outbound (schema in Phase 1, UI in Phase 2)**
- `lists`, `list_contacts`, `enrichment_jobs`, `credit_ledger`, `triggers`, `templates`, `sequences`, `sequence_steps`, `enrollments`, `touches`, `inbox_messages`, `gifts`, `gift_events`, `whatsapp_templates`
- `email_providers` (company_id or platform, type, config jsonb encrypted) — adapter pattern

**Billing (Phase 3)**
- `plans`, `subscriptions`, `balances`, `credit_packs`, `invoices`, `payments`, `lock_events`

**RLS policy pattern (apply to every company-scoped table):**
```sql
create policy "company scope" on <table>
for all using (
  company_id in (select company_id from v_user_company_access where user_id = auth.uid())
);
```
`v_user_company_access` resolves memberships: platform admin → all companies; agency manager → companies where agency_id matches; agency RM → allocated_company_ids; client roles → scope_id. Write policies additionally check role ∈ allowed set per table (viewer never writes; admin never writes data tables).

---

## 6. Tech stack (assumed; confirm or override)

Matches the Genie stack so the team context carries over.

- **Frontend:** React (Next.js App Router), TypeScript, Tailwind, shadcn/ui. Mobile-responsive; RMs and Dr Raghu will use it on phones.
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime). One Supabase project for the whole platform (multi-tenant by RLS), separate from any Genie project.
- **Hosting:** Vercel. Preview deployments per PR.
- **Jobs:** Supabase cron + Edge Functions for scheduled posts, enrichment, sequence steps, lock checks.
- **AI:** Anthropic API for knowledge-base extraction, ICP sentence, strategy drafts, post drafts, reply classification. All prompts live in `/prompts` as versioned files; every generation stores the prompt version used.
- **Files:** Supabase Storage, bucket per company (`kb/<company_id>/…`), signed URLs only.
- **Secrets:** per-company integration secrets encrypted at rest; never in client code.
- **Observability:** structured logs, error tracking (Sentry or equivalent), audit log in DB.
- **Repo:** single repo, conventional commits, one version number, `main` protected, CI runs typecheck + lint + RLS policy tests.

---

## 7. Non-functional requirements

- **Tenant isolation is the first test, not the last.** CI includes RLS tests that attempt cross-company reads and writes for every role and must fail.
- Every list view shows the ICP sentence of the company at the top.
- Every record created by AI carries `generated_by: ai` and `prompt_version`; a human must confirm before it is treated as fact.
- All dates DD-MM-YY in UI; INR amounts in Indian grouping (1,00,000); other currencies Western grouping.
- Audit log on every write; visible to Mygyaan admin and Agency manager.
- Rate limits on uploads and AI calls per company; quotas visible in settings.
- Accessibility: keyboard navigable, readable at phone width.
- Data residency: single region; note in settings.
- Backups: daily, 30-day retention; tested restore before first paying customer.

---

## 8. Phase 1 acceptance criteria

1. Mygyaan admin creates agency "Mygyaan" (default) and companies `nandangse` and `fabro`; each has its own URL path and isolated data.
2. All seven roles can be assigned; an Agency RM allocated only to `fabro` cannot see `nandangse` via UI, API or direct Postgres query under their JWT.
3. Client admin can manage users and settings for their company and cannot open any data page unless the data toggle is on.
4. Knowledge base accepts the listed formats, extracts text, is searchable, and shows a completeness score.
5. ICP Builder stores all nine answers and produces the ICP sentence; personas can be added.
6. Interview questions are generated from knowledge-base gaps plus the nine ICP questions; answers write back.
7. Strategy document is generated, editable, and moves through draft → reviewed → signed off; scheduling a post before sign-off is blocked with a clear message.
8. Content calendar works month and list view; a post goes idea → published with approval; metrics can be entered; campaign totals roll up.
9. Opportunities and orders can be recorded and exported.
10. Agency control-tower table lists all companies with status columns; exports to CSV.
11. Audit log records every write with actor and company.
12. RLS test suite passes in CI.

---

## 9. Out of scope for now

- Building a CRM. MQLs hand off to the customer's CRM; the lightweight opportunity/order records are for reporting only.
- Replacing ERPNext or any Genie module. Genie stays sales/ops; Mygyaan owns marketing up to MQL.
- Google Ads management, website development, brochure design (sold as separate services, not platform features).
- Customer-specific code of any kind.

---

## 10. Build order for Claude Code

1. Repo, Supabase project, auth, tenancy tables, RLS, memberships, roles, RLS test suite
2. Platform, agency and company settings pages; company creation wizard; audit log
3. Knowledge base (upload, extract, search, tags, completeness)
4. ICP Builder + personas + ICP sentence
5. Interview module
6. Products and competitors
7. Strategy generator and sign-off gate
8. Channels, campaigns, posts, calendar, approval, metrics
9. Opportunities and orders
10. Reporting and agency control tower
11. Schema-only: outbound and billing tables with RLS, no UI
12. Seed data: Mygyaan agency, `nandangse`, `fabro`, one user per role, sample knowledge base

Commit after each numbered step. Each step ends with its acceptance criteria demonstrated on the seeded companies.
