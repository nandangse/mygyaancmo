---
name: "Workflows Module"
description: "Workflows (Vault) module: reference product, three build phases, differentiator, build/deploy state and the decision to build in-house rather than use the Vault's MCP servers."
---

- Reference product: marketerprompts.com (The Marketing Vault, also sold as AppSumo lifetime deal); studied by Dr Raghu as research/benchmark for the CMO portal.
- Built as a tenant module (Workflows/Vault) reusing Company Brain, ICP and existing LLM wiring; Nandan tenant only for now.
- Status: all three phases built, tested and deployed live (both hostnames) after Dr Raghu's go-ahead. Dr Raghu will populate Nandan GSE's Company Brain, then run a workflow to see output.
- Structure: page /[tenant]/workflows, 7 API routes, models WorkflowCampaign, WorkflowRun, WorkflowRunVersion, engine in lib/workflows.ts.
- Phase 1: job-based front door ("What do you want to get done?") plus step-by-step wizard engine with 5 starter workflows (offer builder/strengthener, sales-page copy, paid-ad campaign Meta+YouTube, email nurture sequence, webinar/VSL outline); outputs saved to a Library.
- Phase 2: Verified Facts guardrail (AI uses only facts on file, marks unknowns inline as [CONFIRM], not-on-file suggestions, needs-client-proof) and bridge so outputs flow into Email Studio/Templates/Campaigns.
- Phase 3: campaign container with versioning, regenerate and an "Ask the experts" stress-test.
- Differentiator: the Vault only generates assets; the CMO portal also executes across channels.
- Decision: build in-house, do not integrate the Vault's MCP servers (would send tenant data off-platform, breaking India data residency and Company Brain secrecy, and undercut tenant isolation/white-label). Use the Vault only as inspiration for more workflow templates.
- Per-tenant module bundling by pay plan is deferred (feature flags exist; plan tiers not yet defined).
