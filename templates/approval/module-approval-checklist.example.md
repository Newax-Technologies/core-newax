# LMS Students Module Approval Checklist Example

## Purpose

This document is a completed example showing how NEWAX may review a module before changing its status from `draft` to `active`.

The module used in this example is `lms-students`.

> **Example only:** This document does not approve the real `lms-students` module. The real module remains subject to implementation, testing, security review, documentation review, and formal approval. Human beings remain tragically unable to approve software by admiring a template.

## 1. Module Summary

| Field | Example value |
| --- | --- |
| Module name | LMS Students |
| Module key | `lms-students` |
| Module layer | `business_domain` |
| Domain | LMS |
| Version reviewed | `1.0.0` |
| Previous status | `draft` |
| Proposed status | `active` |
| Module owner | NEWAX Engineering |
| Product owner | NEWAX Product |
| Tenant scope | `organization_scoped` |
| Documentation path | `packages/lms-students/README.md` |
| Changelog path | `packages/lms-students/CHANGELOG.md` |
| Reviewed release | `lms-students-v1.0.0` |
| Review type | Initial activation review |

## 2. Business Purpose

The `lms-students` module manages LMS-specific student profile information for people associated with an organization.

It provides the business capability to:

- Create an LMS student profile for an existing central person record.
- Associate that student profile with an organization.
- Maintain student lifecycle status.
- Expose approved student information to other LMS modules.
- Publish student lifecycle events.
- Protect student records through permissions and tenant isolation.

The module does not own general identity, login accounts, organization records, courses, enrollments, tests, results, or payments.

## 3. Module Boundaries

### Owned responsibilities

- LMS student profile lifecycle.
- LMS student reference numbers.
- LMS-specific status and profile fields.
- Student profile validation.
- Student-related permissions.
- Student lifecycle events.
- Tenant-safe student APIs and services.

### Responsibilities outside this module

| Responsibility | Owning module |
| --- | --- |
| Human identity | `people` |
| Organization records | `organizations` |
| Person-to-organization membership | `memberships` |
| Login account | `users` |
| Authentication | `authentication` |
| Permission definitions and assignment | `permissions` |
| Course ownership | `lms-courses` |
| Student-course relationships | `lms-enrollments` |
| Tests and attempts | `lms-tests` |
| Test results | `lms-test-results` |
| Payment records | `lms-payments` |
| Audit storage | `audit` |

## 4. Declared Dependencies

| Dependency | Version expectation | Reason |
| --- | --- | --- |
| `people` | `>=1.0.0 <2.0.0` | References the central person identity through `person_id`. |
| `organizations` | `>=1.0.0 <2.0.0` | References the owning organization through `organization_id`. |
| `memberships` | `>=1.0.0 <2.0.0` | Confirms the person belongs to the organization where required. |
| `permissions` | `>=1.0.0 <2.0.0` | Enforces explicit student permissions. |
| `audit` | `>=1.0.0 <2.0.0` | Records security-sensitive student actions through approved events or contracts. |

No circular dependencies were identified in this example.

## 5. Required Permissions

| Permission | Purpose | Sensitivity |
| --- | --- | --- |
| `students.view` | View student profiles within an authorized organization. | Standard |
| `students.create` | Create a student profile for an existing person. | Sensitive |
| `students.update` | Update approved student profile fields. | Sensitive |
| `students.suspend` | Suspend a student profile. | High |
| `students.archive` | Archive a student profile according to retention policy. | High |

Business logic checks explicit permissions. No workflow authorizes access using hardcoded role names such as `Admin`, `Teacher`, or `Owner`.

## 6. Exposed Events

| Event | Published when | Sensitive payload rule |
| --- | --- | --- |
| `student.created` | A student profile is successfully created. | Include identifiers and operational metadata only. |
| `student.updated` | Approved student profile fields are changed. | Do not publish unnecessary personal details. |
| `student.suspended` | Student access or status is suspended. | Include reason category only when appropriate. |
| `student.archived` | A student profile is archived. | Exclude sensitive identity data. |

## 7. Consumed Events

| Event | Expected behavior |
| --- | --- |
| `organization.archived` | Prevent new activity and follow approved archival policy for related student profiles. |
| `person.archived` | Prevent new activity and flag the related student profile for review. |
| `membership.removed` | Recalculate whether the student profile remains operationally valid for the organization. |

Consumers are designed to avoid directly modifying data owned by other modules.

## 8. Configuration Options

| Configuration key | Example default | Purpose |
| --- | --- | --- |
| `student_status_values` | `pending, active, suspended, archived` | Controls supported student lifecycle states. |
| `student_profile_required_fields` | `student_reference` | Defines LMS-specific required fields. |
| `student_reference_format` | `organization_sequence` | Controls organization-level student reference generation. |
| `allow_multiple_student_profiles_per_person` | `false` | Prevents duplicate student profiles in the same organization. |
| `student_archival_policy` | `soft_delete` | Defines archival behavior without destroying required records. |

Configuration cannot disable permission checks, tenant boundaries, audit requirements, or identity ownership rules.

## 9. Database Ownership

### Owned tables

| Table | Purpose |
| --- | --- |
| `lms_student_profiles` | Stores LMS-specific student profile information. |

### Required relationships

| Field | References | Rule |
| --- | --- | --- |
| `person_id` | `core_people.id` | Required. Identity remains owned by the People module. |
| `organization_id` | `core_organizations.id` | Required. Defines tenant ownership. |
| `created_by` | `core_users.id` | Required where the action is performed by an authenticated user. |
| `updated_by` | `core_users.id` | Recorded when profile data changes. |
| `suspended_by` | `core_users.id` | Recorded for suspension actions. |

### Example lifecycle fields

- `status`
- `created_at`
- `updated_at`
- `suspended_at`
- `archived_at`

### Ownership decision

The module stores LMS-specific profile data only. It does not duplicate a person's name, primary email, phone number, password, organization record, course data, payment data, or result data unless a separately approved read model requires a controlled snapshot.

## 10. Tenant Isolation

The module is organization-scoped.

The example review confirms:

- [x] Every student profile contains `organization_id`.
- [x] API queries derive authorized organization scope from the authenticated context.
- [x] A request-provided `organization_id` is validated against the user's permitted organizations.
- [x] Services apply tenant scope independently from frontend filtering.
- [x] Reports and exports remain organization-scoped.
- [x] Files linked to student profiles use tenant-safe file contracts.
- [x] Cross-organization access requires an explicit permission and audit record.
- [x] NEWAX super-admin access is explicit and auditable.
- [x] Automated tests prove that Organization A cannot view or modify Organization B's student profiles.

**Review result:** Pass

## 11. Architecture Review

- [x] The module has one clear business responsibility.
- [x] The module belongs to the Business Domain layer.
- [x] The module does not duplicate People or Memberships responsibilities.
- [x] The module does not create circular dependencies.
- [x] Every dependency is declared.
- [x] The module depends only on approved lower or same-domain modules.
- [x] The module does not make LMS the center of NEWAX Core.
- [x] Public contracts are separated from internal implementation.
- [x] Cross-module interactions use approved services, APIs, contracts, or events.
- [x] Client-specific behavior remains outside the reusable module.

**Review result:** Pass

**Reviewer note:** Student identity remains in the Central Registry. The module owns only LMS-specific profile data and behavior.

## 12. Module Structure Review

- [x] `api/` exists and contains documented API contracts.
- [x] `components/` exists for reusable student interface components.
- [x] `config/` exists and contains documented configuration contracts.
- [x] `database/` exists and contains module-owned persistence definitions.
- [x] `docs/` exists and contains detailed module documentation.
- [x] `events/` exists and contains event contracts.
- [x] `pages/` exists where solution-level composition requires it.
- [x] `permissions/` exists and contains permission definitions.
- [x] `services/` exists and contains student use cases.
- [x] `stores/` is documented as unused in the backend-only package build.
- [x] `tests/` exists and contains required test coverage.
- [x] `types/` exists and contains public and internal type definitions.
- [x] `README.md` exists.
- [x] `CHANGELOG.md` exists.
- [x] `VERSION` exists.

**Review result:** Pass

## 13. Documentation Review

- [x] Module purpose and scope are documented.
- [x] Features and exclusions are documented.
- [x] Dependencies and version expectations are documented.
- [x] Permissions are documented.
- [x] Exposed and consumed events are documented.
- [x] Configuration options and safe defaults are documented.
- [x] Database ownership is documented.
- [x] Tenant scope is documented.
- [x] API behavior is documented.
- [x] Testing expectations are documented.
- [x] Security considerations are documented.
- [x] Maintenance ownership is documented.
- [x] Client extension guidance is documented.
- [x] Documentation matches the reviewed release.

**Review result:** Pass

## 14. API Review

### Example endpoints

```text
GET    /api/lms/students
POST   /api/lms/students
GET    /api/lms/students/{id}
PATCH  /api/lms/students/{id}
POST   /api/lms/students/{id}/suspend
DELETE /api/lms/students/{id}
```

### Review checklist

- [x] Endpoints follow the NEWAX API Design Standard.
- [x] Resources use clear plural names.
- [x] Protected endpoints require authentication.
- [x] Sensitive actions require explicit permissions.
- [x] Incoming data is validated.
- [x] Response formats are consistent.
- [x] Errors do not expose stack traces or internal details.
- [x] Collection endpoints support pagination.
- [x] Filters and sorting are documented.
- [x] Tenant boundaries are enforced server-side.
- [x] Sensitive actions create audit events.
- [x] API changes are versioned and documented.

**Review result:** Pass

## 15. Permission Review

- [x] Permission keys follow the `module.action` convention.
- [x] Every protected action has an explicit permission.
- [x] Business logic does not check hardcoded role names.
- [x] Frontend visibility is not treated as authorization.
- [x] APIs and services both enforce access rules where appropriate.
- [x] Suspension and archival require specific permissions.
- [x] Permission-impacting changes are auditable.
- [x] Client roles can group permissions without changing module logic.

**Review result:** Pass

## 16. Event Review

- [x] Business events represent completed facts.
- [x] Event names follow the `module.action` convention.
- [x] Published events are documented.
- [x] Consumed events are documented.
- [x] Payload categories are documented.
- [x] Events exclude secrets and unnecessary sensitive data.
- [x] Consumers do not violate module ownership.
- [x] Sensitive events are auditable.
- [x] Contract changes require version and changelog updates.
- [x] Direct service calls remain available when clearer than events.

**Review result:** Pass

## 17. Testing Review

### Required automated coverage

- [x] Student profile creation.
- [x] Duplicate prevention within one organization.
- [x] Same person allowed in different organizations when policy permits.
- [x] Student profile updates.
- [x] Suspension workflow.
- [x] Archival workflow.
- [x] Required-field validation.
- [x] Invalid status transitions.
- [x] Authentication enforcement.
- [x] Permission enforcement for every sensitive action.
- [x] Organization A cannot access Organization B records.
- [x] Event publication.
- [x] Audit event generation.
- [x] API response and error formats.
- [x] Database relationship integrity.
- [x] Regression coverage for resolved critical defects.

### Manual acceptance coverage

- [x] Authorized administrator can create a student profile.
- [x] Authorized staff can view permitted student records.
- [x] Unauthorized users cannot view student data.
- [x] Suspended students are visibly distinguishable without exposing unnecessary details.
- [x] Search, filters, and pagination behave correctly.
- [x] Mobile and desktop interfaces remain usable where applicable.

**Review result:** Pass

## 18. Security Review

- [x] Authentication requirements are explicit.
- [x] Permission checks exist at trusted backend boundaries.
- [x] Tenant boundaries are enforced.
- [x] Sensitive student actions are logged.
- [x] Personal data is minimized.
- [x] Passwords and authentication secrets are never stored in student tables.
- [x] Student exports require explicit permission.
- [x] Sensitive exports are auditable.
- [x] File access uses approved file permissions.
- [x] Super-admin access is explicit and logged.
- [x] Errors do not expose infrastructure details.
- [x] No unresolved critical or high-severity findings remain.

**Review result:** Pass

**Accepted low-risk note:** Display formatting may vary between client solutions, but formatting must not change access control or data ownership behavior.

## 19. Versioning Review

- [x] `VERSION` contains `1.0.0`.
- [x] The registry entry matches `1.0.0` before activation.
- [x] Semantic versioning is used.
- [x] Dependency compatibility is documented.
- [x] Breaking changes require a major version.
- [x] Upgrade notes exist.
- [x] Migration and rollback expectations are documented.
- [x] The module supports controlled client updates.

**Review result:** Pass

## 20. Changelog Review

- [x] `CHANGELOG.md` exists.
- [x] Version `1.0.0` is documented.
- [x] Initial capabilities are recorded.
- [x] Permission definitions are recorded.
- [x] Event contracts are recorded.
- [x] Database ownership is recorded.
- [x] Known limitations are recorded.
- [x] Security and migration notes are included where applicable.

**Review result:** Pass

## 21. Client Customization Review

- [x] Client-specific fields are not embedded in reusable core tables.
- [x] Client extensions are stored separately.
- [x] Configuration is used before custom code where practical.
- [x] Approved events and extension points are documented.
- [x] Client adapters depend on public contracts.
- [x] Client customizations are recorded in deployment manifests.
- [x] Customizations do not silently alter tenant boundaries.
- [x] Customizations do not prevent standard upgrades without documented reason.

**Review result:** Pass

## 22. Module Registry Review

| Registry field | Reviewed value |
| --- | --- |
| `module_name` | `LMS Students` |
| `module_key` | `lms-students` |
| `module_layer` | `business_domain` |
| `module_version` | `1.0.0` |
| `module_status` | `active` after formal approval |
| `module_owner` | `NEWAX Engineering` |
| `tenant_scope` | `organization_scoped` |
| `database_ownership` | `lms_student_profiles` |

- [x] Registry identity is correct.
- [x] Dependencies are complete.
- [x] Permissions are complete.
- [x] Events are complete.
- [x] Configuration options are complete.
- [x] Documentation paths are correct.
- [x] Changelog path is correct.
- [x] Compatibility notes explain the Central Registry dependency.

**Review result:** Pass

## 23. Final Approval Record

| Field | Example value |
| --- | --- |
| Module name | LMS Students |
| Module key | `lms-students` |
| Version | `1.0.0` |
| Layer | `business_domain` |
| Previous status | `draft` |
| Approved status | `active` |
| Product approver | Example Product Approver |
| Engineering approver | Example Engineering Approver |
| Security reviewer | Example Security Reviewer |
| Approval date | `2026-07-10` |
| Reviewed release | `lms-students-v1.0.0` |
| Known limitations | No bulk-import capability in version `1.0.0`. |
| Accepted risks | No unresolved critical or high risks. |
| Related ADRs | ADR 0002, ADR 0003, ADR 0005, ADR 0007, ADR 0008, ADR 0009, ADR 0010 |
| Registry action | Update reviewed module entry from `draft` to `active`. |

## 24. Final Decision

**Example decision:** Approved for activation.

**Conditions:**

1. The registry version must match the released `VERSION` file.
2. Production deployment must use an approved client deployment manifest.
3. Tenant-isolation tests must remain part of the required release checks.
4. Any new sensitive field, export capability, or cross-organization workflow requires security review.
5. Client-specific behavior must remain outside the reusable module.

## 25. Reapproval Triggers

The module must return to review when a future change introduces:

- A major version.
- A breaking API or event change.
- A new sensitive permission.
- A new cross-organization workflow.
- A new data export.
- A new file-upload capability.
- A significant database ownership change.
- A new external integration.
- A material change to student identity handling.
- A significant security finding.

## 26. Example Completion Statement

The example `lms-students` module satisfies the documented architecture, structure, documentation, API, permission, tenant-isolation, database, event, configuration, testing, security, versioning, changelog, customization, and registry requirements for activation.

This statement demonstrates the expected approval format. It is not evidence that the real module has been implemented or approved.