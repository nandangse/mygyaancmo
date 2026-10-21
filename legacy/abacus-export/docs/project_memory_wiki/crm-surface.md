---
name: "CRM Surface"
description: "The CRM component (cmo.nandan.co.in/crm), separate from the CMO portal: its purpose, funnel, lead intake, RM assignment and personalized proposals."
---

- The CRM at `cmo.nandan.co.in/crm` is a pure CRM, separate from the CMO portal — it drives marketing and sales for the package.
- Funnel stages: Inbound → Assigned → Qualifying → Proposal sent → Negotiating → Won / Lost.
- All inbound leads for the CMO (demo requests, MQLs, replies, referrals) flow into the CRM.
- RM assignment happens in the CRM; proposals are built from discussions and sent as Kris-style private links (`cmo.mygyaan.ai/<slug>-<token>`, noindex, token-gated, tracked).
- Partners (named, generic references only — no individual partner names in docs) are onboarded here; their payments/commissions regulated from here.
- LMS, training, and debrief reports all live in-system.
- Hard rule: no external docs/Excel/PPT anywhere in the product workflow.
- Social posting (Facebook Pages, Instagram Business, LinkedIn Company Pages) confirmed technically feasible via API — same as Buffer/Padly; LinkedIn personal profiles use assisted-manual fallback. This is Phase 2 social build.
- Partner applications (from the /partner form) are saved to the database as open hot leads (source partner_page) in a Partner Leads section of the admin console, in addition to the admin email alert.
- Partner lead workflow: status open, assigned, contacted, qualified, converted, archived; a lead can be assigned to an admin/manager/RM user, and assigning an open lead moves it to assigned.
- The admin dashboard shows an Open Partner Leads card linking to the Partner Leads section.
