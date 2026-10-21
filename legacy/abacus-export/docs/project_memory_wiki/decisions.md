---
name: "Decisions"
description: "Project decisions with rationale, e.g. hosting choice and company brain confidentiality."
---

- Company brain is used only by Mygyaan AI and is never shown or shared with users (including as readable content); reason given: if shared it will be stolen.
- DATA RESIDENCY (absolute requirement, Dr Raghu): data residency is decided per tenant AT ONBOARDING, as a first-class step — not an afterthought.
  - An India-based customer's data MUST physically reside in India (DPDP Act); a Europe-based customer's data MUST reside in their own country/region (EU/GDPR).
  - The core platform application code should be hosted in India.
  - Model: one shared application (hosted in India) + each tenant's DATA STORE pinned to the customer's required region.
  - Open/blocking: region selection is a hosting-platform/infra decision, not in app code. Must confirm with Abacus.AI whether it can (i) host the app in India and (ii) provision a per-tenant database in a chosen region (e.g. EU). If the managed platform cannot pin data per region, the compliant path is self-hosting on a cloud provider offering India + EU regions (app architecture supports this).
  - App-side work to do once hosting model is settled: add a region-aware tenant field + onboarding step so each tenant is tagged with its required data region and connects to the DB provisioned in that region. Do NOT build speculatively before hosting approach is confirmed.
- DATABASE-PER-TENANT (absolute requirement, Dr Raghu, stated 09-Oct-2026): each tenant MUST have its own physically separate database — NOT the current shared-DB + row-level (companyId) isolation model.
  - Rationale: strongest isolation; aligns with per-tenant data-residency (each tenant's DB can be pinned to the required country/region).
  - Current state: app is built on ONE shared database with companyId on every row. Moving to DB-per-tenant is a major architecture change: requires (a) a tenant registry/catalog DB that maps tenant slug -> that tenant's database connection string + region, (b) dynamic per-request DB connection routing (Prisma client per tenant / connection pooling), (c) a provisioning step at onboarding that creates+migrates a new database for each new tenant, (d) schema-migration fan-out across all tenant DBs on every release.
  - BLOCKING dependency: this needs the HOSTING platform to be able to provision a separate database per tenant (ideally in a chosen India region). Must confirm with Abacus.AI whether the managed platform supports multiple/provisionable databases per app. If not, the compliant path is self-hosting on an India cloud region where databases can be provisioned on demand.
  - Do NOT rebuild the data layer speculatively until the hosting/provisioning model is confirmed — building DB-per-tenant routing against a platform that only gives one DB would be wasted work.
- Hosting decided: Abacus AI is the single source for building and hosting (chosen over Claude Code + Vercel + Supabase).
- Scope boundary: the Blog, Mygyaan Cloud, Podcast, Feature Request and 99dayplan page requests (and the Google Doc book list) were meant for the separate mygyaan.ai site, not the CMO app; nothing was changed in the CMO for them. Nothing related to Nandan goes on mygyaan.ai unless Dr Raghu says so.
