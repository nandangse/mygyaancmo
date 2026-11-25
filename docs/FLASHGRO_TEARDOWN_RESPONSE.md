# FlashGro33 teardown — read against what is built (25-Nov-2026)

Source: Claude doc "FlashGro33 Teardown — Blueprint for CMO.mygyaan.ai" (62 pages of Nandan's FlashGro
tenant #87, read 25-11-26). This note maps its recommendations onto `cmomygyaanai/` as it stands.

## Where the teardown is right

- The **Contact 360 data groups**, **weighted ICP scoring**, **automation vocabulary** (28 triggers, 7 step
  types, enrolment + re-entry) and the **WhatsApp health-check panel** are the four things worth lifting.
- Its weakness list is a good "don't" list for us: typeahead instead of full-table dropdowns, one built
  bundle, real email verification, no ad pixels inside the logged-in app, manufacturer vocabulary.
- The rule "one contact/company record shared by CMO and Genie, or a sync contract before either is built"
  is the most important sentence in it.

## Where it is out of date

The teardown treats CMO.mygyaan.ai as not yet built and asks "build, wrap or white-label?". That question
is answered: `cmomygyaanai/` is a working Next.js + Prisma app with ~40 modules (KB, ICP, interview,
strategy, marketing plan, Rule of One, SEO audit, KPIs, email studio + campaigns, WhatsApp, calling, LinkedIn,
voice agent, workflows, lists/contacts, integrations, API keys, admin, billing schema), database-per-tenant
with per-region residency, a Hostinger runbook, and Nandan as tenant #1 at `/nandan` (not `/nandangse`).
FlashGro does **not** do 60% of our plumbing; it overlaps with perhaps a quarter of it (lists, campaigns,
WhatsApp, tags) and has none of the strategy layer. "Supabase Realtime" in the doc does not apply: the
stack is Prisma on PostgreSQL.

## Mapping the "Take" list onto the codebase

| Teardown item | In `cmomygyaanai` today | Gap to close |
| --- | --- | --- |
| Contact 360 with 12 data groups, enrichment %, health bars | `Contact` has score/band, industries, account, opt-ins | Add the group fields (firmographic, intent, consent/DPDP, trigger events, install base) and a 360 page |
| ICP builder with weights totalling 100 + fit thresholds | 9-question ICP → sentence + personas | Add weighted criteria and a fit score per contact/account |
| Signal Intelligence (reverse-IP × ICP × intent) | None | Needs a first-party tracking script + a reverse-IP provider; schedule after tenant #1 is live |
| Automation engine | `Trigger`, `Sequence`, `SequenceStep`, `Enrollment`, `Touch` models exist; UI partial | Adopt their trigger/step/enrolment vocabulary, swap SaaS triggers for manufacturer ones |
| Campaign send to Company/Account + open-pixel-off toggle | Email campaigns by list/all | Add account-level audience and the pixel toggle |
| WhatsApp settings health-check | WhatsApp provider config | Add the 12-line OK/Fix panel |
| Apollo CSV import that auto-creates companies | CSV import of contacts | Add Apollo column mapping + account auto-create |
| Pre-built B2B tag taxonomy | None | Add, written for manufacturing |
| Page template: KPI cards → filters → table → empty state | Already the tenant page pattern | Keep |

## Answers to "Questions for Dr Raghu" (from the repo's standing decisions)

1. **Build, wrap or white-label?** Build: it is built. FlashGro can stay Vishnu's day-to-day tool for Nandan
   only until `cmo.mygyaan.ai/nandan` is live on Hostinger; running two systems past that creates the
   "CRM Contacts = 0" drift the teardown warns about.
2. **Who owns the contact record?** CMO owns it up to MQL; Genie owns the opportunity after handoff. The
   contact id travels with the handoff (`/api/v1/contacts`, `MqlHandoff`). Write this down as the sync contract.
3. **The one metric:** qualified RFQs/meetings handed to Genie per month, not opens and clicks. Make it the
   first KPI on the tenant dashboard.
4. **Is the 1,188-contact list Nandan's ICP?** The sample (US IT consultancies) says no. Do not import it into
   CMO; build the Nandan ICP from the interview and Rule of One first.
5. **Five manufacturer triggers for v1:** RFQ received, expo met, quote sent, quote viewed, AMC due.
6. **Vishnu on FlashGro meanwhile?** Yes, with the three live fixes below, and a log of what annoys him.

## Live issues on FlashGro that matter regardless

- DKIM for `nandan.co.in` is failing: do not send from FlashGro until it passes, or the domain gets burnt.
- Tracking script shows 0 sessions: the snippet is not on nandan.co.in.
- The contact list looks like the wrong audience (see Q4).
