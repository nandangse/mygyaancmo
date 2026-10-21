---
name: "Architecture"
description: "Tenancy, URL structure, versioning and channel model agreed for the CMO portal."
---

- cmo.mygyaan.ai is the public marketing site that attracts customers; LinkedIn and email outreach pull people in, then they are converted.
- cmo.mygyaan.ai/admin is the admin interface; cmo.mygyaan.ai/nandangse is the per-company tenant instance.
- Tenants are 100% isolated (separate contacts, campaigns, users).
- Versioning: the version number is set up in admin and applied to each customer; updates go to a customer only after agreement.
- Channels are pluggable: a company can add multiple email channels and multiple WhatsApp channels, plus LinkedIn channels, with no dependency on any one provider.
- Each channel has a name and a type, SMTP (SMTP details) or API (access key), added in the company's admin; each campaign chooses which channel to send from.
- Direct LinkedIn APIs may be explored later via the backend.
- mygyaan.ai is a separate site and is not the CMO portal; the CMO lives only at cmo.mygyaan.ai. The CMO must not be deployed on mygyaan.ai.
