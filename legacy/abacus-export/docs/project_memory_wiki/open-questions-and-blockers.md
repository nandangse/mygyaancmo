---
name: "Open Questions and Blockers"
description: "Blockers, open questions and next steps: Abacus India-region answer,\ntenant onboarding, pending integrations and pilot plan."
---

- Tenants Nandan and Fabro exist; Fabro has no dedicated login yet. Until Abacus replies, only Nandan is built/onboarded.
- BLOCKER: Abacus.AI support must confirm India-region hosting and per-tenant database provisioning (see Decisions). Support email drafted for Dr Raghu to send; awaiting reply. No data-layer rebuild until answered.
- Needs Nandan's website URL to run SEO audits; weekly automatic audit job not yet scheduled.
- GA, Google Ads and LinkedIn KPI auto-sources populate only once integrations are connected with credentials.
- Cross-tenant KPI propagation deferred; schema supports it.
- Open questions: first CRM to integrate; per-channel send caps and warm-up; WhatsApp provider and number count; LinkedIn account model; agency layer in Phase 1; meaning of "tenants one inside another"; CRM questions; bulk email provider; monthly Abacus cost; GA Measurement ID.
- Next: get Abacus answer; pilot to validate tenant separation, import/search performance and email delivery capacity before loading all contacts.
- Coresignal (coresignal.com/integrations) under consideration as a Discovery data source; nothing built yet. Member's proposed model: each account gets credits from a shared pool, discovery is chargeable so team members can use it, and only the admin at cmo.mygyaan.ai/admin sees all records while other users do not. Open: whether discovered records are compartmentalized per tenant or become shared "our records"; the per-tenant isolation and data-residency rules in Decisions still apply.
- Member bought a Hostinger server in India and asked about hosting cmo.nandan.co.in there; self-hosting is under consideration, not decided. Open: which app is meant (CMO portal or the separate CRM), whether the plan is VPS/Cloud (shared hosting cannot run Node), and whether to keep Abacus APIs (some calls leave India) or replace them for fully in-India operation. Relates to the hosting/data-residency blocker in Decisions.
