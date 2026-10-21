---
name: "Pending Work, Bugs and Team Notes"
description: "Open to-dos, known bugs and fixes, scoring notes and team conventions."
---

- Knowledge Base "Add Document" 500 error (client sent multipart form, server read JSON) fixed, adds a Notes/paste-content field; deployed live to both hostnames (17-Oct-2026), so both hostnames are in sync again.
- KB completeness score is the coverage of 6 document types (brochure, presentation, website, social, pricing, case study); 0% only when the KB is empty. Company Brain is deliberately not counted in this client-facing score (Brain is Mygyaan-AI internal only). Onboarding % does count KB and Brain.
- The dark "N" circle overlapping the sidebar (Integrations/API Access) and the "yellow AI button" were the preview-only dev-tools indicator; not present in production, no fix needed.
- Other upload routes not yet audited for the same form-body bug.
- Still to do: Exports & exit; Agency white-label is partial (Branding tab exists); admin form to add new integration types (offered); optional webhook to push new leads to Genie (offered); optional auto-email of set-password links and a forgot-password flow. LinkedIn sandbox pipeline is built (see Integrations and Channel Providers); going live awaits LinkedIn app approval and token.
- Voice Agent Phase 1 target 17-10-26 (sandbox built); live calls blocked on Indian telephony account, Vapi key, WhatsApp API and Genie endpoint (see Voice Agent).
- Team: Hashir is starting work on the project. Convention: when Hashir writes "deploy Hashir!" it is a deploy request.
- Workflows (Vault) module, all 3 phases, is live; see Workflows Module.
