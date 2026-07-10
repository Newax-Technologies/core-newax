# Security Review Checklist Example

## Purpose

This checklist provides a practical review template for evaluating a NEWAX module before release.

This is an example checklist only. It does not create production code, authentication logic, permission logic, database migrations, fake secrets, or deployment automation.

## Review Context

Module name:

Module key:

Module version:

Review date:

Reviewer:

Release target:

Client or package context:

## Authentication

- [ ] Protected module features require authenticated access.
- [ ] Authentication connects to the central user identity model where applicable.
- [ ] Inactive, suspended, disabled, or archived users cannot access protected features.
- [ ] Password reset or account recovery behavior is secure if the module touches authentication flows.
- [ ] Authentication events are logged where appropriate.
- [ ] Future two-factor authentication needs do not conflict with the module design.

## Permissions

- [ ] Business logic checks permissions, not hardcoded role names.
- [ ] Permissions follow the `module.action` naming pattern.
- [ ] Sensitive actions require explicit permissions.
- [ ] The module documents owned and required permissions.
- [ ] Permission changes are auditable where applicable.
- [ ] Client-specific roles can group permissions without modifying reusable core module code.

## Tenant Isolation

- [ ] Tenant-scoped records include `organization_id` or `tenant_id` where appropriate.
- [ ] Queries enforce tenant or organization boundaries.
- [ ] API responses do not leak records from another organization.
- [ ] Reports, exports, and dashboards respect tenant boundaries.
- [ ] Cross-tenant access is explicit, permission-controlled, and auditable.
- [ ] Tests or review notes cover tenant boundary behavior for sensitive workflows.

## Sensitive Data

- [ ] Sensitive data handled by the module is identified.
- [ ] Sensitive data is minimized where practical.
- [ ] Sensitive data access is permission-controlled.
- [ ] Sensitive data is not exposed unnecessarily in APIs, reports, logs, or exports.
- [ ] Production data is not required for local or development testing.
- [ ] Sanitization requirements are documented if production-like data is needed outside production.

## API Security

- [ ] Protected APIs require authentication.
- [ ] Sensitive APIs check permissions.
- [ ] API inputs are validated.
- [ ] API responses return only necessary data.
- [ ] Tenant boundaries are enforced server-side.
- [ ] API errors do not expose secrets, credentials, stack traces, or sensitive internals.
- [ ] Rate limiting or abuse protection is considered for sensitive endpoints.

## File Uploads

- [ ] The module validates uploaded files if it accepts uploads.
- [ ] Allowed file types are restricted where appropriate.
- [ ] File size limits are defined where appropriate.
- [ ] File access is permission-controlled.
- [ ] Sensitive files are not publicly accessible by default.
- [ ] Upload activity is logged where appropriate.
- [ ] File storage respects tenant or organization boundaries.

## Audit Logs

- [ ] Important security-sensitive actions are logged.
- [ ] Authentication, permission, role, payment, report, export, file, and admin actions are logged where applicable.
- [ ] Audit logs include enough context for investigation.
- [ ] Audit logs do not expose passwords, tokens, API keys, or secret values.
- [ ] Super admin sensitive actions are auditable.
- [ ] Log retention expectations are documented where needed.

## Secrets

- [ ] No secrets are committed to Git.
- [ ] No `.env` files with real credentials are committed.
- [ ] API keys, tokens, database credentials, and passwords are not stored in code.
- [ ] Each environment uses separate credentials where applicable.
- [ ] Production credentials are restricted.
- [ ] Secrets are not logged or included in support notes, screenshots, reports, or documentation.
- [ ] Secret rotation is possible if a credential is exposed or retired.

## Backups

- [ ] Production backup expectations are documented where the module owns production data.
- [ ] Backup access is restricted.
- [ ] Sensitive backups are encrypted or access-controlled where required.
- [ ] Restore expectations are documented for production systems where applicable.
- [ ] Backups exist before major production migrations.
- [ ] Backup data is treated as client data.

## Reports And Exports

- [ ] Reports require appropriate permissions.
- [ ] Exports require appropriate permissions.
- [ ] Reports and exports respect organization boundaries.
- [ ] Sensitive exports are logged.
- [ ] Exports do not include unnecessary fields.
- [ ] Exported files are not publicly accessible by default.
- [ ] Super admin reporting access is explicit, permission-controlled, and auditable.

## Production Readiness

- [ ] The module has documented security expectations.
- [ ] The module has documented permissions, events, configuration, and tenant scope where applicable.
- [ ] Required environment configuration is documented without exposing secrets.
- [ ] Production credentials are not used in local, development, or staging environments.
- [ ] Major workflows have been tested before production release.
- [ ] Database migrations are tested before production if the module owns migrations.
- [ ] Rollback planning exists for risky production changes.
- [ ] Production access is restricted and auditable.
- [ ] Error handling does not expose sensitive internals to users.
- [ ] Client-specific customizations do not modify reusable core module internals.

## Review Decision

Decision:

- [ ] Approved for release.
- [ ] Approved with follow-up items.
- [ ] Blocked until issues are resolved.

Follow-up items:

Approver:

Approval date:

## Notes

- This checklist should be used with the NEWAX Security Baseline Standard.
- This checklist does not replace architecture review, code review, testing, or production deployment approval.
- Security-sensitive modules may require deeper review before release.
