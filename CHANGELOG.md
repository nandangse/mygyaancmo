# Changelog

Version scheme: see docs/VERSIONING.md. Newest first.

## v1.0.1.1.0.0 — 2026-10-22 — feat

Database-per-tenant: registry + one DB per company with region, encrypted connection strings, provisioning from /admin and CLI; app moved to cmomygyaanai/; fresh bootstrap replaces demo seed

## v1.0.1.0.1.2 — 2026-10-22 — docs

Deploy guide: Caddy-in-Docker proxy, host PostgreSQL, app on port 3100 (server findings 22-Oct)

## v1.0.1.0.1.1 — 2026-10-22 — docs

Deploy guide: target existing KVM 8 VPS, install folder /opt/cmomygyaanai, shared-server checks

## v1.0.1.0.1.0 — 2026-10-22 — docs

Hostinger deployment guide: VPS setup, staging, cutover of cmo.mygyaan.ai, backups

## v1.0.1.0.0.1 — 2026-10-21 — docs

Archive Abacus export (code, docs, schema) under legacy/abacus-export as reference, with Hostinger hosting notes

## v1.0.1.0.0.0 — 2026-10-07 — feat

Step 1 tenancy spine: agencies, companies, memberships (7 roles), audit log, feature flags, Postgres RLS, reusable company-scope policy pattern, and an 80-assertion RLS isolation suite wired into CI. Supabase project connected (Mumbai).

## v1.0.0.0.0.1 — 2026-10-07 — chore

Backfill commit hash for baseline changelog entry.

## v1.0.0.0.0.0 — 2026-10-07 — chore — 96ec795

Project baseline: Next.js scaffold, scope document, six-part versioning, changelog system and admin changelog page.
