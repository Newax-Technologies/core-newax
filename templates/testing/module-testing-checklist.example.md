# Module Testing Checklist Example

## Purpose

This checklist provides a practical release review template for testing a NEWAX module before release.

This is an example checklist only. It does not create actual test files, production code, database migrations, test runners, or implementation logic.

## Review Context

Module name:

Module key:

Module version:

Review date:

Reviewer:

Release target:

Client, package, or domain context:

## Unit Tests

- [ ] Core business rules are covered by unit tests.
- [ ] Validation rules are covered by unit tests.
- [ ] Status transition logic is covered where applicable.
- [ ] Date, schedule, score, payment, or calculation logic is covered where applicable.
- [ ] Permission helper logic is covered where applicable.
- [ ] Unit tests are deterministic and do not require production data.
- [ ] Important edge cases are covered.

## API Tests

- [ ] Protected endpoints require authentication.
- [ ] Sensitive endpoints require explicit permissions.
- [ ] Request body validation is tested.
- [ ] Response envelope follows the NEWAX API Design Standard.
- [ ] Error responses use consistent and safe format.
- [ ] Pagination is tested for collection endpoints where applicable.
- [ ] Filtering, sorting, and search are tested where applicable.
- [ ] APIs do not expose unnecessary sensitive data.

## Permission Tests

- [ ] Authorized users can perform allowed actions.
- [ ] Users without required permissions are blocked.
- [ ] Business logic checks permissions, not hardcoded role names.
- [ ] Frontend hiding is not treated as the only access control.
- [ ] Permission failures do not leak sensitive data.
- [ ] Permission changes are logged where applicable.
- [ ] Sensitive permissions are documented.

## Tenant Isolation Tests

- [ ] Tenant-scoped records include `organization_id` or approved tenant ownership where required.
- [ ] Users cannot view another organization's records.
- [ ] Users cannot modify another organization's records.
- [ ] Reports and exports respect organization boundaries.
- [ ] Search, filters, and dashboards respect organization boundaries.
- [ ] Client-provided `organization_id` is verified server-side.
- [ ] Cross-tenant access is explicit, permission-controlled, and auditable where applicable.

## Authentication Checks

- [ ] Login success is verified where the module touches authentication.
- [ ] Login failure is verified where applicable.
- [ ] Suspended users are blocked.
- [ ] Disabled users are blocked.
- [ ] Archived users are blocked where applicable.
- [ ] Password reset behavior is verified where applicable.
- [ ] Logout and session behavior are verified where applicable.
- [ ] Unauthenticated API access is rejected for protected endpoints.

## Database Checks

- [ ] Required fields are validated.
- [ ] Relationships are correct.
- [ ] Duplicate prevention is tested where applicable.
- [ ] Status lifecycle behavior is tested.
- [ ] Soft delete behavior is tested where applicable.
- [ ] Audit fields are populated where applicable.
- [ ] `person_id` and `user_id` are used correctly.
- [ ] Module-owned data is not casually modified by unrelated modules.
- [ ] Database migrations are tested where migrations exist.

## Event Checks

- [ ] Important events are published after the correct action.
- [ ] Event names follow the `module.action` convention.
- [ ] Event payloads do not expose unnecessary sensitive data.
- [ ] Listeners react correctly where applicable.
- [ ] Listener failure behavior is understood and tested where applicable.
- [ ] Client extension event behavior is tested where applicable.
- [ ] Events are documented by the publishing module.

## Audit Log Checks

- [ ] Important security-sensitive actions create audit logs.
- [ ] Permission, role, admin, report, export, payment, result, and file actions are logged where applicable.
- [ ] Audit logs include enough context for investigation.
- [ ] Audit logs do not expose passwords, tokens, API keys, or secrets.
- [ ] Super admin sensitive actions are auditable.
- [ ] Audit log expectations are documented.

## Security Checks

- [ ] Unauthorized access attempts are tested.
- [ ] Missing permission scenarios are tested.
- [ ] Cross-tenant access attempts are tested.
- [ ] Invalid input is tested.
- [ ] Sensitive export access is tested where applicable.
- [ ] Admin-only actions are tested where applicable.
- [ ] File upload misuse is tested where applicable.
- [ ] API errors do not expose stack traces, credentials, or sensitive internals.
- [ ] Secrets are not committed, logged, or included in documentation.

## Manual Acceptance Checks

- [ ] Core workflows are manually verified.
- [ ] Role-specific workflows are manually verified.
- [ ] Dashboards are manually verified where applicable.
- [ ] Reports are manually verified where applicable.
- [ ] Payment workflow is manually verified where applicable.
- [ ] Test workflow is manually verified where applicable.
- [ ] Mobile responsiveness is checked where applicable.
- [ ] User-facing error messages are clear and safe.
- [ ] Manual acceptance notes are captured for major client releases.

## Staging Checks

- [ ] Major workflows are tested in staging before production where practical.
- [ ] Staging configuration is production-like without using production secrets.
- [ ] Database migrations are tested in staging where applicable.
- [ ] Permission-sensitive workflows are tested in staging.
- [ ] Tenant boundaries are tested in staging for major releases.
- [ ] Reports and exports are tested in staging where applicable.
- [ ] Client acceptance testing is completed where required.
- [ ] Known staging issues are documented before production release.

## Production Smoke Checks

- [ ] Login works after deployment.
- [ ] Dashboard loads after deployment.
- [ ] Key APIs respond after deployment.
- [ ] Core workflows are not broken.
- [ ] Permissions still apply.
- [ ] Tenant boundaries still apply for key views.
- [ ] Reports or exports work where part of the release.
- [ ] Logs and monitoring do not show obvious deployment failures.
- [ ] Smoke checks are safe and non-destructive.

## Review Decision

Decision:

- [ ] Approved for release.
- [ ] Approved with follow-up items.
- [ ] Blocked until issues are resolved.

Follow-up items:

Approver:

Approval date:

## Notes

- This checklist should be used with the NEWAX Testing Standard.
- This checklist does not replace engineering judgment, architecture review, code review, security review, or deployment approval.
- Higher-risk modules may require deeper testing before release.
