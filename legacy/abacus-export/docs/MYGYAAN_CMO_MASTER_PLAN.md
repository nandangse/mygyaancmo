# CMO of [mygyaan.ai](http://mygyaan.ai) — Comprehensive Plan

**Version 2.1 · 9 October 2026**\
Prepared for **Dr Raghu** (product & commercials)

**Sources used:** `various from Raghus records`

**Decision log (v1.1 → v2.1):**

* ✅ **The CRM joins the platform as a fourth surface.** A pure CRM — separate from the CMO portal — drives the marketing and sales for the package. First instance: `cmo.nandan.co.in/crm`. The funnel is created here, all inbound leads for the CMO flow here, RMs are assigned here, and personalized proposals are made and sent from here.

* ✅ **The funnel lives in the CRM.** The marketing portal runs marketing up to MQL and hands off; the CRM owns the funnel from lead to won/lost, plus the sales work on top.

* ✅ **Proposals are Kris-style documents, sent as private links.** At `cmo.mygyaan.ai/<slug>-<token>` — a personalized, non-web-crawler document link, shown on screen and sent by email, all from inside the portal.

* ✅ **Partners are onboarded into the system.** Named partners work inside the portal; their payments and commissions are regulated from here too — no external files anywhere.

* ✅ **LMS, training and debrief reports are all in-system.**

* ✅ **Hard rule: no external documents, spreadsheets or PowerPoints.** Nothing in the product workflow depends on Google Docs / Excel / PPT. Everything is created, stored, shared and reported inside the platform.

* ✅ **Monetization is part of this plan.** Packages, credit packs, partner commissions and agency economics are defined below (illustrative numbers to be finalised by Dr Raghu).

* — (retained from v1.1) **Hosting: Abacus AI** is the single source for creation and hosting. **Multi-tenancy: 100% isolated.** **Channels: fully pluggable, multiple per company.** **Versioning: updates only after customer agreement.** **Sequence:** plan → agree → build.

---

## 1. Executive summary

Mygyaan.ai is building a **multi-tenant "CMO as a Service" platform for B2B manufacturers**, created and hosted on the **Abacus AI** platform. One place runs a manufacturer's entire marketing — LinkedIn, Email, WhatsApp, Calls, SEO and SEM — up to the MQL stage, then hands qualified leads into the built-in CRM (or the customer's CRM of choice) where the funnel, the Relationship Managers (RMs), the proposals and the sales continue.

The plan has six moving parts:

1. **Four surfaces under one platform.** `cmo.mygyaan.ai` is the marketing site that attracts manufacturers. `cmo.mygyaan.ai/admin` is the platform, agency and partner console. `cmo.mygyaan.ai/<company-slug>` is the per-company CMO portal — first tenant: `/nandangse`. `cmo.<tenant-domain>/crm` is the per-tenant pure CRM — first instance `cmo.nandan.co.in/crm` — where the funnel lives.
2. **One codebase, many tenants.** No customer-specific code, ever. Every customer is a row in `companies`; every query is scoped by `company_id` and isolated at the database layer.
3. **A versioned release train.** The platform version is set in admin, pinned per customer; an update reaches a customer **only after that customer agrees**. No agreement, no change.
4. **Two engines in the portal.** *Organic / Intelligence* (knowledge base → ICP → strategy → content) and *Outbound* (lists → enrichment → sequences → replies → MQL).
5. **A deliverable engine.** Every engagement produces one living document — the single source of truth — plus Kris-style personalized proposals delivered as private, non-crawler links.
6. **The operating layer.** Partners onboard and work in-system; commissions and payments are regulated from here; LMS, training and debrief reports are all in-system. **No external docs, spreadsheets or PowerPoints.**

Nandan GSE is tenant #1 and the proof case. Mygyaan itself is the default agency; named partners and partner agencies work through the same platform.

---

## 2. What we are building

**The promise to a manufacturer:** one place where all marketing is visible, from first touch to MQL, with the work done for you — and a CRM underneath it that turns those MQLs into conversations, proposals and revenue.

**The boundary:** The **portal** owns marketing **up to MQL**. The **CRM** (pure, separate) owns everything after: the funnel, the RM's work, the proposals, and the deals. The portal hands off at MQL; the CRM receives. A lead can also be pushed to an external CRM of the customer's choice if the customer prefers — the built-in CRM is the default, not the only path.

**Three layers, one platform:**

| Layer | Surface | Owns |
| --- | --- | --- |
| **Marketing portal** | `cmo.mygyaan.ai/<slug>` | Knowledge base → ICP → strategy → campaigns (LinkedIn, Email, WhatsApp, Calls, SEO, SEM) → MQL |
| **Pure CRM** | `cmo.<tenant>/crm` | Funnel, inbound leads, RM assignment, activities, proposals, deals, invoicing |
| **Operating layer** | Admin + portal | Partners, commissions & payments, LMS/training, debrief reports, billing, versioning |

**Why this shape:** the reference deliverable (Aarvi × YoungCaesar) proves the model — a counted market, a buying-intent search picture, a multi-channel sequence, a human reading every reply, and a guarantee. The platform productises that motion so it runs for ten tenants without ten times the headcount, and the CRM productises the follow-through so nothing falls through the cracks.

---

## 3. The four surfaces

### 3.1 `cmo.mygyaan.ai` — the marketing site *(placeholder, building now)*

This is the **front door**: the site that attracts manufacturers, creates attention, and converts visitors into customers.

**Placeholder scope (build now, refine later):**

* **Hero** — working headline: *"Your entire marketing, run from one portal — up to the MQL."*

* **The problem** — manufacturers are invisible online, buy from people they know, and have no single view of marketing.

* **How it works** — the two engines in four steps: *Understand → Plan → Reach → Qualify*.

* **Channels strip** — LinkedIn · Email · WhatsApp · Calls · SEO · SEM.

* **Proof** — the Nandan GSE case study (placeholder until real results exist).

* **What you get** — the living deliverable document per company.

* **Pricing teaser** — packages and credit packs, link to a full pricing page.

* **FAQ** — data ownership, exit, "do you replace our CRM?", "who reads the replies?".

* **Conversion** — *Book a demo* (primary) and *See a live tenant* (secondary). The demo-request form (name, company, role, email, phone, *what do you make?*) writes to the database and flows into the CRM as an inbound lead.

* **Footer** — legal, privacy, unsubscribe policy, contact.

**Conversion path:** LinkedIn post / email → landing page → demo request → CRM lead → RM assigned in the CRM → proposal built from the discussions → sent as a private link → company created → tenant provisioned.

### 3.2 `cmo.mygyaan.ai/admin` — the platform, agency & partner console

Where Mygyaan runs the business. Same application, gated by role.

**Platform level (Mygyaan admin):**
* Agencies, companies, users, memberships and roles — including **partners**.
* **Company creation wizard** — name, slug, agency, plan, primary contact, RM allocation.
* **Platform version control** — releases, per-tenant versions, recorded agreements (see §6).
* Plans, feature flags, credit packs, invoices, payments, lock/unlock.
* **Partner management** — onboard named partners, assign scope, set commission plans.
* **Payment oversight** — the payment ledger, payouts, statements.
* **LMS admin** — courses, trainings, certifications, debrief reports.
* Audit log; demo-request inbox; platform config.

**Agency level (Agency manager / Agency RM):** the **control tower** — all companies under the agency with status columns (knowledge-base completeness, ICP status, strategy status, posts this month, engagement, opportunities, deals, version, billing state), filterable, sortable, exportable; RM allocation.

### 3.3 `cmo.mygyaan.ai/<company-slug>` — the tenant CMO portal

The working portal for one customer. First tenant: `cmo.mygyaan.ai/nandangse`.

**Layout:** a persistent left rail, a top bar with the company name, the **ICP sentence** (top of every list view), the current platform version, and the user menu.

**Modules:** Knowledge base · Products & competitors · ICP & personas · Interview · Strategy · Social calendar · Campaigns & posts · Channels · Lists & contacts · Sequences & templates · Inbox & MQLs · Opportunities & orders · Reports · Settings. From each module, **"hand off to CRM"** carries the context (contact, thread, score) into the CRM.

### 3.4 `cmo.<tenant-domain>/crm` — the pure CRM *(new fourth surface)*

A **pure CRM, separate from the CMO portal**, that drives marketing and sales for the package. First instance: `cmo.nandan.co.in/crm` (tenant's own domain, white-label).

**What lives here:**
* **The funnel** — created and maintained here: Inbound → Assigned → Qualifying → Proposal sent → Negotiating → Won / Lost.
* **Inbound leads** — every inbound lead for the CMO flows here: the marketing site's demo requests, the portal's MQLs, replies and referrals.
* **RM assignment** — leads are routed to RMs; RM workload, activity and response times are visible.
* **Contacts & accounts** — synced with the portal's `contacts`/`accounts`; enriched by the portal's data.
* **Proposals** — built here from the discussions with each person, previewed on screen, sent by email/WhatsApp through the portal's channels, tracked by view/open.
* **Deals & invoicing** — won/lost, values, invoices (GST), payments.
* **Reporting** — funnel conversion, RM performance, proposal win-rate, revenue by source campaign.

**Separation rule (customer-confirmed):** the CRM is **not** the portal. It has its own navigation, its own domain binding, and its own roles. The portal hands off; the CRM receives; the hand-off carries the thread and the score.

### 3.5 Proposals & private documents *(Kris-style)*

The way proposals are delivered — the "presentation given by Kris", productised:

* A proposal is a **personalised document**, not a deck and not a doc file — it is generated in-system from the discussions with the person, the knowledge base and the ICP.
* It is delivered as a **private link**: `cmo.mygyaan.ai/<slug>-<token>` (e.g. `cmo.mygyaan.ai/aarvi-intro`).
* The link is **non-web-crawler**: `noindex`, `robots` disallow, token-gated, unguessable; optional expiry and optional password.
* **Show on screen** — a full-screen, self-contained presentation the recipient can scroll and share internally.
* **And email** — sent from the portal through the tenant's chosen channel (email adapter), with open/view tracking recorded in the CRM.
* Every send is versioned; a revised proposal is a new version of the same document shared on a new link.

---

## 4. The funnel (in the CRM)

The CRM owns one canonical funnel. Stages (defaults; editable per tenant):

| Stage | What happens | Data source |
| --- | --- | --- |
| **Inbound** | Lead enters the CRM | Marketing site demo requests, portal MQL hand-offs, replies, referrals, imported lists |
| **Assigned** | RM assigned; first response tracked | Routing rules + manual assignment |
| **Qualifying** | Score vs ICP, need confirmed, budget/timeline surfaced | Portal ICP score + RM notes |
| **Proposal sent** | Kris-style proposal generated, previewed, emailed, link sent | Proposal builder (§5) |
| **Negotiating** | Discussion continues in CRM; revisions | RM activity + proposal versions |
| **Won / Lost** | Outcome recorded; won → invoicing; lost → reason + re-entry cadence | Deal record |

**Rules:** the portal cannot change a CRM stage; the CRM cannot schedule a campaign. The hand-off is a first-class object (`mql_handoffs`) carrying contact, account, thread, score, source campaign and notes — audit-logged both sides. If the customer prefers their own CRM, the same hand-off can be delivered by webhook (Phase 2), with the built-in CRM as the default.

---

## 5. Proposals — from discussion to private link

1. **Gather** — the RM selects a person/company in the CRM; the discussion thread, notes, portal enrichment and ICP score are already attached.
2. **Draft** — the portal drafts the proposal from those materials: their situation, the market picture, the offer, the guarantee, the investment, the next step (the Aarvi × YoungCaesar structure).
3. **Review** — the RM edits; a human confirms before anything is treated as fact. Every AI section carries `generated_by: ai` and `prompt_version`.
4. **Preview** — full-screen on-screen preview before sending.
5. **Send** — emailed and/or sent on WhatsApp through the tenant's chosen channel; the recipient gets the proposal document and the private link.
6. **Track** — open/view recorded in the CRM; the CRM surfaces "proposal seen → follow up" tasks.
7. **Revise** — versioned; a new version shares a new link; the old link is retired.

---

## 6. Partners, payments, LMS & debrief — all in-system

### 6.1 Partners
Named partners are onboarded by Mygyaan admin as users with scoped roles (partner can be an Agency RM, an agency manager, a delivery lead, etc.). A partner sees exactly the companies/agencies allocated to them — the same 100%-isolated membership model.

### 6.2 Payments & commissions *(regulated from here)*
* Every partner has a **commission plan**: type (percentage of collected fees, per-deal, or fixed per engagement), rate, and applicable scope.
* A **payment ledger** records every fee received and every commission earned — auto-calculated from invoices and credit-pack purchases, never from a spreadsheet.
* **Payouts** are created against the ledger, approved by admin, marked paid; each partner sees their own statement in-system.
* All amounts in INR with Indian grouping (1,00,000); invoices with GST.

### 6.3 LMS, training & debrief
* **Course library** — onboarding, product, playbooks (research, outbound, calls, proposals), certification.
* **Enrollment & progress** — per partner/RM; assignment, deadlines, completion.
* **Debrief reports** — after each call and each campaign, a structured debrief is captured in-system (what happened, outcome, follow-ups) and feeds both the CRM activity timeline and the deliverable document. Debrief reports are generated, stored and shared in-system.

### 6.4 The no-external-files rule
**No Google Docs, Excel or PowerPoint anywhere in the workflow.** Everything is created, stored, shared and reported inside the platform: the document builder (for strategies, proposals, deliverables), the grids (for lists, contacts, opportunities), the dashboards (for reports), the LMS (for training). Uploads remain possible *into* the knowledge base as source material (PDF, PPTX, DOCX, XLSX, images, URLs); outputs are always platform-native. Exports (CSV, full data export) exist only as a granted, audited feature for data portability.

---

## 7. The CMO portal — modules and phases

### Phase 1 — build now

**7.1 Platform spine** — auth (email + password, magic link, Google), agencies/companies/users/memberships/roles/isolation, company creation wizard, audit log, settings per scope, feature flags, versioning model (§6 above).

**7.2 Intelligence**
* **Knowledge base** — per-company uploads (PDF, PPTX, DOCX, XLSX, images, URLs, flipbook links); extracted text, tags, full-text search, versioning, completeness score.
* **Products & competitors** — structured records; AI drafts from the KB; human confirms.
* **ICP Builder** — the nine questions; one generated **ICP sentence** shown at the top of every list view; up to six personas.
* **Interview** — generated question set; answers write back into KB and ICP.
* **Strategy planning** — generated strategy document (positioning, pyramid layers, keywords, channels, calendars, KPI sheet); status draft → reviewed → **signed off**; nothing schedules before sign-off.

**7.3 Social campaigns** — content calendar (month + list view), post status flow (idea → drafted → approved → scheduled → published → measured), tagging to pyramid layer/persona/topic, approval step, publish via LinkedIn OAuth or assisted manual, metrics capture, campaign grouping.

**7.4 Channels** — per-company, pluggable, multiple per type: `SMTP`, `API`, `WhatsApp`, `LinkedIn`, later `Call`. Credentials per type; campaign/sequence picks a channel at send time; per-channel health defaults (daily cap, warm-up, bounce > 3% / complaint > 0.1% auto-pause); encrypted secrets.

**7.5 Opportunities, orders & hand-off** — lightweight records inside the portal; at MQL the **hand-off to CRM** object carries the thread + score into the tenant CRM (§4).

**7.6 Reporting (Phase 1 slice)** — per-company status columns; agency control tower; CSV export where granted.

### Phase 2 — schema now, build next

* **Lists & enrichment** — ingest CSV/XLSX/Sheets/CRM export; de-dup on email + domain; ICP fit score; segmentation; pluggable enrichment (Apollo, InstaFinancials, others) with prepaid credits; trigger watch with 14-day expiry.
* **Identity & sending** — `<slug>@mygyaan.ai` sending identity, warm-up, SPF/DKIM/DMARC, daily caps, auto-pause; provider pluggable via adapter; replies captured by webhook/IMAP into the portal inbox; WhatsApp Business per company with opt-in/opt-out store.
* **Templates, sequences, inbox** — template library; multi-step multi-channel sequences (email, LinkedIn, WhatsApp, call task) with three default cadences; breakup step with gift; gift tracking; **inbox** with auto-classification, suggested handler text, MQL flag, CRM hand-off.
* **Organic engines** — website audit runner, keyword lists, blog/PR drafting from KB.
* **CRM push to external CRMs** — webhook / Zapier-style first (the built-in CRM is the default destination).

### Phase 3

* **Billing & lock** — plans, prepaid balances, credit packs, GST invoices, payments, renewal reminders, hard lock/unlock (data never deleted on lock).
* **Exports & exit** — full export of KB, lists, content, reports.
* **Agency white-label** — logo, colours, custom domain (already applies to the CRM surface on tenant domains).
* **Phone outbound** via a calling provider such as joyz.ai.

---

## 8. Tenancy, roles and security

**Tenancy:** Platform → Agency → Company. Every data row carries `company_id`; agency rows carry `agency_id`; platform rows carry neither. **Isolation is 100%**, enforced at the database layer (scoped queries + RLS-style policies), never only in the UI. The CRM data of one tenant is invisible to every other tenant, exactly like portal data.

**Roles** (portal + CRM + operating layer):

| Role | Scope | Sees | Data read | Data write | Billing |
| --- | --- | --- | --- | --- | --- |
| Mygyaan admin | Platform | All | All | All | All |
| Agency manager | One agency | Its companies | Its companies | Its companies | View |
| Agency RM | Allocated companies | Allocated | Allocated | Allocated | View |
| **Partner** | Allocated scope | Allocated companies/engagements | Allocated | Work within allocation | Commissions view |
| Client admin | One company | Own company | None by default (toggle) | Settings only | View + pay |
| Client manager | One company | Own company | All | All | View |
| Client user | One company | Own company | All | All (no delete of others; no exports unless granted) | None |
| Client viewer | One company | Own company | All (read-only) | None | None |
| **CRM RM** | One company (CRM) | CRM of own company or allocation | CRM data of allocation | CRM data of allocation | None |
| **CRM viewer (client-side)** | One company (CRM) | CRM read-only | CRM read-only | None | None |

**Non-negotiables:** every permission check runs in the app **and** at the database layer; isolation tests in CI must fail on cross-company access; destructive actions are Mygyaan-admin only with typed confirmation; audit log on every write; secrets encrypted at rest, never in client code.

---

## 9. Versioning & release model — *agreed; updates only after customer agreement*

The platform version is set in admin, applied per customer, and an update reaches a customer **only after that customer agrees.**

| Concept | Where it lives | Meaning |
| --- | --- | --- |
| **Platform release** | `releases` + admin console | Numbered version, readable changelog, migrations, feature flags. |
| **Current version** | `companies.platform_version` | What a tenant is running. |
| **Available version** | `companies.pending_version` | The newest release the tenant is eligible for. |
| **Agreement** | `version_agreements` | Who approved, when, which version. No agreement → no update. |

**Flow:** admin publishes a release and marks eligible tenants → tenant admin sees *"Version X is available — see what's new"* with a readable changelog → tenant approves or declines (recorded) → on approval the tenant's version moves forward. Rollback by expand/contract migrations (admin action, logged). A tenant is never silently upgraded; feature flags tune inside a version; the version number is visible in the tenant top bar and the control tower.

---

## 10. Channels & integrations

* **Email** — provider-agnostic, **multiple channels** (SMTP or API) per company; campaign picks the channel; replies land in the portal inbox by webhook/IMAP; unsubscribe handled by the platform.
* **WhatsApp** — provider-agnostic, **multiple numbers** per company (Meta Cloud API or via Twilio/360dialog/Gupshup); opt-in/opt-out store.
* **LinkedIn** — multiple accounts/pages per company via OAuth; assisted manual publish where the API restricts automation.
* **Outbound calling** — joyz.ai (or alternative): call tasks in sequences, dialler hand-off, outcomes written back to contact + step.
* **CRM** — built-in tenant CRM is the default recipient of MQL hand-offs; external CRM push by webhook/Zapier-style (Phase 2), native connectors later.
* **Enrichment** — pluggable providers, prepaid credits.
* **Payments** — gateway + manual posting; GST invoices; partner payouts from the ledger.

---

## 11. Data model (summary)

All tables carry `id uuid`, `created_at`, `updated_at`, `created_by`, and soft-delete `deleted_at` where noted.

* **Platform/tenancy:** `agencies`, `companies`, `users`, `profiles`, `memberships`, `audit_log`, `feature_flags`, `releases`, `version_agreements`.
* **Intelligence:** `kb_documents`, `products`, `competitors`, `icp_profiles`, `personas`, `interviews`, `interview_questions`, `strategies`, `keywords`.
* **Channels:** `channels` (company_id, name, type `smtp|api|whatsapp|linkedin|call`, config encrypted, health jsonb).
* **Social:** `channels_links`, `campaigns`, `posts`, `post_metrics`.
* **Portal records:** `contacts`, `accounts`, `opportunities`, `orders`, **`mql_handoffs`** (contact_id, account_id, thread ref, score, source_campaign_id, notes, crm_deal_id).
* **Outbound (schema now, UI Phase 2):** `lists`, `list_contacts`, `enrichment_jobs`, `credit_ledger`, `triggers`, `templates`, `sequences`, `sequence_steps`, `enrollments`, `touches`, `inbox_messages`, `gifts`, `gift_events`, `whatsapp_templates`, `email_providers`.
* **CRM (new):** `pipeline_stages`, `deals` (company_id, account_id, contact_id, stage, value, rm_id, source_handoff_id, won_at, lost_reason), `deal_activities`, `crm_tasks`, `invoice_records`.
* **Proposals (new):** `proposals` (company_id, deal_id, title, body jsonb, version, status draft|previewed|sent|accepted|declined, token, token_expires_at, noindex flag, view_events), `proposal_versions`.
* **Partners & payments (new):** `partners` (user_id, status, scope), `commission_plans` (partner_id, type `percent_of_collected|per_deal|fixed`, rate, scope), `payment_ledger` (entry type `fee_received|commission_earned|adjustment`, amount, invoice_id, partner_id), `payouts` (partner_id, period, amount, status `open|approved|paid`, paid_at), `statements`.
* **LMS & training (new):** `courses`, `lessons`, `enrollments` (user_id, course_id, progress, status), `trainings` (company_id, scheduled_at, topic, attendees), `debriefs` (company_id, kind `call|campaign`, ref_id, outcome jsonb, follow_ups).
* **Billing (Phase 3):** `plans`, `subscriptions`, `balances`, `credit_packs`, `invoices`, `payments`, `lock_events`.

**Isolation pattern on every company-scoped table:**

```sql
-- every query resolves the user's membership once; all reads/writes are scoped by it
company_id in (select company_id from v_user_company_access where user_id = auth.uid())
```

---

## 12. Build & hosting on Abacus AI *(decided)*

**Abacus AI is the single source for creation and hosting.** Next.js (App Router), TypeScript, Tailwind, shadcn/ui; the platform's hosted PostgreSQL; the platform's LLM APIs for KB extraction, ICP sentence, strategy and post drafts, proposal drafting and reply classification (prompts versioned in `/prompts`); platform storage with per-company buckets and signed URLs; scheduled tasks for posts, enrichment, sequences, lock checks and version migrations.

* The custom domain `cmo.mygyaan.ai` is wired to the app; DNS markers (CNAME/verification) come from the app console for the customer's DNS provider once live.
* The CRM surface binds to the tenant's own domain (`cmo.nandan.co.in/crm`) via the white-label/custom-domain mechanism; DNS records for `cmo.nandan.co.in` will follow the same path.
* One codebase, one version number, checkpointed releases (the release train of §9).

---

## 13. Market & competitive landscape *(updated October 2026)*

A scan across CMO-as-a-Service firms, agency platforms, outbound tools, and manufacturer-specialist agencies shows the concept exists in pieces — no product combines all of it.

### 13.1 "CMO as a Service" consulting firms *(service model, no software)*

| Name | What they do | The gap vs mygyaan |
|---|---|---|
| **Chief Outsiders** | Senior CMOs embedded in mid-market companies; Fortune 500 bench | Strategy only; no software; customer uses HubSpot/Sheets/PPT |
| **Kalungi** | Fractional CMO + execution team for B2B SaaS | SaaS-focused, not manufacturers; no portal the customer logs into |
| **CMOaaS.co (7P)** | Consulting + training for B2B tech (Israel-based) | Advisory only; no multi-tenant software |
| **XQL Group** | GTM strategy + CRM-tracked pipeline for B2B tech | Not manufacturers; no owned software; data stays in HubSpot |
| **b2bcxo.com** | Fractional CMO + execution team | No product; no tenant portal |

Every firm here delivers a person and a strategy. The customer still uses external tools. There is no portal the customer logs into to see their own marketing running.

### 13.2 Agency-managed marketing platforms *(software, but generic)*

| Name | What they do | Strengths | The gap |
|---|---|---|---|
| **GoHighLevel** | Agency master + isolated sub-accounts; email, SMS, calls, WhatsApp, funnels; white-label; "Snapshots" for fast client onboarding | Best structural match: client isolation, multi-channel, white-label. $297–$497/mo. | No intelligence engine (no KB → ICP → strategy); no per-customer version pinning; no deliverable document; no manufacturer-specific ICP |
| **Vendasta** | White-label AI platform for agencies; AI workforce (reputation, social, ads, SEO); reseller marketplace | Full-stack agency OS; strong AI automation layer | SMB-focused (restaurants, retail, local); no manufacturer ICP; no outbound sequences; no tenant-level version control |
| **SuiteDash** | All-in-one: CRM, billing, projects, LMS, messaging | Closest on LMS + billing in one tool | No outbound sequences; no tenant-level isolation; no manufacturer focus |
| **Fraxo** | Command centre for fractional executives managing 3–6 clients | Purpose-built for multi-client practice management | A management dashboard, not a marketing-execution platform |

GoHighLevel is the nearest structural cousin but has no intelligence layer: no knowledge base, no ICP builder, no strategy document, no deliverable. None of these has per-customer version pinning.

### 13.3 B2B outbound platforms *(the outbound engine only)*

| Name | What they do | The gap |
|---|---|---|
| **SmartReach.io** | Email + LinkedIn + WhatsApp sequences; unified inbox; flat pricing | Single-tenant; no KB; no ICP; no organic; not a client portal |
| **Outboundry** | Email + LinkedIn + WhatsApp all-in-one; warmup; unified inbox | Single-tenant; no intelligence layer |
| **Amplemarket** | Multi-channel sequencing (7 channels); signal-based triggers; AI reply agents | Enterprise pricing; single-tenant; no portal for the customer |
| **Lemlist / La Growth Machine / Smartlead** | Multi-step sequences; LinkedIn + email + WhatsApp; reply handling | Single-tenant SaaS; no organic; no CRM hand-off per tenant |
| **Apollo / Clay / Instantly** | Lists, enrichment, sending; data layer | No portal; no organic; tools the agency operates |

Every platform here is a tool the agency operates. The customer never logs in.

### 13.4 Manufacturer-specialist agencies *(the service reference)*

| Name | Model | The gap |
|---|---|---|
| **YoungCaesar / Kris** | Industrial B2B growth agency; 9 AI agents; SEO + cold outreach + content; strict one-niche exclusivity | The Aarvi × YoungCaesar proposal is the **exact** reference for mygyaan's deliverable engine — but it is hand-built per client; nothing lives in a customer portal; one client per niche only |
| **GrowSALT** | Outsourced prospecting for complex B2B; relationship-based; long-cycle account development | Advisory + prospecting only; no software; no organic engine; no portal |
| **Belkins / SalesHive / CIENCE / LeadHaste** | Outbound-as-a-service agencies; LeadHaste's "client keeps the assets" model mirrors the ownership promise | Fully human-delivered; no software product; not scalable to 10 tenants simultaneously |

GrowSALT and YoungCaesar are the service model. Mygyaan's platform is what you get when you productise that motion so it runs for 10 manufacturers at once.

### 13.5 Agency reporting tools *(the control tower only)*

| Name | What they do | The gap |
|---|---|---|
| **AgencyAnalytics** | Per-client dashboards (SEO/PPC/social/email); white-labelled; T1/T2/T3 KPI discipline | Reporting only; no outbound; no ICP; no documents |
| **Whatagraph / Cometly** | Multi-channel reporting; client-shareable dashboards | Reporting only; no executing |

### 13.6 Summary — where mygyaan sits

| Capability | GHL | Vendasta | SmartReach | YoungCaesar | **mygyaan.ai** |
|---|---|---|---|---|---|
| Tenant isolation (100%) | ✅ | Partial | ❌ | N/A | ✅ |
| Knowledge base → ICP → strategy | ❌ | ❌ | ❌ | Manual | ✅ |
| Multi-channel outbound (email + LinkedIn + WhatsApp + calls) | ✅ | Partial | ✅ | Manual | ✅ |
| Organic engine (SEO/SEM, content) | ❌ | Partial | ❌ | ✅ Manual | ✅ |
| Living deliverable document (Kris-style) | ❌ | ❌ | ❌ | ✅ Manual | ✅ |
| Private proposal links | ❌ | ❌ | ❌ | ✅ Manual | ✅ |
| Built-in CRM per tenant | ❌ | Partial | ❌ | ❌ | ✅ |
| Partner/commission/LMS in-system | ❌ | Partial | ❌ | ❌ | ✅ |
| Per-customer version pinning | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manufacturer-specific ICP | ❌ | ❌ | ❌ | ✅ Manual | ✅ |
| Social posting (FB/IG/LinkedIn) | ✅ | ✅ | ❌ | Manual | ✅ (Phase 2) |

**The positioning in one line:** mygyaan.ai is what you get when you take the YoungCaesar service model, the GoHighLevel tenant architecture, the SmartReach outbound engine, and the AgencyAnalytics control tower — and build them as one platform, isolated per tenant, with a living deliverable document and a built-in CRM, for B2B manufacturers. That combination does not exist yet as a single product.

---

## 14. Monetization & pricing *(illustrative — to be finalised by Dr Raghu)*

### 14.1 Packages
One monthly package per company. Modules toggled by plan tier; CRM included in every package.

| | Starter | Growth | Scale |
| --- | --- | --- | --- |
| Intelligence (KB, ICP, interview, strategy) | ✅ | ✅ | ✅ |
| Social/LinkedIn calendar + approval | ✅ | ✅ | ✅ |
| Channels (email, WhatsApp, LinkedIn) | 1 email + 1 WhatsApp | Multi, on all | Multi, on all |
| Outbound sequences | — | ✅ | ✅ |
| CRM (funnel, RM, proposals) | ✅ | ✅ | ✅ |
| Proposals (Kris-style private links) | ✅ | ✅ | ✅ |
| Debrief & reporting | Basic | Full | Full + control tower |
| LMS / training seats | — | Up to N | Up to N |
| Support | Standard | Priority | Dedicated |

*Monthly fee, INR, Indian grouping; setup/onboarding fee (one-time) per tenant; ad spend always paid directly by the customer to the platforms (as in the reference offer). Numbers to be confirmed.*

### 14.2 Credit packs (prepaid)
* Enrichment credits (per enrichment call).
* Email volume credits (per send) and WhatsApp conversation credits.
* Proposal/document generation credits (per AI draft).
Packages include a monthly baseline; overages draw from the tenant's prepaid balance; balances visible in Settings and the control tower.

### 14.3 Partner commissions
Commission plans per partner (percent of collected fees, per-deal, or fixed); commission earned is auto-calculated in the payment ledger on fee receipt; payouts approved by admin and paid. Each partner sees a statement in-system — no spreadsheets.

That said — the numbers, tiers and credit prices are the one area that needs final figures from Dr Raghu; §17 keeps this as the primary open decision.

---

## 15. Go-to-market for mygyaan itself

1. **Reach** — LinkedIn (Dr Raghu's and the company page's presence) + targeted email to B2B manufacturers, using the same outbound engine the product sells.
2. **Attract** — the marketing site converts visitors with the Nandan GSE proof case and a live demo tenant.
3. **Convert** — demo request → CRM lead → RM assigned → proposal built from the discussions → sent as a private link.
4. **Prove** — Nandan GSE is tenant #1 and the reference case; Fabro is the second seeded tenant.
5. **Scale** — named partners and partner agencies bring their own customers onto the platform.

---

## 16. Roadmap and milestones

| Milestone | Content | Gate |
| --- | --- | --- |
| **M0 — Plan signed off** | This document reviewed by Dr Raghu | Agreement on scope, stack, versioning, packages |
| **M1 — Spine** | Database, auth, tenancy, isolation, memberships, roles, versioning | Isolation tests pass |
| **M2 — Admin & settings** | Console, company wizard, audit log, releases | Admin can create `nandangse` and `fabro` isolated |
| **M3 — Intelligence** | KB, ICP Builder, personas, interview, strategy + sign-off gate | ICP sentence generated; scheduling blocked pre-sign-off |
| **M4 — Social & records** | Channels, campaigns, posts, calendar, approval, metrics, opportunities | Post goes idea → published with approval |
| **M5 — Marketing site placeholder** | Landing page + demo request → CRM lead | Demo request lands in CRM |
| **M6 — CRM slice** | Funnel, inbound leads, RM assignment, activities, deals; MQL hand-off from portal | Lead flows portal → CRM; stage changes recorded |
| **M7 — Proposals** | Proposal builder, preview, private link, email send, view tracking | Proposal sent → link opens → CRM updated |
| **M8 — Partners & payments** | Partner onboarding, commission plans, ledger, payouts | Commission auto-calculates on fee receipt |
| **M9 — LMS & debrief** | Courses, trainings, debrief reports | Debrief from a call lands in CRM timeline |
| **M10 — Reporting & control tower** | Per-company report, agency + partner views, CSV export | Control tower lists companies incl. deals & versions |
| **M11 — Outbound** | Lists, enrichment, identity, sequences, inbox, WhatsApp, MQL hand-off | First sequence sends; replies classified; MQL flagged |
| **M12 — Billing & lock** | Plans, credits, invoices, payment posting, lock/unlock | Lock and unlock demonstrated |
| **M13 — Nandan GSE live** | Tenant #1 running end to end (portal + CRM) | First qualified conversations delivered |

**Build now (today):** M1 + M2 + M5 and the shells of M3/M4 — platform spine, admin console, marketing placeholder, `/nandangse` + `/fabro` tenant shells, versioning running. **Next after that:** M6 (CRM slice) and M7 (proposals), because the CRM is the surface the business actually works in.

---

## 17. Risks and open decisions

**Risks**
* **Deliverability** — new sending domains need warm-up; thresholds auto-pause. Mitigation: caps, warm-up, adapters.
* **LinkedIn API limits** — assisted manual publish fallback.
* **WhatsApp Business approval** — start the application during Phase 1 for Nandan GSE.
* **Tenant isolation** — the first test, not the last. Mitigation: isolation test suite in CI from M1.
* **CRM/portal boundary discipline** — the CRM must never creep into the portal or vice versa. Mitigation: separate surfaces, separate roles, hand-off objects, tests.
* **Version drift** — expand/contract migrations; supported-version window; readable changelogs.
* **Cost per tenant** — quotas and credit packs.

**Open decisions**
1. **Final pricing** — package fees, setup fee, credit-pack prices (numbers in §13 are illustrative for Dr Raghu's approval).
2. **Dedicated bulk email provider** — which, priced separately.
3. **Calling provider** — confirm joyz.ai or alternative.
4. **WhatsApp provider preference** — Meta Cloud API direct or via provider.
5. **LinkedIn account model** — accounts/pages per tenant; API constraints.
6. **CRM domain model** — confirm each tenant binds their own domain to `/crm` (Nandan: `cmo.nandan.co.in`); DNS access needed per tenant.
7. **Data residency** — single region.
8. **External CRM connectors** — which CRMs come first (webhook/Zapier-style baseline).

---

## 18. Immediate next steps

1. ✅ **Plan v2.0 delivered** — CRM, proposals, partners/payments/LMS and monetization folded in; build authorized on Abacus AI.
2. **Build slice 1 in progress:** platform spine, admin console, marketing placeholder, `/nandangse` + `/fabro` tenant shells, versioning model — live preview on Abacus.
3. **Next build slice: the CRM (M6–M7)** — funnel, RM assignment, proposals with private links, MQL hand-off; `cmo.nandan.co.in/crm` as first instance.
4. **Wire custom domains** — `cmo.mygyaan.ai` records issued from the app console when live; then `cmo.nandan.co.in` for the CRM.
5. **Start the WhatsApp Business application** for Nandan GSE now.
6. **Seed `nandangse` and `fabro`** and demonstrate Phase 1 criteria on them.
