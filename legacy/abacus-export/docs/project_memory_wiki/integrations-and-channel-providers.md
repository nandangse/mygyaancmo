---
name: "Integrations and Channel Providers"
description: "Integration catalogue and channel providers: WhatsApp, Calling/VoIP, LinkedIn, Email/Mailer Cloud, Apollo, and the outbound REST API for Genie CRM."
---

- WhatsApp: provider API configured in admin and swappable; API is number + message + attachment pushed from the portal. Every communication is listed in the portal.
- Calling/VoIP must support Indian, US and worldwide numbers at reasonable cost; lives under Integrations > Calling with Plivo as the default adapter (Twilio as alternative); click-to-call logs every call.
- Integrations is a major top-level section: catalogue by category with Add / Choose-active / Request actions. LinkedIn is catalogue-only for integration config (assisted default; company page coming soon), low priority.
- Email Campaigns: live delivery needs an email provider connected under Integrations; until then send only marks the campaign sent and metrics are entered manually.
- Integrations page is the single home for all integrations; each is configured per tenant there. Rule of One's Apollo key is read from the tenant's Integrations config (Apollo is in the catalogue), not a global setting.
- LinkedIn module (built and deployed live both hostnames, 17-Oct-2026, verified in browser): page /[tenant]/linkedin under Channels > Social, 4 tabs (Compose, Published, Comment Wall, Outreach), runs in Sandbox mode: AI compose, schedule, simulated publish/engagement/comments, comment wall, AI-drafted outreach (human sends). Stored via Post and PostComment models; helpers in lib/linkedin.ts. Real publishing, engagement and comments need LinkedIn app approval (Community Management API) plus an access token. Auto-follow and auto-DM are deliberately not automated (against LinkedIn terms, account-ban risk).
- Outbound API for Genie CRM: per-tenant API keys managed on the API Access page (tenant nav, after Integrations); REST under /api/v1 (GET /me, GET/POST /contacts, GET+PATCH /contacts/:id, GET /opportunities); data scoped to the key's company; stored in an ApiKey model.
- Mailer Cloud: added to the Integrations catalogue (email category) and used as a sending channel from Email Studio/Campaigns. Email sending goes through a provider-agnostic sender that reads the tenant's active email integration (SendGrid/SES stubbed for later); a test-email endpoint verifies config. Deploy to both hostnames in progress 17-Oct-2026.
