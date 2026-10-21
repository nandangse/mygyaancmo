# CMO Portal — Handover Document

**Project:** cmo.mygyaan.ai — CMO-as-a-Service multi-tenant platform for B2B manufacturers  
**Owner:** Dr Raghu  
**Date:** 10-Oct-2026  
**Project dir:** `/home/ubuntu/mygyaan_cmo` (use this as `project_path` for all tools, NOT `nextjs_space`)  
**App dir:** `/home/ubuntu/mygyaan_cmo/nextjs_space`  

---

## 1. Deployments & URLs

| Hostname | Status |
|---|---|
| `cmo.mygyaan.ai` (custom domain) | Deployed — running an OLDER build (Slice 1 only) |
| `mygyaan-cmo-0x8e0k.abacusai.app` | Deployed — same older build |
| Preview | Latest checkpoint (all features below) — preview only |

**⚠️ The latest checkpoint has NOT been deployed to production yet.** Dr Raghu must approve before deploying. When deploying, call `deploy_nextjs_project` ONCE with `hostnames: ["cmo.mygyaan.ai", "mygyaan-cmo-0x8e0k.abacusai.app"]`.

---

## 2. What's Built (feature status)

### Deployed (Slice 1 — live on both hostnames)
- Marketing site (public homepage)
- Admin console (`/admin`) with companies list, feature flags, integrations view
- Tenant shells with versioning

### Built & verified in preview — NOT deployed
All of the following are built, build-tested, and verified in the preview. They await Dr Raghu's go-ahead to deploy.

| Feature | Key files | Notes |
|---|---|---|
| **Collapsible grouped sidebar** | `app/[tenant]/_components/tenant-shell.tsx` | Groups: Onboarding, Strategy, Database, Leads, KPIs Dashboard, Reports, Channels (→Email/WhatsApp/Social), Integrations (major section), Company Settings, Credits |
| **Onboarding page** | `lib/onboarding.ts`, `app/[tenant]/onboarding/` | 6 sections, 20 tasks, per-step owner (Mygyaan AI / Client / Admin), per-section %, overall %, sidebar badge |
| **Brand logo** | `public/brand/mygyaan-mark.png`, `public/brand/mygyaan-logo.png` | Navy #0b1733 header + gold #d4b14a lockup; custom logo via Company Settings → Branding |
| **Frozen header** | `tenant-shell.tsx` | `sticky top-0 z-30` |
| **Companies open in new tab** | `app/admin/companies/companies-client.tsx` | `target="_blank"` on "Open" link |
| **Credits page** | `app/[tenant]/credits/` | Balance, credited, used cards + activity table; NOT flag-gated |
| **Company Brain** | `app/[tenant]/brain/` | For Mygyaan AI only — NEVER shown/shared with users |
| **Industries & Segments** | `app/[tenant]/industries/`, `app/[tenant]/segments/` | Many-to-many relationships |
| **Competition Intel** | `app/[tenant]/competition/` | Per-segment competitors |
| **Leads & Scoring** | `app/[tenant]/leads/` | AI-scored 0–100: hot≥75, warm≥50, cool≥25, cold<25 |
| **Email Studio** | `app/[tenant]/email-studio/` | AI drafts + per-contact personalisation |
| **Email Campaigns** | `app/[tenant]/email-campaigns/` | Create → audience → compose → send/schedule/pause → monitor. Manual metrics until email provider connected |
| **WhatsApp** | `app/[tenant]/whatsapp/` | Provider-agnostic API (number+message+attachment) |
| **Integrations** | `app/[tenant]/integrations/` | Catalogue by category; admin request queue |
| **VoIP/Calling** | `app/[tenant]/calling/` | Plivo default adapter; click-to-call |
| **LinkedIn** | `app/[tenant]/linkedin/` | Catalogue-only, assisted-manual |
| **Website & SEO Audit** | `app/[tenant]/seo-audit/` | 0–100 baseline; weekly auto not yet scheduled (needs Nandan URL) |
| **KPIs/Metrics** | `app/[tenant]/kpis/` | 11 default KPIs for Nandan; tenant can add/soft-hide |

---

## 3. Login Credentials

| Role | Email | Password | Landing |
|---|---|---|---|
| Platform Admin | `admin@mygyaan.ai` | `MyGyaan@2026` | `/admin` |
| Nandan tenant | `nandan@mygyaan.ai` | `Nandan@2026` | `/nandan` |
| Hidden test account | `abacus-12e2929b@example.com` | (seeded by platform) | Keep hidden |

---

## 4. Environment Variables (.env)

All 8 keys are set:
- `DATABASE_URL` — Abacus-managed Postgres (shared dev+prod)
- `AWS_PROFILE`, `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_FOLDER_PREFIX` — cloud storage
- `ABACUSAI_API_KEY` — LLM APIs, notifications, HTML2PDF, FFmpeg
- `NEXTAUTH_SECRET`, `AUTH_SECRET` — auth

---

## 5. Database Overview

- **89 tables**, ~116 rows (early stage, mostly seed data)
- **Tenants:** Nandan (active, slug `nandan`), Fabro (exists but no dedicated login yet)
- **Key seeded data:** 5 contacts, 3 industries, 2 segments, 2 competitors, 6 personas, 2 ICP profiles, 11 KPIs, 15 integrations, 29 feature flags, 2 channels, 2 releases
- **Seed script:** `scripts/seed.ts` (341 lines) — modify, don't create new. Use upsert, never delete commands.
- **Schema:** `prisma/schema.prisma` (~1675 lines)
- **Run seeds:** `cd nextjs_space && yarn prisma db seed`
- **Ad-hoc DB scripts:** `cd nextjs_space && yarn tsx --require dotenv/config -e "..."`

---

## 6. Key Architecture Patterns

### Tenant access
- `lib/tenant-access.ts` → `resolveTenant(tenant)` returns `{error, status}` OR `{session, company, role, isAdmin, userId}`
- Check errors with `if (ctx.error)` (NOT `'error' in ctx`)
- `ADMIN_ROLES = ['platform_admin', 'agency_manager', 'client_admin', 'client_manager']`

### Feature flags
- `lib/feature-flags.ts` → `isFeatureEnabled(companyId, flagKey)`
- 29 flags in DB controlling per-tenant feature visibility

### Company model
- `settings Json?` field stores arbitrary JSON (e.g. `logoUrl`). No dedicated columns for settings.
- Fields: `icpSentence`, `sendingIdentityEmail`, `whatsappNumber`, `websiteUrl`, etc.

### Nav tree
- Defined in `getNavTree(slug)` inside `tenant-shell.tsx`
- Groups auto-expand based on active route via `findActiveGroups`

### Onboarding
- `lib/onboarding.ts` computes completion from real DB counts
- Wired through `layout.tsx` → `TenantShell` `onboardingPercent` prop

---

## 7. Standing Constraints (MUST follow)

1. **Deploy only after Dr Raghu's approval** — updates follow versioning/release flow.
2. **Company Brain is secret** — Mygyaan AI internal only; never show/share/export to users.
3. **Integrations stays a MAJOR top-level section** in the nav.
4. **CRM is separate** — `cmo.nandan.co.in/crm` is a pure CRM, distinct from the CMO portal.
5. **No content creation by humans** — human actions = clicking buttons only.
6. **Host everything in India** — application stack and database.
7. **Only build Nandan as a tenant** until Abacus support responds about per-tenant DB.
8. **No numeric credit estimates** to the user.
9. **Home page redesign is DEFERRED** — when built, use CONTENT and VALUE PROPOSITION from `Uploads/aarvi-youngcaesar-details.pdf`, NOT its visual layout. Keep existing design language.
10. **No external docs/Excel/PPT** in the product workflow.
11. **Do not use Yagini's name** anywhere yet.

---

## 8. Blocking Issues

### BLOCKER: India hosting + per-tenant database
- **Requirement:** Each tenant MUST have its own physically separate database, pinnable to a specific region (India for Indian customers, EU for European).
- **Current state:** Single shared DB with `companyId` row-level isolation.
- **Action needed:** Dr Raghu must send the support email at `/home/ubuntu/output/Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md` to `support@abacus.ai`.
- **Do NOT rebuild the data layer** until the hosting model is confirmed.

---

## 9. Pending User Actions

1. **Send the Abacus support email** — `/home/ubuntu/output/Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md`
2. **Provide Nandan's website URL** — needed for SEO audits + weekly automatic audit job
3. **Approve deploy** — tell the new conversation to deploy when ready
4. **Share Abacus support reply** — once received, unblocks per-tenant DB architecture

---

## 10. Deferred Work

| Item | Notes |
|---|---|
| Home page redesign | Use content/value prop from `Uploads/aarvi-youngcaesar-details.pdf`, NOT its visual layout. Screenshots at `design_assets/assets/aarvi_ref*`. |
| Per-tenant DB architecture | Blocked on Abacus support reply |
| Fabro tenant onboarding | Only after support responds |
| Weekly SEO audit job | Needs Nandan website URL |
| GA / Google Ads / LinkedIn KPI auto-sources | Populate once integrations connected with credentials |
| Cross-tenant KPI propagation | Deferred; schema supports it |
| Social posting (Phase 2) | Facebook/Instagram/LinkedIn Company Pages via API |
| CRM build at cmo.nandan.co.in/crm | Separate from CMO portal; full funnel spec exists |

---

## 11. Key Files & Directories

```
nextjs_space/
├── app/
│   ├── [tenant]/
│   │   ├── _components/tenant-shell.tsx    # Sidebar + header (collapsible nav tree)
│   │   ├── layout.tsx                      # Tenant layout (onboarding %, logo)
│   │   ├── onboarding/                     # Onboarding page
│   │   ├── credits/                        # Credits page
│   │   ├── settings/                       # Company settings (incl. Branding tab)
│   │   ├── brain/                          # Company Brain (AI-only)
│   │   ├── email-studio/                   # Email drafting
│   │   ├── email-campaigns/                # Campaign management
│   │   ├── leads/                          # Leads & scoring
│   │   ├── industries/                     # Industries
│   │   ├── segments/                       # Segments
│   │   ├── competition/                    # Competition intel
│   │   ├── whatsapp/                       # WhatsApp
│   │   ├── calling/                        # VoIP/Calling
│   │   ├── linkedin/                       # LinkedIn catalogue
│   │   ├── seo-audit/                      # Website & SEO audit
│   │   ├── kpis/                           # KPI metrics
│   │   └── integrations/                   # Integrations catalogue
│   ├── admin/                              # Admin console
│   └── api/tenant/[tenant]/                # Tenant API routes
├── lib/
│   ├── onboarding.ts                       # Onboarding computation
│   ├── tenant-access.ts                    # resolveTenant()
│   ├── feature-flags.ts                    # Feature flag checks
│   └── db.ts                               # Prisma client
├── prisma/schema.prisma                    # ~1675 lines
├── scripts/seed.ts                         # 341 lines
├── public/brand/                           # Brand assets
└── .env                                    # 8 env vars
```

---

## 12. Project Memory & Instructions

- **Project Memory** (wiki): 9 pages — Overview, Status, Decisions, Product Scope, Domain Model, CRM Surface, Architecture, Links, Portal Navigation and Branding. All are current and authoritative.
- **`.project_instructions.md`**: Contains Email Campaigns module notes, home page redesign deferral, and sidebar/onboarding/branding details. Read this at the start of the new conversation.

---

## 13. Reference Documents on Disk

| File | Purpose |
|---|---|
| `/home/ubuntu/MYGYAAN_CMO_MASTER_PLAN.md` | Master plan v1.1 |
| `/home/ubuntu/MYGYAAN_CMO_MASTER_PLAN.pdf` | Same, PDF format |
| `/home/ubuntu/MYGYAAN_CMO_MASTER_PLAN.docx` | Same, Word format |
| `/home/ubuntu/output/MYGYAAN_CMO_SCOPE.md` | Build scope document |
| `/home/ubuntu/output/MYGYAAN_CMO_SCOPE.docx` | Same, Word format |
| `/home/ubuntu/output/Abacus_Support_Email_India_Hosting_DB_Per_Tenant.md` | Draft support email (user to send) |
| `/home/ubuntu/Uploads/aarvi-youngcaesar-details.pdf` | Home page content reference (deferred) |
| `/home/ubuntu/Uploads/download.png` | M-flame logo mark (source) |
| `/home/ubuntu/Uploads/download (1).png` | Full horizontal logo (source) |
| `design_assets/assets/aarvi_ref*` | Captured reference site screenshots |

---

*Generated 10-Oct-2026 for conversation handover.*
