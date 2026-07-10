# NEWAX Environment Standard

## Purpose

Define how NEWAX Core and client systems should use local, development, staging, and production environments safely and consistently.

This standard is for internal NEWAX engineering use. It supports controlled updates, auditability, security, production stability, client trust, operational control, and long-term maintainability.

This document is a standard only. It does not create production code, actual environment files, `.env` files, fake secrets, deployment scripts, or infrastructure automation.

## 1. What An Environment Is

An environment is a controlled runtime context where a NEWAX system is developed, tested, reviewed, deployed, or used by real clients.

Each environment has its own purpose, configuration, credentials, database, access rules, deployment expectations, logging expectations, and safety level.

Environment separation helps NEWAX keep experimentation away from client systems, test changes before release, protect client data, and manage production changes responsibly.

## 2. Why NEWAX Needs Environment Standards

NEWAX Core is intended to support reusable modules, client systems, packages, controlled updates, and future multi-tenant deployments. Environment discipline is necessary for that foundation to remain reliable.

NEWAX needs environment standards to:

- Protect real client data.
- Prevent accidental production changes.
- Separate development work from client usage.
- Test releases before production deployment.
- Keep credentials and databases separated.
- Support reliable rollback planning.
- Make support and debugging safer.
- Reduce operational confusion across projects.
- Build client trust through stable production practices.

Without environment standards, NEWAX risks data exposure, broken production systems, unclear deployment ownership, unsafe migrations, and inconsistent support.

## 3. Environment Types

NEWAX uses these standard environment types:

| Environment | Purpose |
| --- | --- |
| `local` | Used by individual developers on their own machines. |
| `development` | Used for active internal development and integration. |
| `staging` | Used for testing before production release and should closely match production. |
| `production` | Used by real clients and real users. |

Each environment must be treated according to its risk level. Production is the highest-risk environment and requires the strongest controls.

## 4. Local Environment

The local environment is used by individual developers on their own machines.

Rules:

- May use local test data.
- Must not contain real client production data unless specifically approved, secured, and sanitized.
- Used for development, experimentation, and isolated debugging.
- Can break without affecting clients.
- Must use local or test credentials only.
- Must not use production credentials.
- Must not be exposed publicly.
- Must not be treated as a client environment.

Local environments are useful because developers need freedom to experiment. That freedom must not create client data or credential risk.

## 5. Development Environment

The development environment is used for active internal development and integration.

Rules:

- Used for active internal testing.
- May contain demo data or test data.
- Should not be used by real clients.
- May change frequently.
- May break during active development.
- Must use development credentials.
- Must use development databases.
- Should be monitored enough to detect integration failures.
- Must not be treated as production.

The development environment helps NEWAX test module interactions, integrations, and ongoing work before staging.

## 6. Staging Environment

The staging environment is used to test releases before production.

Rules:

- Used to test releases before production deployment.
- Should match production configuration as closely as possible.
- Used for client acceptance testing where appropriate.
- Must not be treated as a playground.
- Should test migrations, permissions, updates, and major workflows before production.
- Must use staging credentials.
- Must use staging databases.
- Should use realistic but safe test data.
- Should reflect production-like deployment settings where practical.

Staging is the rehearsal environment for production. Changes that cannot pass staging review should not move to production.

## 7. Production Environment

The production environment is used by real clients and real users.

Rules:

- Used by real users.
- Must be stable.
- Must not be used for experiments.
- Must have access control.
- Must have backups.
- Must have monitoring.
- Must have controlled deployments.
- Must log important security and system actions.
- Must use production credentials only.
- Must use production databases only.
- Must protect real client data.
- Must support rollback planning for risky changes.

Production is where NEWAX earns client trust. Changes to production must be intentional, reviewed, and traceable.

## 8. Environment Naming Rules

Environment names must be clear and consistent.

Use these environment names:

```text
local
development
staging
production
```

Rules:

- Use lowercase environment names.
- Do not invent new names without architecture or operations approval.
- Do not use ambiguous names such as `test`, `live`, `main`, `beta`, or `demo` when one of the standard names applies.
- Client-facing demonstrations should be identified clearly and must not be confused with production.
- Deployment manifests must declare the deployment environment.
- Environment names should be consistent across documentation, manifests, dashboards, logs, and support notes.

Clear naming prevents accidental deployment and support mistakes.

## 9. Configuration Rules

Configuration must be environment-specific and controlled.

Rules:

- Each environment must have its own configuration values.
- Configuration must not be hardcoded into reusable modules.
- Environment-specific configuration should use approved configuration or secret management methods.
- Configuration that affects security, permissions, payments, reporting, exports, or integrations must be reviewed carefully.
- Production configuration changes must be intentional and traceable.
- Staging configuration should match production as closely as possible without exposing production secrets.
- Local and development configuration may be simpler but must not use production credentials.

Configuration exists to adapt behavior safely. It must not bypass permissions, tenant isolation, audit logging, or module ownership.

## 10. Secret Management Rules

Secrets must be protected in every environment.

Rules:

- Do not commit secrets to Git.
- Do not store passwords, API keys, database credentials, or tokens in code.
- Do not create `.env` files in this repository that contain secrets.
- Use environment variables or approved secret management methods.
- Each environment must use separate credentials.
- Production credentials must be restricted.
- Production credentials must not be used in local development.
- Secrets must not be printed in logs.
- Secrets must not be placed in screenshots, tickets, support notes, or documentation.
- Secret rotation should be possible when credentials are exposed, expired, or no longer needed.

Secrets are operational assets. They must be handled with the same seriousness as client data.

## 11. Database Rules Per Environment

Databases must be separated by environment.

Rules:

- Local should use local or test databases.
- Development should use development databases.
- Staging should use staging databases.
- Production must use production databases only.
- Production data must not be copied to lower environments unless approved, secured, and sanitized.
- Database migrations must be tested before production.
- Backups must exist before major production migrations.
- Database credentials must be unique per environment.
- Reports and exports must respect environment and tenant boundaries.
- Destructive database actions in production require explicit review and rollback planning.

Database separation reduces the risk of accidental production data loss or exposure.

## 12. Testing Rules Per Environment

Testing expectations vary by environment.

Local:

- Developers may run unit tests, integration tests, experiments, and local validation.
- Local failures should not affect clients.
- Local tests should not require production data or credentials.

Development:

- Used for active internal testing and integration validation.
- May run automated tests frequently.
- May include unstable work under review.

Staging:

- Used for release validation before production.
- Should test migrations, permissions, updates, reports, exports, and major workflows.
- Should validate client acceptance testing where appropriate.
- Should closely represent production behavior.

Production:

- Must not be used for experiments.
- Smoke checks and monitoring are allowed when controlled.
- Risky tests must be performed before production.
- Production validation must avoid damaging data or disrupting users.

Testing must build confidence without putting client systems at risk.

## 13. Deployment Rules

Deployments must be controlled and traceable.

Rules:

- Code should move through development, staging, and production where practical.
- Major production releases should be tested in staging first.
- Production deployments must be intentional and controlled.
- Emergency fixes must still be documented.
- Rollback planning should exist for risky changes.
- Deployment changes must be traceable to commits, release notes, tickets, or approved change records where practical.
- Major module, package, or database changes must respect controlled updates and versioning.
- Client deployment manifests must be updated when installed modules, packages, extensions, database model, tenant scope, or update policy changes.

Deployment discipline protects reliability and support readiness.

## 14. Access Control Rules

Access must match environment risk.

Rules:

- Developers may access local and development environments as required for work.
- Limited engineering users may access staging.
- Production access must be restricted.
- NEWAX super admin access must be permission-controlled and auditable.
- Client data access must be based on business need.
- Access to security-sensitive modules must be limited to approved users.
- Access changes should be documented for staging and production.
- Shared accounts should be avoided where individual accountability is required.
- Production access should be reviewed periodically.

Access control is part of client trust. Convenience must not override security.

## 15. Backup Rules

Backups must match environment importance.

Rules:

- Local backups are optional unless needed by the developer.
- Development backups may be lightweight and focused on restoring internal testing state.
- Staging backups should support release testing, migration testing, and rollback rehearsal where appropriate.
- Production backups are required.
- Production backups must be protected from unauthorized access.
- Backups must exist before major production migrations.
- Restore processes should be tested for production systems.
- Backup retention should match client, legal, support, and operational needs.
- Backups that contain client data must be protected as client data.

A backup is only useful if it can be restored when needed.

## 16. Logging Rules

Logging must support debugging, auditability, and security without exposing secrets.

Rules:

- Local logs may be verbose for development.
- Development logs may include detailed debugging information but must not expose secrets.
- Staging logs should resemble production logging where practical.
- Production logs must capture important system, security, authentication, permission, reporting, export, payment, and administrative actions where appropriate.
- Logs must not expose passwords, API keys, tokens, or sensitive secrets.
- Logs must not casually expose sensitive client data.
- Production logs should be retained according to operational and security needs.
- Security-sensitive actions should be traceable.

Logging should help NEWAX understand what happened without creating a new data exposure risk.

## 17. Error Handling Rules

Errors must be handled according to environment risk.

Rules:

- Local errors may show detailed stack traces to developers.
- Development errors may show detailed debugging information to approved internal users.
- Staging errors should be close to production behavior while still supporting release debugging.
- Production errors must not expose secrets, credentials, stack traces, internal paths, or sensitive client data to users.
- Production errors should be logged with enough context for support and engineering investigation.
- Client-facing production errors should be clear, respectful, and stable.
- Repeated production errors should trigger investigation.

Error handling should support debugging without leaking sensitive information.

## 18. Client Data Handling Rules

Client data must be protected across every environment.

Rules:

- Real client data must be protected.
- Sensitive data must not be casually copied into local machines.
- Test data should be used where possible.
- Production data must not be copied to lower environments unless approved, secured, and sanitized.
- Data exports must be permission-controlled.
- Logs must not expose passwords or sensitive tokens.
- Client data access must be based on business need.
- Tenant and organization boundaries must be enforced.
- Reports and exports must respect permissions and tenant scope.
- Sanitized datasets must remove or mask sensitive personal, financial, authentication, and client-specific information.

Client data handling is a core part of NEWAX reliability and client trust.

## 19. Production Safety Rules

Production requires the strongest safety controls.

Rules:

- Never test experimental features directly in production.
- Never run untested migrations on production.
- Never use production credentials in local development.
- Never commit `.env` files containing secrets.
- Never allow public access to internal dashboards.
- Never bypass permission checks for convenience.
- Never deploy without knowing what changed.
- Never treat production as a debugging playground.
- Never expose internal errors, stack traces, or secrets to production users.
- Never perform risky production changes without rollback planning.
- Never copy production data to lower environments without approval, security controls, and sanitization.

Production stability is a business responsibility, not only a technical concern.

## 20. What Must Never Happen

The following practices are not allowed:

- Do not commit secrets to Git.
- Do not create `.env` files containing secrets in this repository.
- Do not store passwords, API keys, database credentials, or tokens in code.
- Do not use production credentials outside production.
- Do not connect local development to production databases.
- Do not copy production data to local, development, or staging without approval, security controls, and sanitization.
- Do not treat staging as a playground.
- Do not use development or staging as real client production systems.
- Do not run untested database migrations in production.
- Do not deploy major changes to production without review.
- Do not bypass permissions, tenant boundaries, or audit logging for convenience.
- Do not expose internal dashboards publicly.
- Do not log secrets or sensitive tokens.
- Do not leave production access broad, shared, or undocumented.
- Do not create production code, actual environment files, fake secrets, or deployment scripts from this standard alone.

Environment discipline protects reliability, client trust, operational control, and long-term maintainability.
