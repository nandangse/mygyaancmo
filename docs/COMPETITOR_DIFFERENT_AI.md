# Competitor note — Different (different.ai)

Read 22-Oct-2026 from different.ai/blog/introducing-different and different.ai/demo.

**What it is.** An AI marketing system that runs B2B demand generation end to end: the marketer sets
goals, budget and brand boundaries; Different proposes accounts, segments, personas and messaging;
builds personalised ads, emails and landing pages; launches them in connected platforms; reads results
back and re-allocates budget, messaging and offers. Launched publicly after a year with early
customers, $48M led by General Catalyst with Lightspeed.

**Who it is for.** Lean B2B marketing teams with "more campaign ideas than people": the same buyer as
MyGyaan CMO. Not self-serve: every customer gets a marketing strategist. Setup is CRM + ad accounts +
a landing-page subdomain + goals; first campaign reviewed and launched within a week.

**Feature list (theirs → ours).**

| Different | MyGyaan CMO today | Gap / opportunity |
| --- | --- | --- |
| Shared memory of preferences, business context and results by channel, persona, industry, segment | Company Brain, KB, ICP, personas, industries, segments | Same raw material. Theirs is *fed back* by results; ours is written once. Close the loop: campaign outcomes should update the brain. |
| Two-way integrations: HubSpot, Marketo, LinkedIn Ads, Google Ads, GTM; Salesforce soon; Clay/Drive/Notion/Slack via MCP | Per-tenant integration catalogue (email, WhatsApp, calling, Apollo, Vapi); Genie CRM via API keys; GA/Ads KPIs once credentials are set | Paid ads are absent in ours. We hand MQLs to a CRM; they run paid + CRM in one loop. |
| Handles execution failures (rejected ads, sync failures, overspend) | Manual | Needs an operations/alerts layer once ads are in scope. |
| Evals before system changes ship and on live campaigns | None | Our "Ask the experts" stress test is the seed of this. |
| Guardrails: block off-brand or over-budget assets | Verified Facts guardrail (`[CONFIRM:]` marks) | Ours guards truth, theirs guards brand + money. Both are needed. |
| Human approves every campaign; any asset editable | Same (draft → review → send) | Parity. |
| AEO: tracks how AI answer engines describe the brand, recommends content | None | New, cheap to add to the SEO Audit module: query a few LLMs about the tenant weekly, store the answers, diff them. |
| Personalised landing pages on a customer subdomain | None | Workflows produce copy, not pages. |
| SOC 2 Type II, ISO 27001, pen tests, DPA | India data residency, DB-per-tenant | Our residency story is stronger for Indian/EU buyers; theirs is the enterprise checklist. Both will be asked for. |

**Where MyGyaan CMO is different, and should say so.**
1. **Manufacturing B2B in India, with WhatsApp + calling + voice agent.** Different is ads + email + landing pages for software-style buyers. Indian manufacturers buy over WhatsApp and the phone; Different has neither.
2. **Data stays in the customer's country, in the customer's own database.** Different is a US SaaS.
3. **Agency model.** MyGyaan can run partner agencies; Different sells direct with its own strategists.
4. **Price point.** Not published by either; a $48M-funded US product will not be priced for a Rs 50-crore manufacturer.

**Borrow, in this order.**
1. Closed-loop learning: write campaign results back into the brain/ICP (needs the result ingestion we already have for email and WhatsApp).
2. AEO check inside the SEO Audit module.
3. Budget and brand guardrails on every generated asset, next to the existing fact guardrail.
4. A "first campaign in a week" onboarding promise and a strategist-led demo format: bring your goal and one hard campaign.

**Not to borrow.** Paid-ads execution. It is their core and a large build; stay on organic + outbound until tenant #1 is winning there.
