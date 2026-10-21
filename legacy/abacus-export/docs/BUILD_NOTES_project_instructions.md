## Email Campaigns module (built 09-Oct-26, preview only)
- New nav item "Email Campaigns" (flag `email_campaigns`), placed under Email Studio.
- Pages: app/[tenant]/email-campaigns/page.tsx + email-campaigns-client.tsx. Model: `EmailCampaign` (schema ~L1643). Routes: /api/tenant/[tenant]/email-campaigns (GET list+lists+drafts+contactCount, POST create) and /[id] (PATCH: send|schedule|pause|resume|metrics|edit; DELETE non-sent).
- Flow: create campaign → audience (all contacts or a List) → compose (manual, load from Email Studio draft, or AI draft via email-studio/generate) → send/schedule/pause → monitor (sent/delivered/opened/clicked/replied/bounced, manual entry now; auto once email provider connected). Monitor summary cards at top.
- Mail creation already existed in Email Studio (AI drafts + per-contact personalization). Old "Campaigns & Posts" page (/campaigns) remains a social-post placeholder — distinct from Email Campaigns.

## Home page redesign (DEFERRED by user 09-Oct)
- User: "look and feel we can build later." Reference: https://aarvi-youngcaesar.netlify.app/ + Uploads/aarvi-youngcaesar-details.pdf. User clarified: use the CONTENT and VALUE PROPOSITION from the PDF, NOT the visual schema/layout. Keep existing design language. Screenshots saved at design_assets/assets/aarvi_ref*.

## Sidebar hierarchy + Onboarding + Branding (built 10-Oct-26, preview only)
- Sidebar rebuilt in `app/[tenant]/_components/tenant-shell.tsx` from flat list to COLLAPSIBLE grouped tree. `getNavTree(slug)` defines groups: Onboarding (top, with % badge), STRATEGY, DATABASE, LEADS, KPIS DASHBOARD, Reports, CHANNELS (→ Email, WhatsApp, Social subgroups), Integrations (kept top-level major section), Company Settings, Credits. Groups auto-expand when they contain the active route (`findActiveGroups`). `openGroups` Set state + `toggleGroup`; recursive `renderNode(node, depth)`.
- Brand logo: navy `#0b1733` header panel with `/brand/mygyaan-mark.png` (M-flame) + "mygyaan.ai / CMO PORTAL" gold `#d4b14a` lockup. If `company.settings.logoUrl` is set, that custom image replaces it. Brand assets: `public/brand/mygyaan-mark.png`, `public/brand/mygyaan-logo.png`.
- Frozen header: `sticky top-0 z-30 shadow-sm`; version banner `sticky top-14 z-20`.
- Onboarding: `lib/onboarding.ts` `computeOnboarding(companyId, slug)` + `computeOnboardingPercent()`. 6 sections (strategy/database/leads/channels/kpis/integrations), 20 tasks total, each `{key,label,owner,done,href}`. Owners: 'Mygyaan AI' | 'Client' | 'Admin'. Done-state derived from real DB counts. Page `app/[tenant]/onboarding/page.tsx` + client: overall ring + progress bar + per-section cards with SVG rings, per-step check/owner badges. Overall % also shown as sidebar badge (wired via layout.tsx → TenantShell `onboardingPercent`).
- Credits page: `app/[tenant]/credits/page.tsx` (+ client) — reads CreditLedgerEntry + Balance, shows balance/credited/used cards + activity table. NOT flag-gated.
- Logo editable in Company Settings → Branding tab (settings-client.tsx): URL input + live preview + Save → PATCH `/api/tenant/[tenant]/settings` (writes `company.settings.logoUrl`, canWrite-gated).
- Admin companies list "Open" link now opens tenant in new tab (`target="_blank" rel="noopener noreferrer"`).

## Phase 1-2-3 modules built (10-Oct-26, preview only)

### Phase 1 — COMPLETE:
- **Products** — `app/[tenant]/products/` (page + products-client.tsx), API: products/, products/[id]/, products/ai-draft/. Full CRUD with AI draft from KB.
- **Interview** — `app/[tenant]/interview/` (page + interview-client.tsx), API: interviews/, interviews/[id]/generate, /answer, /complete. AI question generation, answer saving, complete flow.
- **Strategy** — `app/[tenant]/strategy/` (page + strategy-client.tsx), API: strategies/generate, strategies/[id]. AI generation with full context prompt, section editing, review/sign-off flow, company.strategyStatus update.
- **Calendar** — `app/[tenant]/calendar/` (page + calendar-client.tsx), API: campaigns/ (GET+POST), posts/ (GET+POST), posts/[id] (PATCH+DELETE). Month grid calendar view + list view, campaign management, post creation with status flow (idea→drafted→approved→scheduled→published→measured).
- **Reports** — `app/[tenant]/reports/` (page + reports-client.tsx). Dashboard with stat cards (KB docs, contacts, leads, posts, campaigns, opportunities), strategy status, recent posts+opportunities.

### Phase 2 — COMPLETE:
- **Lists** — `app/[tenant]/lists/` (page + lists-client.tsx), API: lists/ (GET+POST), lists/[id] (DELETE), lists/[id]/contacts (POST). Create lists, add contacts to lists, upsert contacts.
- **Templates** — `app/[tenant]/templates/` (page + templates-client.tsx), API: templates/ (GET+POST), templates/[id] (DELETE), templates/ai-generate (POST). Template library with AI generation, variable extraction ({{firstName}}).
- **Sequences** — `app/[tenant]/sequences/` (page + sequences-client.tsx), API: sequences/ (GET+POST), sequences/[id] (PATCH+DELETE), sequences/[id]/steps (POST). Multi-step cadence builder with steps (email/linkedin/whatsapp/call), template linking, enrollment count.
- **Inbox** — `app/[tenant]/inbox/` (page + inbox-client.tsx), API: inbox/ (GET), inbox/[id] (PATCH). Unified inbox with channel/direction/classification filters, classify replies (11 categories), mark MQL.

### Phase 3 — COMPLETE:
- **Billing** — `app/admin/billing/` (page + billing-client.tsx), API: admin/billing/plans (POST), admin/billing/invoices (POST), admin/billing/lock (POST). Plans & Subscriptions tab, Invoices tab (with GST), Lock/Unlock tenant tab with reason.

### Nav tree update:
- Templates split from "Sequences & Templates" into separate nav entry under Database group.
- All modules appear in sidebar navigation.

## SEO Audit Email Feature (built 10-Oct-26, deployed)
- "Send audit report" section at bottom of audit page (only when audit exists + canWrite).
- Comma-separated email input, remembers last recipients + shows "Last emailed on <date>".
- Recipients + timestamp stored in `company.settings.auditEmailRecipients` / `company.settings.lastAuditEmailedAt`.
- API route: `/api/tenant/[tenant]/audit/email` (POST, sends HTML email with score, breakdown, top issues via notification email API).
- Notification type registered: `NOTIF_ID_SEO_AUDIT_REPORT` (env var).

## Header cleanup (10-Oct-26, deployed)
- Removed duplicate `v{platformVersion}` badge from top header bar (already shown in sidebar as "Nandan GSE v1.1").
- ICP text capped to `max-w-md` + `truncate` for cleaner look.

## Tools module + hero copy (built 11-Oct-26, preview only until deploy)
- Removed "See a live tenant" hero button from landing-client.tsx (exposed tenant URL/IP publicly — security).
- Hero subcopy: MQL spelled out as "marketing qualified lead"; added line "The same philosophy that runs multi-million-dollar businesses — now available for you."
- NEW Tools nav group (no flag, always visible) after Database group in tenant-shell.tsx: "Connect Mail & Import" (/[tenant]/tools) + "Find & Merge Duplicates" (/[tenant]/tools/duplicates). Wrench icon.
- Schema: `MailboxConnection` model (companyId,userId,provider gmail|outlook|imap,emailAddress,status,tokens,contactsImported). Pushed to DB.
- API: tools/mailbox (GET/POST connect/DELETE — OAuth pending until GOOGLE_CLIENT_ID/MS_CLIENT_ID set, so needsSetup), tools/mailbox/import (paste CSV/email text → creates a List source 'mailbox_import' + upserts contacts), tools/duplicates (GET ?type=contacts|accounts — deterministic grouping + bounded AI refine), tools/duplicates/merge (POST canWrite — reassigns all FKs in $transaction, fills master, deletes dupes).
- Settings→Profile has "Your mailbox" card linking to /[tenant]/tools.
- REALITY: live Gmail/Outlook contact pull needs provider OAuth app credentials (not yet configured). Manual paste-import works today; wire real OAuth via perform_subtask_api_secret_configuration when user confirms.

## Marketing Plan living-document module (built 11-Oct-26, preview only)
- Tenant module: single live document combining Positioning & Offer, 1-Page Marketing Plan (9 squares), Business Model Canvas (9 blocks).
- Model `MarketingPlan` (companyId @unique, status, sections Json, generatedBy, lastReviewedAt, updatedBy) + Company back-relation.
- API: /api/tenant/[tenant]/marketing-plan (GET auto-creates, PATCH) exports PLAN_KEYS (22 keys) + canWrite; /marketing-plan/generate (POST, callLLM 3-framework prompt using KB+products — note Product has NO `description` field, use `usp`).
- Pages: app/[tenant]/marketing-plan/page.tsx + marketing-plan-client.tsx. Nav node in tenant-shell.tsx (ClipboardList icon) placed after Onboarding.

## Book Summaries + CMS (built 11-Oct-26, preview only)
- Model `BookSummary` (slug @unique, title, author, year Int?, coverUrl, summary, whatsUnique, ideas, resources Json, metaTitle, metaDescription, published, order, @@map("book_summaries")).
- Admin CMS: app/admin/books/ (page + books-client.tsx — list, publish Switch, edit modal, delete). API /api/admin/books (GET/POST, isAdmin, slugify) + /api/admin/books/[id] (PATCH/DELETE). Nav item in admin-shell.tsx (BookOpen icon).
- Public: app/books/page.tsx (list) + app/books/[slug]/page.tsx (detail w/ generateMetadata SEO: image, summary, ideas worth exploring, further resources to YouTube/author site). Each book = own SEO page, feeds newsletter.
- Landing: app/page.tsx now async server component fetching published books (take 6) → book-summaries grid in Resources section of landing-client.tsx.
- Seeded 10 B2B marketing books in scripts/seed.ts (upsert loop, cover CDN URLs): the-1-page-marketing-plan, purple-cow, 100m-offers, obviously-awesome, building-a-storybrand, they-ask-you-answer, the-challenger-sale, crossing-the-chasm, influence, this-is-marketing. Re-seed: `set -a && . ./.env && set +a && yarn tsx --require dotenv/config scripts/seed.ts`.

## Partner / agency page + top banner (built 11-Oct-26, preview only)
- app/partner/page.tsx — fresh public page with agency pitch (navy hero, 4 pain cards, "Fear not" band, 8 benefit cards, CRM-offers Gold/Platinum band, billing 3 cards, CTA "Become a MyGyaan.ai Certified Agency"). Brand navy #0b1733 / gold #d4b14a.
- Slim top banner added to app/_components/landing-client.tsx: "Are you a digital marketing agency? Partner with us →" linking /partner, plus "Partner with us" header nav link.
- CRITICAL lesson: JSX TEXT nodes do NOT decode `\u` escapes (render literally) — always write actual UTF-8 chars in JSX text. JS string literals (metadata/object props) DO decode.

## Partner application form (built 11-Oct-26)
- `/partner` page now has a real "Apply" form (id="apply") instead of linking to /#demo. Hero "Become a partner" + final section scroll to #apply.
- Client form: app/partner/_components/partner-apply-form.tsx. Fields: Agency name, Company name, Mail, Mobile, Website, Number of customers, Years in operation, Number of employees (text inputs); Region active as toggle checkboxes [All India (first), North India, South India, Mumbai, Delhi, Bangalore, Hyderabad, Global, Middle East, Africa, Asia, Europe, US]; big "Tell us more" textarea (prompts: what keeps you up at night / number one problem / what made you write to us). Success state shows "application received".
- API: app/api/partner/apply/route.ts (POST, no auth — public). Validates required fields + email regex, HTML-escapes input, sends ADMIN notification email (no recipient_email → routes to app owner). Notification type registered: NOTIF_ID_AGENCY_PARTNER_APPLICATION (env). Email-only, no DB model.
- Verified end-to-end in preview (form submits, thank-you state shows).

## Partner Leads CRM (admin) — built 11-Oct-26, preview only
- Partner application form now PERSISTS to DB as a hot/open lead (in addition to the existing admin email alert). Model `PartnerApplication` (prisma/schema.prisma ~L1710, @@map "partner_applications"): agencyName, companyName, email, mobile, website?, numCustomers?, yearsInOperation?, numEmployees?, regions String[], message? @db.Text, status default "open" (open|assigned|contacted|qualified|converted|archived), source default "partner_page", assignedToId? + assignedTo User? @relation("PartnerAssignee"), notes? @db.Text. User model got back-relation `partnerLeads PartnerApplication[] @relation("PartnerAssignee")`. Pushed to DB.
- `app/api/partner/apply/route.ts` now does `prisma.partnerApplication.create` (status open) in a try BEFORE the email send; both are resilient.
- Admin CRM section: nav item "Partner Leads" (Handshake icon) in admin-shell.tsx after Inquiries. Page `app/admin/partner-leads/page.tsx` + `partner-leads-client.tsx`: summary cards (Open hot leads / Unassigned / Total), search, table (click row → right-side detail drawer), drawer has full details + Status select + Assign-to select (lists users with platform_admin|agency_manager|agency_rm memberships) + internal notes (saved onBlur) + delete.
- API: `/api/admin/partner-leads` (GET: leads + assignees list, admin-gated) and `/api/admin/partner-leads/[id]` (PATCH status/assignedToId/notes — auto-advances open→assigned when assigned; DELETE). isAdmin check via session memberships.
- Admin dashboard (`app/admin/page.tsx` + admin-dashboard-client.tsx): added "Open Partner Leads" stat card (rose/Flame icon, links to /admin/partner-leads), grid now 4-col. Counts `partnerApplication.count({where:{status:'open'}})`.
- Verified: POST to /api/partner/apply creates an open/unassigned lead with source partner_page + regions saved (end-to-end DB persistence confirmed). Build + tests pass.

## Testimonials page (built 11-Oct-26, preview only)
- Public page `app/testimonials/page.tsx` (force-dynamic, metadata). Brand header (logo + Resources/Testimonials/Partner/Sign in/Book a demo), navy #0b1733 hero ("Trusted by leaders who want to scale", gold #d4b14a accents), testimonials grid (`testimonials` array; single entry spans md:col-span-2 md:max-w-2xl), each card: Quote icon, 5 gold stars, blockquote with real curly quotes, avatar initials, name/role/company. CTA + slate-950 footer.
- First testimonial: Raghunandan Jagdish / Managing Director / Nandan GSE (quote verbatim, "recomend" fixed to "recommend").
- Nav wired: "Testimonials" link added to landing-client.tsx header (after Resources) + footer, partner/page.tsx header, and testimonials page's own header.
- To add more testimonials: append objects to the `testimonials` array in app/testimonials/page.tsx (grid auto-expands to 2 cols once >1).

## 12 more book summaries added (11-Oct-26, preview only)
- Added 12 books to scripts/seed.ts (order 10-21), seeded to DB (22 total now). Covers from CDN (covers/final/*). Slugs: 100m-leads, scaling-up, who-not-how, the-greatest-salesman-in-the-world, 22-immutable-laws-of-marketing, blue-ocean-strategy, crushing-it, the-one-thing, good-to-great, the-copy-book, marketing-management-16e, marketing-6-0. Each has 2-para summary (B2B tie-in woven in), whatsUnique, 5 ideas (newline-sep), resources, meta. Appear on /books and (take 6) landing Resources.

## Rule of One module (built + deployed 11-Oct-26)
- Tenant module: step-by-step wizard (Prep + Result tabs) for positioning validation. NEVER rewrites the user's document — produces a change list (each with a "Why") + verified LinkedIn audience via Apollo.
- Model `RuleOfOne` (@@map "rule_of_ones"): id, companyId, company, name, status, currentStep, document Json?, review Json?, audience Json?, generatedBy, createdBy, updatedBy, completedAt, timestamps, @@index([companyId]). Company has `ruleOfOnes RuleOfOne[]`.
- lib/rule-of-one.ts: gatherContext(companyId), generate(target,name,document,contextText) (targets document|integrity|positioning|linkedin, banned vocab embedded, hidden from user), getApolloKey(companyId) [reads IntegrationConfig key `apollo` → config.apiKey, falls back to APOLLO_API_KEY env], buildApolloAudience(linkedin, companyId), canWriteRoo(ctx).
- API: /api/tenant/[tenant]/rule-of-one (GET/POST), /[id] (GET/PATCH/DELETE), /[id]/generate (POST {target}), /[id]/audience (POST — calls buildApolloAudience w/ company.id).
- Pages: app/[tenant]/rule-of-one/page.tsx (computes apolloReady via getApolloKey) + rule-of-one-client.tsx. Nav node in tenant-shell.tsx (Target icon, after marketing-plan, no flag = always visible).
- Apollo key is read PER-TENANT from their Integrations page config (not a global env). Audience works once tenant configures Apollo at /[tenant]/integrations. Not-ready copy in client points user there.

## Admin company logo upload (built + deployed 11-Oct-26)
- /api/admin/upload (POST {fileName, contentType}, admin-gated platform_admin/agency_manager) → presigned PUT uploadUrl + publicUrl via generatePresignedUploadUrl/getFileUrl (isPublic=true). Images only.
- /api/admin/companies/[id] (PATCH, admin-gated) → saves settings.logoUrl on company + auditLog.
- app/admin/companies/page.tsx maps logoUrl from settings; companies-client.tsx has logo thumbnail in company cell + "Logo" action button + Logo dialog (file upload via presigned PUT OR paste URL + preview + Save/Clear).

## Nandan tenant state (11-Oct-26)
- slug `nandan`, name "Nandan GSE", active. ALL feature flags now enabled (strategy, products, interviews were off — enabled via featureFlag.updateMany). Admin can now add Nandan's logo via /admin/companies → Logo button.

## Integrations are catalogue-driven
- `Integration` table = 15-entry catalogue (incl apollo [enrichment, field apiKey], linkedin_assisted/linkedin_company/linkedin_insights). Tenants configure at /[tenant]/integrations → POST /api/tenant/[tenant]/integrations/config → stored plaintext in IntegrationConfig.config JSON keyed `companyId_integrationKey`. Admins review requests at /admin/integrations. NO admin UI exists yet to ADD new catalogue entries (build an admin create-integration form if user asks).

## Prospect CSV upload + Outbound API for Genie CRM (built + deployed 11-Oct-26)
- THREE asks addressed: (1) onboarding checklist already built/live (no work); (2) prospect CSV upload; (3) outbound API for Genie CRM.
- CSV upload: lists-client.tsx gained "Upload Prospects (CSV)" dialog (FileUp icon) before "New List". Module-level parseCsv() (quote-aware) + guessMapping() (auto-detects name/email/phone/title from headers) + FIELD_OPTS + NONE sentinel '__none'. State csvOpen/csvHeaders/csvData/csvMap/csvFileName/csvListName/importing; onCsvFile() + runCsvImport(). Posts to /api/tenant/[tenant]/contacts/import {contacts:[{name,email,phone,title}], listName?, createList?} — dedupes by email, upserts contacts, creates List (source 'csv_import') + listContact.upsert links. Max 20000 rows. Returns {listId,listName,total,created,existing,linked,skipped}.
- Outbound API (server-to-server, API-key auth): lib/api-auth.ts — API_KEY_PREFIX='gk_live_', generateApiKey() {raw, keyHash(sha256), prefix(first 16 chars)}, hashApiKey, authApiKey(req) reads Authorization: Bearer OR x-api-key, looks up by sha256 hash, checks revoked, fire-and-forget lastUsedAt, returns {company,scopes,keyId} or {error,status}; requireScope(result,'read'|'write').
- Endpoints under /api/v1: GET /me ({company,scopes}); GET /contacts (?limit max200 def50, ?page, ?leadBand, ?q → {data,pagination}); POST /contacts (write scope, upsert by email, source def 'genie_crm'); GET+PATCH /contacts/[id]; GET /opportunities (fields id,stage,value,notes,contact{id,name,email} — Opportunity model has NO title/name/amount/status).
- Schema: ApiKey model (@@map "api_keys"): id, companyId, company, name, prefix, keyHash @unique, scopes String[] @default(["read"]), lastUsedAt?, revoked @default(false), createdBy, timestamps, @@index([companyId]). Company has apiKeys ApiKey[]. Pushed to DB.
- Tenant API Access page: app/[tenant]/api-access/page.tsx + api-access-client.tsx. Key list (metadata only, never secret), create dialog (name + read/write scope), reveal-once secret dialog, Genie CRM docs (base URL = origin + /api/v1, endpoint list, curl example), revoke w/ confirm. API: /api/tenant/[tenant]/api-keys (GET list, POST create → returns secret ONCE; scope 'write'→['read','write'] else ['read']) + /[id] (DELETE = soft revoke). canWrite = isAdmin || client_user || agency_rm.
- Nav: "API Access" node (KeyRound icon) in tenant-shell.tsx after Integrations (no flag = always visible).

## Speed-to-Lead Voice Agent — Phase 1 (built + deployed 11-Oct-26; deadline 17-Oct-26)
- SANDBOX/MOCK mode until external accounts land. All 12 voice settings are TENANT settings (Company.settings.voice JSON, merge pattern) with GENERIC defaults — NOT Nandan-hardcoded (agentName default 'Riya').
- Model `VoiceLead` (@@map "voice_leads"): companyId/company, name/phone/email/companyName/message, source/campaign/keyword/utm*/landingPage, formReceivedAt/firstCallAt/secondsToCall/lastAttemptAt/attempts/nextRetryAt, status/outcome/callProvider/providerCallId/recordingUrl/transcript/summary, extracted Json, score/band/scoreReason, pushedToCrm/crmRef/alertsSent Json/attemptLog Json, 3 indexes. Company has `voiceLeads VoiceLead[]`.
- lib/voice.ts: VoiceSettings type + DEFAULT_VOICE_SETTINGS, getVoiceSettings/saveVoiceSettings, generateWebhookToken, getProviderConfig/getVapiConfig (reads IntegrationConfig), triggerVapiCall (sandbox when no key), scoreLeadDeterministic + scoreLead (callLLM), pushToGenie (sandbox when no baseUrl/apiKey — reads sales_genie integration), sendHotLeadAlerts (reuses WhatsappProvider), computeNextRetry, simulateCall (LLM sandbox transcript).
- Webhooks: /api/webhooks/lead-intake/[tenant] (POST, ?token= or x-webhook-token header; creates lead, fires inline call, stamps secondsToCall); /api/webhooks/vapi (POST end-of-call: finds lead via metadata.voiceLeadId, parse transcript/recording/summary/structuredData/endedReason, unreachable→retry/WhatsApp fallback vs reached→score→store→pushToGenie→hot alerts); /api/webhooks/voice-retry (POST sweep, x-retry-key header auth; processes due nextRetryAt).
- Tenant API: /api/tenant/[tenant]/voice/leads (GET list+stats), /voice/leads/[id] (GET/DELETE), /voice/settings (GET auto-creates webhookToken + returns intakeUrl/vapiWebhookUrl/canWrite; PATCH allowlist + regenerateToken), /voice/test (POST simulator).
- UI: app/[tenant]/voice/page.tsx + voice-client.tsx (stats cards, sandbox banner, 3 tabs: Leads table+detail dialog, Test Call form, SettingsForm w/ all 12 settings + URL rows + PeopleEditor). Nav node `ch-voice`→child `voice` (PhoneCall icon) in tenant-shell.tsx after ch-whatsapp (no flag, always visible).
- Integration catalogue (scripts/seed.ts): ADDED `vapi` (category 'voice'; apiKey/assistantId/phoneNumberId), `sales_genie` (category 'crm'; baseUrl/apiKey); flipped `exotel` to available + SIP fields. Added 'voice' category to integrations-client.tsx CAT map + CAT_ORDER (PhoneCall icon, 'Voice AI' label).
- CRITICAL SCHEDULER CAVEAT: retry ladder +60s/+5min CANNOT use platform scheduler (1-hour min). First call is INLINE on intake; retries via Vapi's own scheduler OR cron POSTing /api/webhooks/voice-retry frequently.
- External blockers (user's team): Indian DID+SIP (Exotel/Plivo), Vapi API key, WhatsApp Business API (Gupshup/Interakt/WATI), Genie API endpoint+key, website form access, KB content, final qualification Qs/roster/scoring weights (Nitu to confirm — current defaults are draft). Guardrails: agent never quotes prices/specs not in KB; AI+recording disclosure in opening line; consented contacts only.

## Mailer Cloud email integration (built + deployed 12-Oct-26)
- Integration catalogue: added `mailercloud` (category 'email', sortOrder 3; fields: apiKey [password], fromEmail [text], fromName [text optional]). Appears on tenant Integrations page alongside SendGrid and Amazon SES.
- lib/email.ts: provider-agnostic email sender. `getActiveEmailConfig(companyId)` checks IntegrationConfig for active email provider (mailercloud → sendgrid → amazon_ses priority). `sendEmail(companyId, payload)` dispatches through active provider. `sendCampaignViaMailerCloud(cfg, campaign)` calls Marketing API v2 campaign/save. `getEmailProviderInfo(companyId)` returns provider name + fromEmail for UI.
- Mailer Cloud API integration: Email API (`https://email-api.mailercloud.com/v1/send`) for transactional/individual sends; Marketing API (`https://cloudapi.mailercloud.com/v1/v2/campaign/save`) for bulk campaigns. Auth: `Authorization: API_KEY` header (no Bearer prefix).
- API routes: `/api/tenant/[tenant]/email/send` (POST — single/batch send), `/api/tenant/[tenant]/email/test` (POST — test email to verify config), `/api/tenant/[tenant]/email/provider` (GET — active provider info).
- Email campaign send action (PATCH /api/tenant/[tenant]/email-campaigns/[id] action=send) now actually delivers: checks provider configured, resolves recipient emails from list or all contacts (opt-in only), sends in batches of 50, reports success/failure count.
- To activate: tenant goes to Integrations → Email → Mailer Cloud → enters API key + from email → sets as active provider. Then Email Campaigns "Send" button will deliver via Mailer Cloud.

## Workflows ("Vault") module — all 3 phases built (17-Oct-26, PREVIEW ONLY, awaiting deploy)
Tenant module inspired by marketerprompts.com / "The Marketing Vault". Job-based front door ("What do you want to get done?") → wizard → AI-drafted marketing asset grounded in company facts → push into execution channels. Nandan + any tenant (no flag, always visible).

### Schema (prisma/schema.prisma, pushed to DB)
- `WorkflowCampaign` (@@map "workflow_campaigns"): id, companyId/company, name, goal(Text?), status(def "active"), createdBy/updatedBy, timestamps, runs WorkflowRun[], @@index([companyId]).
- `WorkflowRun` (@@map "workflow_runs"): id, companyId/company, campaignId?/campaign?, workflowKey, workflowTitle, name, status(def "draft"), currentStep(Int def 0), inputs Json?, output Text?, verifiedFacts Json?, stressTest Text?, version(Int def 0), pushedTo Json?, generatedBy?, createdBy?/updatedBy?, completedAt?, timestamps, versions WorkflowRunVersion[], @@index([companyId]),@@index([campaignId]).
- `WorkflowRunVersion` (@@map "workflow_run_versions"): id, runId, run @relation(onDelete:Cascade), version(Int), output(Text?), inputs Json?, createdBy?, createdAt, @@index([runId]).
- Company got: workflowRuns WorkflowRun[], workflowCampaigns WorkflowCampaign[].

### lib/workflows.ts (engine)
- WORKFLOW_CATALOG: 5 starter WorkflowDefs — keys offer-architect (job "Nail my offer", Gift), sales-page ("Write my sales copy", FileText), ad-campaign ("Get more leads", Megaphone), email-nurture ("Send better emails", Mail), webinar-vsl ("Launch a webinar or VSL", Video). Each has steps[] (fields: text/textarea/select) + outputSpec (markdown structure).
- getWorkflow(key), catalogForClient() (strips outputSpec/prompt internals).
- gatherWorkflowContext(companyId) → pulls Company+Product+Persona+IcpProfile+Competitor+KbDocument+BrainEntry into context text (brain used INTERNALLY only, never shown).
- VERIFIED_FACTS_RULES (Phase 2 guardrail prompt): AI marks unverifiable claims inline [CONFIRM: …], [NEEDS REAL CLIENT PROOF…], (Suggested — not on file).
- runWorkflow(def,inputs,ctx) → callLLMText (new in lib/tenant-access.ts: free-form markdown, gpt-5.4-mini, temp 0.4). stressTestOutput() = 3-expert panel critique. extractVerifiedFacts(output) = regex → {type,text}[].
- canWriteWorkflows(ctx)=isAdmin||client_user||agency_rm||client_manager.
- PUSH_TARGETS (Phase 2 execution bridge): email_draft→Email Studio (EmailDraft), template→Templates (Template), email_campaign→Email Campaigns (EmailCampaign), campaign→Campaigns&Posts (Campaign). pushToExecution() creates the draft record, returns {refId,label}.

### API (app/api/tenant/[tenant]/workflows/)
- route.ts (GET catalog+runs+campaigns+pushTargets+canWrite; POST create run) — exports serializeRun/serializeCampaign.
- [id]/route.ts (GET run+versions; PATCH name/inputs/currentStep/status/campaignId; DELETE).
- [id]/generate/route.ts (POST — snapshots prev output to WorkflowRunVersion, runs LLM, saves output+verifiedFacts, bumps version, status→completed).
- [id]/stress-test/route.ts (POST — saves 3-expert critique). [id]/push/route.ts (POST — execution bridge, appends to pushedTo[]).
- campaigns/route.ts (GET/POST) + campaigns/[id]/route.ts (PATCH/DELETE — DELETE detaches runs, never cascade-deletes outputs).

### Frontend
- app/[tenant]/workflows/page.tsx (server, force-dynamic) + workflows-client.tsx (Start tab = job-grouped cards; Library tab = runs grouped by campaign; RunWorkspace = step wizard + live draft + Verified Facts panel + version history + "Push to execute" dropdown + "Ask the experts" + copy/download) + md.tsx (lightweight inline markdown renderer — NO react-markdown dependency; detect table separator rows via char-loop isSepRow(), NOT a bracketed regex — a `[-:\s|]` regex char-class gets scraped by Tailwind's class scanner and breaks the CSS build).
- Nav: tenant-shell.tsx — added `Workflow` lucide icon to import + `{id:'workflows',label:'Workflows',icon:Workflow,href:/${slug}/workflows}` after rule-of-one (flagless, always visible).
- Reach at /nandan/workflows. Build+tsc+test all pass. NOT deployed yet.

## User management in tenant Settings (built 17-Oct-26, PREVIEW ONLY, awaiting deploy)
- Settings > Users & Roles tab is now interactive for admins (platform_admin / agency_manager / client_admin). `canManageUsers` computed in settings/page.tsx from session memberships, passed to settings-client.tsx.
- "Add User" button → dialog (name, email, role select: client_admin/manager/user/viewer) → POST /api/tenant/[tenant]/users → finds/creates User by email, creates Membership (scopeType 'company', companyId), issues single-use PasswordSetToken (72h), returns set-password link shown in a copy dialog. App does NOT auto-email; admin copies & forwards the link.
- Per-row actions: "Reset email" (dialog → PATCH action=resetEmail, changes User.email with uniqueness check) and "Reset password" (PATCH action=resetPassword → new 72h token link in copy dialog). Route also supports action=changeRole and DELETE (membership only). Link built from x-forwarded-host/proto, falls back to NEXTAUTH_URL → /set-password?token=.
- Reuses existing /set-password flow (app/api/set-password/route.ts). Nandan GSE has all modules/flags open so this is visible without gating.

## KB "Add Document" 500 fix (17-Oct-26, PREVIEW ONLY, awaiting deploy)
- ROOT CAUSE: client knowledge-base-client.tsx posts multipart/form-data (FormData, for file attach) but app/api/tenant/[tenant]/kb/route.ts POST called await req.json() → threw on non-JSON body → unhandled 500 (surfaced as "Network error").
- FIX: POST now wrapped in try/catch, detects content-type; multipart → req.formData() reads title/type/sourceUrl/notes/tags(comma-split)/file, uploads file via new lib/s3.ts export uploadBufferToS3(buffer,fileName,contentType,'kb/'+companyId) → storagePath; JSON fallback kept. Validates title + at least one of sourceUrl/storagePath/notes. notes stored in KbDocument.extractedText (no schema change). Catch logs console.error('kb POST error',e) + 500 friendly msg.
- Client knowledge-base-client.tsx: added Notes/paste-content Textarea (rows=4) between Source URL and Tags; added notes to form state + formData.append; KB_TYPE_LABELS map capitalizes type dropdown (brochure→Brochure, case_study→Case Study…); added DialogDescription (fixes a11y warning); catch toast reworded.
- VERIFIED in browser (preview) as Nandan: both URL-path and notes-only-path save OK ("Document added to knowledge base" toast, rows appear). Test docs deleted after. Build + tsc + test_nextjs_project all pass. Checkpoint saved. NOT deployed (awaiting Dr Raghu go-ahead).
- STILL OPEN from the UX review (not yet fixed): (4) Completeness Score shows 0% even after KB docs added / Brain filled — score logic ignores KB+Brain work (CONFIRMED still 0% after adding 2 docs in test); (5) Integrations sidebar link at bottom edge hard to click (clickable area/scroll cut off); (6) yellow AI button overlaps "Add Document" header button.
- POTENTIAL FOLLOW-UP: audit other upload routes for same FormData vs req.json() bug.

## LinkedIn Module (built + deployed 17-Oct-26)
- Full LinkedIn pipeline at /[tenant]/linkedin with 4 tabs: Compose, Published, Comment Wall, Outreach.
- Schema: added PostComment model (@@map "post_comments") — postId, authorName, authorUrl, authorAvatar, body(Text), linkedinId(unique), sentiment, featured(bool), capturedAt. Post model got `comments PostComment[]` relation.
- lib/linkedin.ts: gatherLinkedInContext (pulls Company+Product+IcpProfile+Persona+BrainEntry — Brain used INTERNALLY only), composeLinkedInPost (AI, returns {post,hashtags}), publishToLinkedIn (sandbox when no linkedin_company integration), generateSandboxMetrics, generateSandboxComments (AI-generated realistic demo comments), draftOutreach (connection/dm, AI-powered), canWriteLinkedIn.
- API routes: /api/tenant/[tenant]/linkedin/posts (GET list, POST create w/ AI compose), /linkedin/posts/[id] (PATCH: publish/fetch_engagement/fetch_comments/update/delete), /linkedin/comment-wall (GET featured, PATCH toggle), /linkedin/outreach (POST draft).
- Nav: LinkedIn node added under Channels > Social in tenant-shell.tsx (Linkedin icon, no feature flag = always visible).
- SANDBOX MODE: all live actions (publish, engagement, comments) run in sandbox until LinkedIn Company Page integration is configured at Integrations. Outreach is always "assisted" — AI drafts, human copies+pastes into LinkedIn.
- No auto-follow or auto-DM — these are against LinkedIn's terms. Outreach tab provides AI-drafted connection notes (max 300 chars) and DMs (max 500 chars) with copy-to-clipboard + step-by-step instructions.
