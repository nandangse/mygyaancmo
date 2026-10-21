---
name: "Access, Accounts and Security"
description: "Admin accounts, set-password links, user roles and security fixes.\nIncludes Nandan admin onboarding status."
---

- Admin accounts: a one-time /set-password page (PasswordSetToken model) lets new users set their own password via a single-use link (72-hour expiry); no general forgot-password flow or auto-email yet. The assistant cannot send email, so Dr Raghu forwards links. The same link flow is used to reset the platform admin password (reset link issued 17-Oct-2026).
- Tenant Settings > Users & Roles: admins (platform_admin, agency_manager, client_admin) can add users, reset a user's email, reset password (link to copy/forward) and change role; built and verified in preview 17-Oct-2026, NOT yet deployed (updates only after customer agreement).
- Nandan admin Vishnu Bhat (client_admin) created; his login failed because of an email spelling mismatch; account corrected to the spelling he types (vishubhat12) and a fresh set-password link issued 17-Oct-2026 for Dr Raghu to forward; awaiting him to set password. Confirm his real Gmail spelling.
- Security fixes deployed live on both hostnames (11-Oct-2026): tenant-membership authorization; write-role gating; public form input hardening; seed admin passwords env-supplied. Audit found no cross-tenant data leak. Previously exposed seed credentials must be rotated; Dr Raghu to confirm.
