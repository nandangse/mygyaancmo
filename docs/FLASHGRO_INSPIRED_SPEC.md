# FlashGro-inspired upgrades for cmo.mygyaan.ai — spec

Source: the FlashGro33 teardown (25-Nov-2026). This turns its "take / improve" lists into concrete changes
to `cmomygyaanai/`: which page, which tabs, which fields, in what order. UI patterns first, then data,
then functions. Everything here is per tenant and lives in the tenant's own database.

## 0. What the screens look like (from the 11 screenshots in `docs/reference/flashgro/`)

The visual language is plain and consistent; worth matching in spirit, not pixel for pixel:

- **Shell:** white left sidebar with ~6 collapsible groups in small caps (CRM, EMAIL MARKETING, EMAIL VERIFIER,
  AUTOMATIONS, WHATSAPP, MARKETING), "+ Add Modules" below, Reports and Settings pinned at the bottom.
  Top bar: hamburger · one wide **natural-language search box** ("Try: 'contacts from last week' or 'high
  value'") · green **AI** button · bell · avatar + name. Breadcrumbs under the top bar on inner pages
  (Home › Contacts › William Teel › Enrichment Profile). Our shell already has the grouped sidebar and the
  co-branded header; add the breadcrumb row and the search box.
- **Dashboard (01):** page title + "Welcome back, <name>"; right-aligned buttons Customize · Add Widget ·
  Export · **+ Quick Add** (dark). Two rows of four **KPI tiles**: coloured square icon on the left, label,
  big number, small secondary figure ("1111 active", "0 new · 0 conv", "$0"), and a "View all / View
  pipeline / View report" link at the bottom. Below: two cards side by side, "Sales Pipeline — Opportunities
  by stage" with a Funnel/Time-series/Scatter switch, and "Campaigns" with Latest / Top Performing tabs.
  A floating "✨ AI Assistant" chip bottom-right.
- **Contact 360 (02, 03):** avatar initials + name, "Contact · CNT-SORUWALAOE" id, a grey "Contact" stage
  pill, and buttons Send Email · **Re-enrich** (purple) · **AI Tag** (purple) · Edit (dark) · Delete (red).
  Tabs with counts: Enrichment Profile · Activity (0) · Deals (0) · Emails (0) · WhatsApp (0) · Website (0)
  · Live Chat (0) · Notes (0). Left column: **enrichment ring** (0% ENRICH), name + company link, a 2×2
  stat block (LTV est · Lead score · Touchpoints · Tenure), Website activity (visits · pages · events),
  Tags (+ Add Tag), Contact info, **Engagement Health** as five labelled progress bars (Intent score, Data
  complete, Lead score, Health score, Buying affinity). Right: a grid of **data cards**, each with an icon,
  a title, a coloured **badge** (CORE, PROFILE, B2B, INFERRED, TRACKED, TECH STACK, REVENUE, SIGNALS, GEO,
  SOCIAL, TRIGGER), and label/value rows with "—" for empty and an inline "⟳ Enrich" chip beside missing
  fields; an "Apollo Intelligence" strip with "Re-enrich via Apollo". Consent card at the bottom as four
  dot-status items (GDPR consent ✓ · Email opt-in ✓ · Source provenance ✗ · Retention 36 months).
- **Company 360 (04):** same shape as Contact 360. Header buttons Edit · **+ Create Opportunity** (green)
  · Enrich · Export; tabs Enrichment Profile · Contacts (1) · Deals (0) · Activity · Documents. Left:
  enrichment ring, Pipeline/Score/Contacts/Deals stat block, **Account Health** bars (Exec access 15%,
  Engagement 5%, Data signal 8%, Renewal risk 87% in red). Cards: Firmographic, Industry & Segmentation
  (with "Account score 4/100" and "ICP FIT" badge), Headcount & Structure, Financial profile, Contact
  information, **Key Contacts** with avatar chips and "Harvest more from Apollo", Account Activity Timeline
  (dot + event + "12 hours ago"), Geographic presence, Notes & Description with a "Scrape Description" button.
- **Signal Intelligence (05):** title + subtitle, "Manage ICPs" button; a row of seven small counters
  (Tracked · High ICP fit · Very high intent (red) · Recent funding (amber) · Outreach (purple) · Email
  verified · In CRM); a filter card (Signal strength · ICP profile · Website selects, checkboxes High ICP
  fit only · Recent funding · Email-verified IPs · In CRM, Filter button); empty state with a radio icon,
  "No signals match your filters" and a hint linking to "Configure an ICP profile".
- **ICP builder (06):** a long single-column form in cards: Basic information (name with examples,
  description, **B2B / B2C radio** with one-line explanations, Primary ICP + Active checkboxes), then
  Company criteria as a **grid of checkbox chips** (Technology, Healthcare, Finance, Manufacturing, Retail…).
- **Automation builder (07):** three panels. Left: trigger select, "Include uncertain email activity"
  checkbox, target list, **Enrolment mode** / **Re-entry policy** selects in a grey box, then "Add Steps"
  as seven full-width outlined buttons with icons (Send Email, Wait, Condition, Manage Tags, Update Score,
  Webhook, Goal). Middle: a vertical flow — a Trigger node, then numbered step cards (1 Wait ✓, 2 Send Email
  "Click to configure"), each card bordered green when selected. Right: "Configure Step" panel (Wait
  duration: 1 · Days). Top: editable automation name and a dark "Save Changes" button.
- **Email builder (08):** full-screen editor, purple top bar (AI Builder · undo/redo · Save · Preview ·
  **Spam Score** · Close). Left: block tabs (Layout · Content · Media · Components), "Import HTML Template",
  block tiles (Section, Container, 2 Columns), a **Merge Tags** list ("click to copy": First name, Last name,
  Email, Phone). Centre: canvas "Drag blocks here to start". Right: properties panel.
- **Campaign create (09):** two columns. Left cards: Campaign details (name, subject with an **✨ AI**
  button, preview text with a one-line hint), Recipients (Send to: Email lists / Company-Account radio, a
  checklist of lists with subscriber counts, optional Segment select). Right: a dark "Continue to Design →"
  button, Cancel, and a yellow "Pro Tips" card (subject < 50 chars, merge tags, test on devices, one CTA).
- **WhatsApp settings (10):** the health check is an amber card "WhatsApp needs attention before it can
  send" with two columns of **OK/Fix lines**, each a bold green OK or red Fix, a short check name, a dash,
  and the evidence ("0 active account(s)"). Below: "Connected Accounts" (Connect with Facebook blue button,
  Add Account green) and a "Setup Guide" checklist card with a "View Meta documentation" link.
- **Sending Domains (11):** title + subtitle, a note on the domain limit, a table: domain (with "Added 12
  hours ago"), Status pill (Pending, amber), **Verification progress** bar 66% with three dot-legend items
  (MX green · DKIM grey · SPF green), Last verified, Default.

Colour: near-white background, white cards with faint borders, dark-navy primary buttons, green for
connect/create, purple for AI/enrich actions, amber for pending/attention, red for risk. Icons are flat
squares in one colour per KPI. Density is medium: 25-row tables, 4 cards per row on desktop.

## 1. UI patterns to adopt everywhere

**1.1 One page template.** Every list page becomes: title + one-line subtitle → row of 4–5 KPI cards →
filter bar (search, status, owner, date) → table → empty state with ONE call to action. Apply to Lists &
Contacts, Leads, Opportunities, Email Campaigns, WhatsApp, LinkedIn, Workflows. Build it once as
`components/page-shell.tsx` (`<PageShell title subtitle kpis filters>`), then migrate pages to it.

**1.2 "360" record pages with tabs.** Contact and Account (company) get a full page each, not a drawer:

```
/[tenant]/contacts/[id]           /[tenant]/accounts/[id]
┌ header: name · title · company · lead score ring · band (Hot/Warm/Cool/Cold) · owner · [Email] [WhatsApp] [Call] [Re-enrich] [Edit]
├ strip: enrichment % · touchpoints · tenure · last activity · engagement bars
└ tabs: Profile | Activity | Deals | Emails | WhatsApp | Calls | Website | Notes
```
Profile tab = the data-group cards (section 2). Activity = one merged timeline (emails, WhatsApp, calls,
page visits, lead-score events, handoffs). Account page adds: Account health (Exec access · Engagement ·
Data signal · Renewal risk), ICP fit score, key contacts, "Harvest more from Apollo".

**1.3 Health-check panels.** A 12-line OK / Fix list for every integration that has steps: WhatsApp Cloud
API, email sending domain (MX · SPF · DKIM · DMARC · warm-up), tracking script (installed · sessions seen),
Apollo key, Vapi. Component `components/health-check.tsx`, data from `GET /api/tenant/[t]/integrations/[key]/health`.
Shown on `/integrations` per card and on the Onboarding page.

**1.4 Score bands and rings.** Lead score 0–100 shown as a ring + band everywhere a contact appears.
Bands stay ours: Hot ≥75, Warm ≥50, Cool ≥25, Cold.

**1.5 Typeahead pickers.** Any contact/account picker searches `GET …/contacts?q=` (limit 20); never a full
`<select>`.

**1.6 AI that shows its query.** The in-app assistant answers from typed tools (count/list contacts with
date filters, campaigns, KPIs) and prints the filter it ran under the answer.

## 2. Data model: Contact 360 and Account 360 (tenant DB)

Add to `Contact` (all optional, grouped in the UI as cards):

| Card | Fields |
| --- | --- |
| Identity | `buyingRole` (economic · technical · user · procurement), `department`, `seniority`, `linkedinUrl` |
| Firmographic (on Account) | `domain`, `industry`, `employees`, `revenueBand`, `hq`, `companyType` (PSU · private · MNC), `fleetSize`, `airportsServed`, `licences` |
| Install base (on Account) | `currentBrands` (competitor GSE in fleet), `fleetAge` |
| Intent | `buyIntent` (0–100), `churnRisk`, `upsellReadiness`, `dataRichness` (= enrichment %) |
| Trigger events | `TriggerEvent` rows: type (tender published · airport expansion · new contract · new CEO · funding · expo met · RFQ received), date, source, url |
| Transactional | `amcRenewalDate`, `sparesSpend12m`, `ltvEstimate` |
| Behavioural | derived from `Touch`, `WhatsappMessage`, `CallLog`, page visits (section 4) |
| Social | `linkedinEngagements` (count with the tenant's posts) |
| Geographic | `city`, `state`, `country`, `region` |
| Consent | `consentEmail`, `consentWhatsapp`, `consentSource`, `consentAt`, `retentionUntil` — DPDP Act 2023 wording |
| Lifecycle | `lifecycleStage`: contact · subscriber · lead · MQL · SQL · opportunity · customer · evangelist |

New tables: `Tag` + `ContactTag`/`AccountTag` (pre-built manufacturing taxonomy, section 5), `TriggerEvent`,
`PageVisit` (section 4). `enrichmentPercent` is computed from filled fields, not stored.

## 3. ICP: weighted fit scoring

Keep the 9-question ICP and personas. Add a **Scoring** tab on `/icp`:

- Criteria with weights that must total 100: industry · fleet size · region · title · seniority ·
  department · install base · trigger present.
- Thresholds: High ≥ 70, Medium 40–69, Low < 40.
- `icpFit` on Contact/Account recomputed nightly and on edit; shown on 360 pages and as a filter on lists.
- Signal Intelligence (section 4) ranks visitors by `icpFit × intent`.

## 4. Signals: first-party tracking + reverse-IP (phase 2)

- A tracking snippet per tenant (`/api/track/[key]`): page view, click, scroll depth, form submit, `identify`.
- `PageVisit` rows; a **Website** tab on each 360 page; "visited the Ambulift page 3 times" as a trigger.
- Reverse-IP company match through a provider (Clearbit Reveal / Apollo / IPinfo) → `/[tenant]/signals`
  page: company · pages · visits · ICP fit · intent · in-CRM? · [Add to list] [Enrich].
- Attribution (first / last / linear touch) on the Reports page.

## 5. Tags and segments

- Pre-built taxonomy, one click to import, rewritten for manufacturing: buyer role, fleet type (ambulift ·
  GPU · tractor · loader), industry (airport · airline · MRO · defence · PSU · ground handler), region, source
  (expo · RFQ · website · referral · list), stage.
- "AI tag" on a record and in bulk: tags proposed from KB + brain, human confirms.
- Segments = saved filters over contacts/accounts (`Segment` model exists; add `filter` JSON + count).

## 6. Automation engine (replace the partial Sequences UI)

Vocabulary lifted from FlashGro, triggers rewritten for manufacturers.

- **Triggers (v1, five first):** RFQ received · expo met · quote sent · quote viewed · AMC due. Then: form
  submitted · contact created · list subscribed · tag added · page visited · pricing/product page visited ·
  email opened/clicked · WhatsApp reply · lead-score threshold · deal stage changed · contact inactive ·
  tender published · scheduled date field.
- **Steps (7):** Send email · Send WhatsApp · Wait · Condition · Manage tags · Update score · Webhook · Goal.
- **Enrolment:** forward-only · retroactive · continuous. **Re-entry:** never · always · once per N days.
- "Include uncertain email activity" toggle (Apple Mail privacy opens).
- UI: three panels — settings · vertical flow · step config. Page `/[tenant]/automations`, replaces
  Sequences in the nav; `Sequence/SequenceStep/Enrollment/Touch` tables are reused, `Trigger.type` gains
  the vocabulary above.

## 7. Email: campaigns and deliverability

- Campaign audience: all · list · segment · **account(s)**; sender identity; **open-pixel off** toggle (B2B
  inboxes behind Proofpoint/Mimecast).
- **Sending domain** panel per tenant: MX · SPF · DKIM · DMARC checks with a progress %, warm-up plan,
  dedicated subdomain `mail.<client>`; refuse to send while DKIM fails.
- Real verification before a send: MX + SMTP handshake + catch-all detection (not DNS-only).
- Deliverability dashboard: bounce trend, complaint rate, domain reputation.

## 8. WhatsApp

- Settings health check (12 lines: app id · secret · webhook · Graph version · account · token · phone id ·
  Cloud API registration …), Meta embedded signup, template sync from Meta (Marketing · Utility · Auth),
  inbox views (All · Open · Assigned to me · Unassigned), keyword automations, quick replies, website widget.

## 9. Imports

- Apollo CSV import that auto-creates accounts; standard CSV; up to 100k rows as a background job with
  progress; duplicate detection on email + phone.

## 10. Dashboards and reports

- Tenant home: 8 KPI tiles — **qualified RFQs/meetings handed to Genie this month** first — then pipeline
  funnel, hot leads (≥75), recent activity, campaigns, this week's automation runs.
- Weekly **CMO report** per tenant, written automatically for the 2-hour review: what went out, what came
  back, hot leads, what to do next week.

## 11. Navigation after these changes

```
Strategy   Onboarding · Marketing Plan · Rule of One · Audience · Workflows · KB · Brain · Industries · Products · Competition · ICP (+Scoring) · Interview · Strategy
Database   Contacts · Accounts · Lists · Segments · Tags · Templates · Import
Signals    Signals (visitors) · Trigger events · Leads & Scoring · Inbox & MQLs · Opportunities
Automate   Automations · Email Studio · Email Campaigns · WhatsApp · Voice · LinkedIn · Social Calendar
Measure    Dashboard · KPIs · Website & SEO Audit · Reports · Weekly CMO report
Setup      Channels · Integrations (health checks) · Sending domain · API Access · Settings
```

## 12. Order of work

| Phase | Scope | Why first |
| --- | --- | --- |
| 1 | Page template; Contact/Account 360 pages + data groups; tags taxonomy; typeahead pickers; sending-domain + WhatsApp health checks | Vishnu uses these daily from week one |
| 2 | ICP scoring tab; automations engine with the five manufacturer triggers; campaign-to-account + pixel toggle; Apollo import | Turns the data into outreach |
| 3 | Tracking snippet, Signals page, attribution; weekly CMO report; AI assistant with typed tools | Needs traffic and history to be useful |
| Skip | Browser push, live chat, ticketing, landing-page builder | Not what a manufacturer pays for |

## Not in scope from FlashGro

Quotations, pipeline kanban with probabilities, sales leaderboard, call outcomes — these go to Genie CRM.
The contract: CMO owns the contact/account record up to MQL; Genie owns the opportunity; the record id is
shared through `/api/v1` and `MqlHandoff`.
