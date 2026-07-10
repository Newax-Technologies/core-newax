# NEWAX Testing Standard

## Purpose

Define the minimum testing expectations for NEWAX Core, reusable modules, LMS modules, client systems, and future business infrastructure projects.

This standard is for internal NEWAX engineering use. It aligns with ADR 0002: Use Permission-Based Access Control, ADR 0003: Design for Multi-Tenancy, ADR 0005: Use Event-Driven Module Communication, ADR 0007: Define LMS Centralized Database and Data Ownership Rules, ADR 0008: Use Central Identity and Organization Registry, ADR 0010: Define Authentication and User Identity Strategy, the NEWAX Security Baseline Standard, the NEWAX API Design Standard, and the NEWAX Environment Standard.

This document is a standard only. It does not create actual test files, production code, database migrations, test runners, or implementation logic.

## 1. What The Testing Standard Is

The Testing Standard defines the minimum expectations for proving that NEWAX modules, APIs, workflows, permissions, tenant boundaries, integrations, and client-facing systems behave correctly before release.

It applies to NEWAX Core, reusable modules, LMS modules, client systems, and future business infrastructure domains such as CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other NEWAX-powered systems.

The standard is not a replacement for engineering judgment. It defines the baseline below which reusable NEWAX work should not fall.

## 2. Why NEWAX Needs Testing Standards

NEWAX Core is intended to become reusable business infrastructure. A broken reusable module can affect multiple clients, packages, workflows, and future domains.

NEWAX needs testing standards to:

- Protect client trust.
- Prevent fixed bugs from returning silently.
- Prove permission-sensitive workflows are safe.
- Prove tenant boundaries are enforced.
- Reduce production defects.
- Support controlled updates and versioning.
- Improve module approval confidence.
- Make support and regression investigation easier.
- Keep reusable modules maintainable over time.

Testing should protect reliability, not exist only for decoration.

## 3. Testing Principles

Testing should follow these principles:

- Every reusable module must be testable.
- Business-critical workflows must have tests.
- Permission-sensitive workflows must be tested.
- Tenant boundaries must be tested.
- Bugs fixed once should not return silently.
- Tests should protect reliability, not exist only for decoration.
- Tests should focus on behavior, not only implementation details.
- Tests should be practical enough for the team to maintain.
- Higher-risk modules require stronger testing.
- Security-sensitive and client-facing workflows require extra care.

Testing effort should scale with module risk, business importance, and reuse impact.

## 4. Unit Testing

Unit tests should verify small pieces of business logic in isolation.

Examples:

- Payment status calculation.
- Test score calculation.
- Permission helper logic.
- Validation rules.
- Date or schedule logic.
- Status transition logic.
- Configuration fallback logic.

Rules:

- Unit tests should be fast.
- Unit tests should be deterministic.
- Unit tests should not require production data.
- Unit tests should not depend on external services unless explicitly mocked or isolated.
- Business rules that are easy to break should have unit tests.

Unit tests help catch mistakes close to the logic that caused them.

## 5. Integration Testing

Integration tests should verify that multiple parts work together.

Examples:

- User creates a student profile.
- Teacher creates a test.
- Student submits a test.
- Owner approves a payment.
- Report exports filtered data.
- Permission assignment affects API access.
- Module event triggers an approved listener.

Rules:

- Integration tests should cover important module interactions.
- Integration tests should respect module boundaries.
- Integration tests should not rely on production data.
- Integration tests should verify database relationships and service-layer behavior where applicable.
- Integration tests should include important failure paths, not only happy paths.

Integration tests prove that pieces work together as a real system.

## 6. API Testing

API tests should verify that endpoints follow the NEWAX API Design Standard.

API tests should verify:

- Correct request format.
- Correct response format.
- Validation errors.
- Authentication requirement.
- Permission requirement.
- Tenant boundary enforcement.
- Pagination behavior where applicable.
- Filtering, sorting, and search behavior where applicable.
- Safe error responses.

Rules:

- Protected endpoints must have authentication tests.
- Sensitive endpoints must have permission tests.
- Tenant-scoped endpoints must have tenant boundary tests.
- Error responses must not expose internal details.
- APIs must not rely only on frontend behavior for security.

API tests help keep backend contracts stable and safe.

## 7. Permission Testing

Every sensitive action must have permission tests.

Examples:

- `payments.approve`.
- `reports.export`.
- `students.delete`.
- `results.update`.
- `permissions.change`.
- `roles.assign`.
- `admin.accessed_sensitive_data`.

Rules:

- Test that authorized users can perform approved actions.
- Test that users without permission are blocked.
- Test that role labels alone do not grant access.
- Test that permission checks happen server-side.
- Test that permission failures do not leak sensitive data.
- Test that permission changes are auditable where applicable.

Permission tests are required because frontend hiding is not security.

## 8. Tenant Isolation Testing

Tenant-scoped features must prove one organization cannot access another organization's data.

Examples:

- ABC Institute cannot view XYZ Institute students.
- ABC Institute cannot export XYZ Institute reports.
- Teacher from one organization cannot modify another organization's courses.
- Payment approver from one organization cannot approve payments from another organization.
- Dashboard queries do not include another organization's records.

Rules:

- Tenant-scoped APIs must be tested with at least two organizations where practical.
- Queries must prove `organization_id` or approved tenant scope is enforced.
- Reports, exports, dashboards, and search must respect organization boundaries.
- Cross-tenant access must be explicit, permission-controlled, and auditable.
- Client-provided `organization_id` must not be blindly trusted.

Tenant isolation testing protects client trust and future multi-tenancy.

## 9. Authentication Testing

Authentication testing verifies access to protected systems.

Test:

- Login success.
- Login failure.
- Suspended user blocked.
- Disabled user blocked.
- Archived user blocked where applicable.
- Password reset flow.
- Logout and session behavior where applicable.
- Protected APIs reject unauthenticated access.
- Sessions expire where applicable.

Rules:

- Authentication must connect to the central user identity model.
- Inactive users must not access protected systems.
- Password reset events should be logged where applicable.
- Authentication errors must not expose sensitive account details.

Authentication tests protect the first gate into the system.

## 10. Database Testing

Database testing verifies data integrity, relationships, ownership, and lifecycle behavior.

Test:

- Required fields.
- Relationships.
- `organization_id` where required.
- Duplicate prevention.
- Status lifecycle.
- Data ownership boundaries.
- Soft delete behavior where applicable.
- Audit fields where applicable.
- Migration behavior where migrations exist.

Rules:

- Database tests must not use production data.
- Tenant-scoped records should prove organization ownership.
- Person and user references must follow Central Registry rules.
- Module-owned data should not be casually modified by unrelated modules.
- Sensitive records require stronger review.

Database tests protect the shape and ownership of business data.

## 11. Event Testing

Event tests verify event-driven module communication.

Test:

- Event is published after an important action.
- Listener reacts correctly.
- Failed listener does not corrupt core workflow where applicable.
- Audit events are created where required.
- Event payload does not expose unnecessary sensitive data.
- Client extensions can react through approved event contracts where applicable.

Rules:

- Event names should align with the `module.action` convention.
- Event publishers must document important events.
- Event listeners must not modify unrelated module internals without approved interfaces.
- Security-sensitive events should be auditable where appropriate.

Event testing protects modular communication without tight coupling.

## 12. File Upload Testing

File upload testing verifies upload safety, access control, and tenant boundaries.

Test:

- Allowed file types.
- Rejected file types.
- File size limits.
- Required metadata.
- Permission-controlled file access.
- Tenant-scoped file access.
- Upload activity logging where appropriate.
- Sensitive files are not publicly accessible by default.

Rules:

- Uploaded files must be validated.
- File access must be permission-controlled.
- Upload APIs must not trust file extensions alone.
- Uploaded files should be associated with `organization_id` where appropriate.

File upload testing protects systems from unsafe files and accidental data exposure.

## 13. Report And Export Testing

Report and export testing verifies that data output respects permissions and tenant scope.

Test:

- Reports require appropriate permissions.
- Exports require appropriate permissions.
- Reports respect organization boundaries.
- Exports respect organization boundaries.
- Sensitive exports are logged where appropriate.
- Exported files are not publicly accessible by default.
- Filtering, sorting, and search work correctly in reports.
- Reports do not include unnecessary sensitive fields.

Rules:

- Reports must not leak cross-tenant data.
- Export access should not be granted casually.
- Super admin reporting access must be explicit, permission-controlled, and auditable.

Report and export tests are critical because exports can expose large amounts of data.

## 14. Payment Workflow Testing

Payment workflows are business-sensitive and must be tested carefully.

Test:

- Payment submission.
- Payment validation.
- Payment approval.
- Payment rejection.
- Permission checks such as `payments.view`, `payments.submit`, `payments.approve`, and `payments.reject`.
- Tenant boundary enforcement.
- Payment audit events.
- Payment reports and exports.
- Client-specific receipt extensions where applicable.

Rules:

- Payment records must be permission-controlled.
- Payment screenshots or evidence must be protected.
- Payment state changes must be auditable where appropriate.
- Payment modules must not directly modify unrelated student, course, or result records without approved interfaces.

Payment workflow tests protect financial trust and operational reliability.

## 15. LMS Workflow Testing

Important LMS workflows must be tested before client delivery.

Test important LMS workflows such as:

- Student enrollment.
- Lecturer uploads lecture.
- Student attempts test.
- Result is calculated.
- Payment is submitted.
- Owner approves payment.
- Report is generated.
- Teacher manages course or lecture content.
- User views role-appropriate dashboard data.

Rules:

- LMS workflow tests must respect Central Registry identity rules.
- LMS workflow tests must enforce organization boundaries.
- LMS workflow tests must include permission-sensitive actions.
- LMS workflow tests should cover realistic client operations, not only isolated screens.

LMS workflows are the first business domain proving ground for NEWAX Core.

## 16. Regression Testing

Regression tests prevent fixed bugs from returning silently.

Rules:

- Important fixed bugs should receive regression coverage.
- Permission and tenant boundary bugs must receive regression coverage where practical.
- Production-impacting bugs should be included in future release testing.
- Regression tests should be maintained when module behavior changes.
- Failed regression tests must not be ignored.

Bugs fixed once should not become recurring support costs.

## 17. Security-Focused Testing

Security-focused testing verifies that common abuse and risk paths are blocked.

Test:

- Unauthorized access.
- Missing permissions.
- Cross-tenant access attempts.
- Invalid input.
- Sensitive export access.
- Admin-only actions.
- Authentication failures.
- File upload misuse.
- API error safety.
- Secret leakage in logs or responses.

Rules:

- Security-focused tests should align with the NEWAX Security Baseline Standard.
- Higher-risk modules require deeper security-focused testing.
- Security bugs must not be dismissed as frontend issues.

Security testing protects clients from failures that ordinary happy-path tests miss.

## 18. Manual Acceptance Testing

Manual acceptance testing verifies that important user workflows feel correct before client delivery.

Before client delivery, manually verify:

- Core workflows.
- User roles.
- Dashboards.
- Reports.
- Payment workflow.
- Test workflow.
- Mobile responsiveness.
- Error messages.
- Role-appropriate access.
- Tenant-appropriate data visibility.

Rules:

- Manual testing should use realistic but safe data.
- Manual testing should not replace automated tests for critical logic.
- Manual acceptance notes should be captured for important releases.
- Client acceptance testing may be performed in staging where appropriate.

Manual acceptance testing catches usability and workflow issues that automated tests may miss.

## 19. Staging Testing

Major releases must be tested in staging before production where practical.

Rules:

- Staging should closely match production configuration without using production secrets.
- Major workflows should be tested in staging before production release.
- Database migrations should be tested in staging before production.
- Permissions, reports, exports, and tenant boundaries should be tested in staging for major releases.
- Client acceptance testing may happen in staging where appropriate.
- Staging must not be treated as a playground.

Staging is the rehearsal environment for production stability.

## 20. Production Smoke Testing

Production smoke testing verifies that deployment did not break essential behavior.

After deployment, verify:

- Login works.
- Dashboard loads.
- Key APIs respond.
- Core workflows are not broken.
- Permissions still apply.
- Tenant boundaries still apply for key views.
- Error rates and logs do not show obvious failures.

Rules:

- Production smoke tests must be safe and non-destructive.
- Production smoke tests must not use experimental workflows.
- Smoke testing should be documented for important releases.
- Sensitive production checks must respect permissions and client data rules.

Smoke testing is the final sanity check after deployment, not a substitute for staging validation.

## 21. Test Documentation

Tests must be understandable and maintainable.

Rules:

- Module documentation should explain testing expectations.
- Test cases for sensitive workflows should be easy to identify.
- Permission and tenant boundary tests should be documented where applicable.
- Manual acceptance results should be captured for major client releases.
- Known test gaps should be documented before approval.
- Test documentation should align with module README, changelog, versioning, and release notes.

Good test documentation helps future engineers understand what is protected and why.

## 22. Module Approval Checklist

A reusable module should not be marked `active` unless:

- Required tests exist.
- Permission checks are tested.
- Tenant boundaries are tested where applicable.
- Documentation exists.
- Changelog exists.
- Version exists.
- Major workflows pass.
- Security-sensitive behavior is reviewed.
- API behavior is tested where applicable.
- Events are tested where applicable.
- Database ownership and required fields are tested where applicable.
- Manual acceptance is complete where client delivery is involved.

Approval should be based on reliable evidence, not only confidence in the code.

## 23. What Must Never Happen

The following practices are not allowed:

- Do not mark a module reusable without testing its core workflows.
- Do not skip permission tests for sensitive actions.
- Do not skip tenant isolation tests.
- Do not rely only on frontend hiding buttons.
- Do not test only the happy path.
- Do not deploy major changes without staging/testing where practical.
- Do not ignore failed tests.
- Do not allow fixed bugs to return without regression coverage.
- Do not use production data in lower environments without approval, security controls, and sanitization.
- Do not treat production smoke testing as a replacement for real testing.
- Do not create actual test files, production code, or database migrations from this standard alone.

The Testing Standard protects reliability, tenant safety, permission safety, regression prevention, and long-term maintainability.
