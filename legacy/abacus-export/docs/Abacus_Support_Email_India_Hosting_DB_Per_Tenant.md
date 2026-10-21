To: support@abacus.ai
Subject: Hosting region (India) and per-tenant database provisioning for a multi-tenant SaaS app

Hello Abacus.AI Support Team,

I am building a multi-tenant B2B SaaS application on the Abacus.AI platform
(currently live at cmo.mygyaan.ai). Before I onboard real customers and load
production data, I need to confirm two infrastructure requirements that are
non-negotiable for my business and for regulatory compliance (India DPDP Act).

I would appreciate clear, definitive answers to the questions below.

--------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------
- The app is a "CMO-as-a-Service" portal serving multiple companies (tenants).
- Planned scale: ~10 tenant companies, each with 100,000+ contacts and ~10 users.
- All customers will be India-based. Their data must physically reside in India.
- Each tenant's data must be isolated in its OWN separate database (not just
  logically separated by a tenant ID within one shared database).

--------------------------------------------------------------------------
REQUIREMENT 1 — DATA & APPLICATION HOSTING IN INDIA
--------------------------------------------------------------------------
Q1. Can the application AND its database be hosted in an India region /
    India-based data centre?
Q2. If yes, how do I select or request the India region for this app, and is
    there any additional cost or plan requirement?
Q3. Where are the application and database currently physically hosted for my
    app today?

--------------------------------------------------------------------------
REQUIREMENT 2 — SEPARATE DATABASE PER TENANT
--------------------------------------------------------------------------
I need each tenant (customer company) to have its own physically separate
database, not a shared database with row-level separation.

Q4. Does the managed Abacus.AI platform support provisioning MULTIPLE separate
    databases for a single application (one database per tenant)?
Q5. Can new databases be provisioned ON DEMAND at the time I onboard a new
    tenant (ideally via an API or an automated step), rather than manually?
Q6. Can each per-tenant database be pinned to a chosen region (e.g. India now,
    and potentially EU in future for an overseas customer)?
Q7. Are there limits on the number of databases per app, per-database size
    limits, or connection limits I should plan around at the scale above
    (10+ databases, 100,000+ rows of contacts each)?

--------------------------------------------------------------------------
REQUIREMENT 3 — BACKUP, RECOVERY & COMPLIANCE
--------------------------------------------------------------------------
Q8. What backup, snapshot and point-in-time recovery options exist for each
    database, and where are those backups stored geographically (must also
    remain in India)?
Q9. Is data encrypted at rest and in transit by default? Can you share any
    compliance certifications (e.g. SOC 2, ISO 27001) relevant to Indian
    data-residency obligations?

--------------------------------------------------------------------------
IF THE MANAGED PLATFORM CANNOT MEET THESE
--------------------------------------------------------------------------
Q10. If per-tenant databases and/or India-region hosting are NOT supported on
     the managed platform, what is the recommended path? For example, can I
     self-host the application and databases on an India cloud region while
     still using Abacus.AI for the build/AI layer? Please advise on the
     supported approach.

These points are foundational for my architecture, so a clear confirmation on
each will let me proceed correctly before loading any customer data.

Thank you very much for your help.

Best regards,
Dr Raghu
MyGyaan / cmo.mygyaan.ai
