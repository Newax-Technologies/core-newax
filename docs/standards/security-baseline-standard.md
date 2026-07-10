# NEWAX Security Baseline Standard

## Purpose

Define the minimum security expectations for NEWAX Core, reusable modules, client systems, LMS deployments, and future business infrastructure platforms.

This standard is for internal NEWAX engineering use. It aligns with ADR 0002: Use Permission-Based Access Control, ADR 0003: Design for Multi-Tenancy, ADR 0007: Define LMS Centralized Database and Data Ownership Rules, ADR 0008: Use Central Identity and Organization Registry, ADR 0010: Define Authentication and User Identity Strategy, and the NEWAX Environment Standard.

This document is a security baseline only. It does not create production code, authentication logic, permission logic, database migrations, fake secrets, or deployment automation.

## 1. What The Security Baseline Is

The Security Baseline is the minimum set of security expectations that every NEWAX Core module, client system, LMS deployment, and future business infrastructure platform must respect.

It defines practical expectations for authentication, sessions, permissions, tenant isolation, sensitive data, audit logging, secrets, APIs, file uploads, reports, backups, environments, production access, and security review.

The baseline is not a complete security program. It is the starting line below which NEWAX systems must not fall.

## 2. Why NEWAX Needs A Security Baseline

NEWAX Core is intended to become reusable business infrastructure. That means security cannot be treated as an afterthought or solved differently by every project.

NEWAX needs a security baseline to:

- Protect client trust.
- Protect tenant and organization boundaries.
- Keep reusable modules safe across multiple systems.
- Avoid hardcoded roles and hidden access rules.
- Make sensitive actions auditable.
- Reduce accidental data exposure.
- Support controlled production access.
- Prepare modules for future multi-tenant and multi-domain use.
- Keep security expectations clear for Product, Engineering, Support, and Operations.

Security expectations must scale with NEWAX as modules, packages, clients, and project domains grow.

## 3. Authentication Rules

Authentication verifies who is accessing a protected NEWAX system.

Rules:

- Every user must authenticate before accessing protected systems.
- Authentication must connect to the central user identity model.
- User accounts must connect to real people through the Central Identity and Organization Registry where applicable.
- Inactive, suspended, disabled, or archived users must not access protected systems.
- Authentication must not be designed only around LMS-specific tables.
- Authentication events should be logged where appropriate.
- Future support for two-factor authentication should be considered in the design.

Authentication answers who is trying to log in. Authorization and permissions answer what that person may do.

## 4. Password Rules

Passwords must be handled as sensitive authentication data.

Rules:

- Never store plain text passwords.
- Never expose password hashes.
- Password reset flows must be secure.
- Password reset events must be logged.
- Password rules should be configurable where appropriate.
- Password reset tokens must be time-limited and protected.
- Passwords must not appear in logs, exports, screenshots, support notes, or documentation.
- Default passwords should not be used for production accounts.

Password handling must protect users even when other parts of a system fail.

## 5. Session Rules

Sessions must be controlled and expire.

Rules:

- Sessions must expire.
- Logout should invalidate sessions where appropriate.
- Sensitive systems may require stricter session limits.
- Session behavior should be configurable by environment or client policy where appropriate.
- Inactive, suspended, disabled, or archived users should not continue accessing protected systems through existing sessions.
- Session identifiers must not be exposed in logs or URLs.
- Future single-device login should be supported where required by client policy.

Session controls protect accounts after login and reduce the impact of lost or shared devices.

## 6. Permission Rules

Permissions define actual access rights.

Rules:

- Business logic must check permissions, not hardcoded role names.
- Permissions must follow the `module.action` naming pattern.
- Sensitive actions must require explicit permissions.
- Permission changes must be auditable.
- Every reusable module must document the permissions it owns or requires.
- Tenant-scoped permissions must respect organization boundaries where required.
- Client-specific roles may group permissions without changing reusable core module code.

Bad:

```text
if user.role == "Admin"
```

Good:

```text
user.can("payments.approve")
```

Permissions keep access flexible, auditable, and safe across clients.

## 7. Role Rules

Roles are responsibility groups, not hardcoded access logic.

Rules:

- Roles may group permissions.
- Roles must not be hardcoded into business logic.
- Role assignments must be auditable where security-sensitive.
- Role changes must respect tenant or organization boundaries.
- Client-specific roles may be created without changing reusable module internals.
- Role names should not be used as the source of truth for sensitive access.

A role may explain a user's responsibility. Permissions decide what the user can actually do.

## 8. Super Admin Rules

NEWAX super admin access is powerful and must be controlled.

Rules:

- NEWAX super admin access must be explicit.
- Super admin access must be permission-controlled.
- Super admin sensitive actions must be logged.
- Super admin access must not bypass audit logs.
- Super admin access should be limited to business need.
- Super admin access should not silently bypass tenant boundaries.
- Super admin access should require stronger controls as NEWAX systems mature.

Super admin access must remain visible, intentional, and accountable.

## 9. Tenant Isolation Rules

Tenant isolation protects one client organization from another.

Rules:

- One organization must never access another organization's records.
- Tenant-scoped queries must enforce `organization_id` or `tenant_id` where appropriate.
- Reports, exports, dashboards, and API responses must respect tenant boundaries.
- Cross-tenant access must be explicit, permission-controlled, and auditable.
- Modules must not assume there will only be one organization forever.
- Shared foundation tables must not become permission-free access to all tenant data.
- Client customizations must not weaken tenant isolation.

Tenant safety is one of the most important security responsibilities in NEWAX Core.

## 10. Data Access Rules

Data access must follow business need, permissions, and tenant boundaries.

Rules:

- Users must only access data they are authorized to access.
- Sensitive data must require explicit permission checks.
- Modules must access another module's data only through approved APIs, services, events, or documented interfaces.
- Direct modification of another module's owned data is not allowed without an approved interface.
- Data exports must be permission-controlled.
- Reports must not bypass tenant isolation or permission checks.
- NEWAX administrative data access must be explicit and auditable.

Data access rules protect client systems from hidden coupling and accidental exposure.

## 11. Sensitive Data Rules

Sensitive data requires stronger protection.

Treat the following as sensitive:

- Student personal records.
- Teacher records.
- Payment records.
- Payment screenshots.
- Test results.
- User accounts.
- Contact details.
- Role assignments.
- Permission changes.
- Exported reports.
- Uploaded files.

Rules:

- Sensitive data must not be exposed unnecessarily.
- Sensitive data should be minimized where possible.
- Sensitive data access must be permission-controlled.
- Sensitive data exports should be logged.
- Sensitive data must not be copied to lower environments without approval, security controls, and sanitization.
- Logs must not casually expose sensitive data.

Sensitive data handling must support client trust and future compliance needs.

## 12. Audit Logging Rules

Audit logs record important system, security, tenant, and administrative actions.

Audit logs should record important actions such as:

- `user.login`.
- `user.login_failed`.
- `user.logout`.
- `password.reset_requested`.
- `password.reset_completed`.
- `student.created`.
- `student.updated`.
- `payment.submitted`.
- `payment.approved`.
- `payment.rejected`.
- `test.created`.
- `result.updated`.
- `report.exported`.
- `file.uploaded`.
- `permission.changed`.
- `role.assigned`.
- `admin.accessed_sensitive_data`.

Rules:

- Security-sensitive actions must be auditable.
- Permission changes must be logged.
- Super admin sensitive actions must be logged.
- Report exports and sensitive data exports should be logged.
- Audit logs must not expose passwords, tokens, or secret values.
- Audit logs should include enough context to support investigation without creating unnecessary data exposure.

Auditability protects NEWAX and clients when something important changes or goes wrong.

## 13. Secret Management Rules

Secrets must never be handled casually.

Rules:

- Do not commit secrets to Git.
- Do not commit `.env` files with real credentials.
- Do not store API keys, tokens, or database credentials in code.
- Each environment must use separate credentials.
- Production credentials must be restricted.
- Production credentials must not be used in local development.
- Secrets must not be logged.
- Secrets must not be shared through screenshots, support notes, or documentation.
- Secret rotation should be possible when credentials are exposed, expired, or no longer needed.

Secret management must align with the NEWAX Environment Standard.

## 14. API Security Rules

APIs must enforce authentication, permissions, validation, and tenant boundaries.

Rules:

- Protected APIs must require authentication.
- Sensitive APIs must check permissions.
- API responses must not expose unnecessary data.
- Tenant boundaries must be enforced.
- Validation must be applied to incoming data.
- Rate limiting may be added for sensitive endpoints.
- API errors must not expose secrets, credentials, stack traces, or unnecessary internal details.
- APIs must not allow clients to provide trusted tenant or permission context without verification.
- APIs that modify sensitive records should be auditable where appropriate.

API security protects both user-facing systems and future integrations.

## 15. File Upload Rules

File uploads are a security-sensitive feature and must be controlled.

Rules:

- Uploaded files must be validated.
- File types should be restricted where appropriate.
- File size limits should be defined where appropriate.
- File access must be permission-controlled.
- Sensitive files must not be publicly accessible by default.
- Upload activity should be logged where appropriate.
- Uploaded files should not be trusted solely based on file extension.
- File storage must respect tenant or organization boundaries where applicable.
- Malware scanning or additional validation may be required for higher-risk deployments.

File upload handling must protect client data and system integrity.

## 16. Payment Data Rules

Payment-related data is sensitive and requires stronger controls.

Rules:

- Payment records must be permission-controlled.
- Payment screenshots and payment evidence must be protected.
- Payment approval and rejection actions must be auditable.
- Payment reports and exports must respect tenant boundaries.
- Payment modules must not directly modify unrelated student, course, or result records without approved interfaces.
- Payment data should be minimized where possible.
- Payment-related production access must be based on business need.

Payment data must be treated as business-sensitive even before payment gateway integrations exist.

## 17. Student Result Data Rules

Student result data is sensitive educational data.

Rules:

- Test results and student performance records must be permission-controlled.
- Result creation and updates should be auditable where appropriate.
- Result reports and exports must respect organization boundaries.
- Student result access should be limited to approved users and roles through permissions.
- Result data must not leak across tenants, courses, or organizations.
- Result data should not be copied into lower environments without approval and sanitization.

Student result data affects client trust and must be handled carefully.

## 18. Export And Reporting Rules

Reports and exports can expose large amounts of sensitive data.

Rules:

- Reports must respect permissions.
- Exports must respect organization boundaries.
- Sensitive exports should be logged.
- Export access should not be granted casually.
- Reports must not leak cross-tenant data.
- Exported files must not be publicly accessible by default.
- Reports should only include fields needed for the business purpose.
- Super admin report access must be explicit, permission-controlled, and auditable.

Reporting convenience must not weaken security or tenant isolation.

## 19. Backup Security Rules

Backups must be protected because they may contain sensitive client data.

Rules:

- Production backups must be protected.
- Backup access must be restricted.
- Backups should not be exposed publicly.
- Restore processes should be tested.
- Sensitive backups should be encrypted or access-controlled.
- Backups that contain client data must be treated as client data.
- Backup retention should match business, support, legal, and operational needs.
- Backups must exist before major production migrations.

Backup security must be considered part of production security.

## 20. Environment Security Rules

Environment separation is a security control.

Rules:

- Local, development, staging, and production environments must use separate credentials.
- Production credentials must not be used outside production.
- Production data must not be copied to lower environments without approval, security controls, and sanitization.
- Staging should match production safely without using production secrets.
- Development and staging must not be used as real production systems.
- Internal dashboards must not be publicly accessible.
- Environment configuration must not bypass permissions, tenant isolation, or audit logging.

Environment security must follow the NEWAX Environment Standard.

## 21. Error Handling Rules

Errors must not leak sensitive information.

Rules:

- Production errors must not expose secrets, credentials, stack traces, internal paths, or sensitive client data to users.
- Local and development environments may show more detail to approved developers.
- Staging should behave close to production while supporting release debugging.
- API errors must not reveal whether sensitive records exist unless the user is authorized.
- Errors should be logged with enough context for investigation.
- Repeated production errors should trigger review.

Error handling must support debugging without creating security exposure.

## 22. Production Access Rules

Production access must be restricted and intentional.

Rules:

- Production access must be restricted.
- Production systems must not be used for experiments.
- Production credentials must not be shared casually.
- Production database changes must be controlled.
- Risky production changes must have rollback planning.
- Production access to client data must be based on business need.
- Production access changes should be documented.
- NEWAX super admin production access must be permission-controlled and auditable.
- Major production changes should be tested in staging first.

Production access is a business trust responsibility, not just an engineering convenience.

## 23. Security Review Checklist

Before a reusable module, client deployment, or major release is approved, reviewers should confirm:

- Authentication requirements are clear.
- Password and session handling expectations are satisfied where applicable.
- Permission checks use permissions, not hardcoded role names.
- Sensitive actions require explicit permissions.
- Role assignments and permission changes are auditable where applicable.
- Tenant boundaries are enforced for tenant-scoped records.
- Sensitive data is identified and protected.
- APIs enforce authentication, permissions, validation, and tenant boundaries.
- File uploads are validated and access-controlled where applicable.
- Payment data and student result data receive stronger controls where applicable.
- Reports and exports respect permissions and organization boundaries.
- Audit logging covers important security-sensitive actions.
- Secrets are not committed, logged, or stored in code.
- Backups and restore expectations are documented for production systems.
- Environment-specific credentials and databases are separated.
- Production access is restricted and auditable.
- Error handling does not expose secrets or sensitive internals.
- Client-specific customizations do not weaken reusable core security.

The checklist template lives at `templates/security/security-review-checklist.example.md`.

## 24. What Must Never Happen

The following practices are not allowed:

- Never store plain text passwords.
- Never expose password hashes.
- Never commit secrets to Git.
- Never commit `.env` files with real credentials.
- Never store API keys, tokens, or database credentials in code.
- Never bypass permission checks for convenience.
- Never hardcode role-based access into business logic.
- Never allow one tenant to access another tenant's data.
- Never allow super admin actions without audit logs.
- Never expose sensitive exports publicly.
- Never use production as a testing playground.
- Never copy production data to local machines without approval and sanitization.
- Never use production credentials in local, development, or staging environments.
- Never expose internal dashboards publicly.
- Never log passwords, tokens, API keys, or secret values.
- Never create production authentication logic, permission logic, database migrations, or fake secrets from this standard alone.

The Security Baseline exists to protect trust, tenant safety, access control, auditability, reliability, and long-term maintainability.
