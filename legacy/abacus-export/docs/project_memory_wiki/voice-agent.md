---
name: "Voice Agent"
description: "Speed-to-Lead Voice Agent: purpose, stack, Phase 1 scope, qualification and scoring, tenant settings, inputs due, acceptance, risks, and sandbox-mode build state."
---

- Purpose: every inbound web or ad lead gets an AI voice call within 60 s, is qualified, and lands in Sales Genie with a summary; live for Nandan GSE by 17-10-26 (deadline moved from 25-10-26). Reason: Google Ads form leads arrive as "Webenquiry" emails in a catch-all inbox, some unread since Apr-26.
- Lives as a Voice module in the CMO portal (cmo.mygyaan.ai); Nandan GSE is tenant #1, later enabled for other tenants via settings.
- Build state: Phase 1 built and deployed live on 11-Oct-2026 in sandbox/mock mode (no external accounts yet): tenant Voice nav item under Channels, leads table, Test Call simulator, Settings tab with 12 settings, token-secured per-tenant lead-intake webhook, Vapi end-of-call webhook, scoring, Genie push, WhatsApp alerts. Stored in a VoiceLead model; settings in Company.settings.voice. Vapi, Sales Genie and Exotel added to the Integrations catalogue (new Voice AI category). Goes live with real calls once credentials are entered on the tenant Integrations page.
- Retry ladder caveat: platform scheduler has a 1-hour minimum, so +5 min/+2 h retries need Vapi's own scheduler or a frequent cron hitting the voice-retry endpoint; approach not yet chosen (awaiting Vapi connection).
- Stack decision: Vapi for call orchestration, Claude as reasoning model, Indian number via Exotel or Plivo SIP, ElevenLabs voice.
- Phase 1: outbound call-backs to consented form submitters only (Google Ads and website forms, Gmail "Webenquiry" parser as stopgap); up to 3 attempts then WhatsApp; English, Hindi, Marathi; live transfer of Hot leads; summary, score and transcript into Sales Genie.
- Later: inbound call answering (Phase 2); self-serve multi-tenant settings UI (Phase 3); cold calling needs TRAI/DLT; other languages, demo booking, usage billing.
- Qualification: five questions in under 3 minutes (org type, equipment and quantity, timeline, budget/tender, decision-makers and email); scores Hot/Warm/Cold. Final questions, weights and calling hours are Nitu's to confirm by 15-10-26; the portal currently uses the draft as defaults.
- Hot = timeline <=6 months and budget/tender: live transfer to duty salesperson plus WhatsApp to Nitu. Warm: Genie summary, follow-up within 24 h. Cold: logged, nurture email sequence.
- Guardrail: agent never quotes prices, delivery dates or specs not in the knowledge base; opening line discloses AI and recording.
- Integrations: form webhook in; Vapi outbound call API and end-of-call webhook; Sales Genie API (genie.nandan.co.in/crm); WhatsApp Business API for alerts and fallback.
- Nothing Nandan-specific hard-coded: all values are tenant settings (number, agent, languages, knowledge base, questions, hours, retry policy 60 s/+5 min/+2 h then WhatsApp, transfer roster, alert recipients, CRM destination); one Vapi assistant per tenant; RM fills settings in DB in Phase 1.
- Inputs due from Nandan by 15-10-26: telephony account with Indian number and SIP (Vishwas, 13-10-26, critical blocker); form access (Vishwas/web team); FAQ/specs/"don't say" list (Ankeet/Chinmay); questions, scoring, hours and duty roster (Nitu); Genie API key (Medhansh); WhatsApp provider account (Vishwas).
- Acceptance: 90% of leads called within 2 min and every call in Genie without manual entry, sustained 2 weeks; Hot transferred live >=80%; summary rating >=4/5; 20 test calls scored by Nitu.
- Member answers: lead sources beyond Google Ads/website all included; night leads handled; international leads get a call.
- Risks: Vapi numbers not Indian so SIP spike on day 1; TRAI (consented leads only); recording consent; third-party data retention (ISO 27001 push).
