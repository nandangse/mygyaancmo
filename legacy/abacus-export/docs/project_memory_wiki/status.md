---
name: "Status"
description: "Deployment status: live modules, hostnames, release versioning and pending deploys.\nWhat is live as of 17-Oct-2026 and what awaits go-ahead."
---

- Deployed at https://mygyaan-cmo.abacusai.app and cmo.mygyaan.ai (custom domain) only; older 0x8e0k hostnames and mygyaan.ai deployments have been stopped.
- Deployed modules: marketing site, admin console, tenant shells with versioning; Phases 1-3 modules (Company Brain, Industries & Segments, Competition Intel, Leads & Scoring, Email Studio, WhatsApp, Integrations, VoIP/Calling, LinkedIn catalogue, Website & SEO Audit, KPIs, Email Campaigns, Products, Interview, Strategy, Social Calendar and Campaigns, Reports, Lists, Templates, Sequences, Inbox, Billing/Lock admin); feature flags enabled so P2 badges no longer show.
- Deployed live on 11-Oct-2026: Marketing Plan, Rule of One, admin company logo upload, Book Summaries + Books CMS with 22 books, Partner page/banner/form, Partner Leads admin, public Testimonials page (see Marketing Content and Partner Program).
- Also live 11-Oct-2026: prospect CSV upload on Lists page, API Access page (/nandan/api-access) with tenant-scoped API keys and /api/v1 REST endpoints for Genie CRM (see Integrations and Channel Providers). Onboarding checklist already built.
- Also live 11-Oct-2026: Voice module (Speed-to-Lead agent) in sandbox mode; see Voice Agent.
- Release versioning: Release v1.2 (Workflows, Email Campaigns, SEO Audit/KPIs, nav overhaul, logo, homepage polish, CSV upload, API Access, Mailer Cloud, Voice sandbox) created 17-Oct-2026 and pending tenant-admin approval for fabro, mygyaan and nandan (Nandan is live on v1.1, others v1.0); approval left to tenants per the customer-agreement rule.
- Nandan tenant (slug nandan) has all feature flags enabled (all modules open); its logo is still to be added via admin Companies > Logo; Apollo must be configured at /nandan/integrations before the Rule of One audience works.
- Mailer Cloud integration built; deploy to both hostnames in progress 17-Oct-2026.
- Landing page: "Book a demo" popup, textarea and redesigned logo deploy requested 14-Oct-2026.
- Live 18-Oct-2026 on both hostnames: tenant Audience page (/[tenant]/audience, nav after Rule of One) showing the SEO Content Funnel graphic (CiteRank branding removed at member's request) plus a native "From our audience" re-render; co-branded frozen header on all tenant pages (Mygyaan CMO logo left, tenant logo right).
- LinkedIn 26-skill engine (lib/linkedin-skills.ts) is started but not wired to UI/API; deferred.
