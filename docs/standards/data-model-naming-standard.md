# NEWAX Data Model Naming Standard

## Purpose

Define consistent naming rules for database tables, columns, IDs, relationships, timestamps, statuses, prefixes, and domain-specific data structures across NEWAX Core, LMS, and future project domains.

This standard is for internal NEWAX engineering use. It aligns with ADR 0007: Define LMS Centralized Database and Data Ownership Rules and ADR 0008: Use Central Identity and Organization Registry.

This document is a standard only. It does not create actual database migrations, production models, implementation code, or database schemas.

## 1. What The Data Model Naming Standard Is

The Data Model Naming Standard defines how NEWAX names database tables, columns, identifiers, relationships, lifecycle fields, audit fields, tenant fields, and domain-specific data structures.

It exists to keep NEWAX Core, LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and future business domains understandable and consistent as the platform grows.

This standard protects the Central Identity and Organization Registry while allowing project domains to own their own business data.

## 2. Why NEWAX Needs Consistent Database Naming

NEWAX Core is intended to support reusable modules, client systems, and multiple future business domains. Inconsistent naming creates confusion, hidden coupling, poor reporting, risky migrations, and unclear ownership.

Consistent database naming helps NEWAX:

- Keep shared identity data separate from project-specific data.
- Make module and table ownership easier to understand.
- Support tenant and organization boundaries.
- Prevent LMS-specific tables from becoming the foundation for future projects.
- Improve reporting, analytics, debugging, and support.
- Reduce onboarding time for engineers.
- Support future scalability and domain separation.
- Keep migrations and documentation easier to review.

Clear names are part of long-term maintainability.

## 3. General Naming Principles

Use these principles for database naming:

- Use lowercase `snake_case` for tables and columns.
- Use clear business names.
- Avoid vague names such as `data`, `info`, `details`, `misc`, `temp`, `common`, or `stuff`.
- Use consistent prefixes for core and domain tables.
- Table names should be plural.
- Column names should be descriptive.
- Avoid abbreviations unless widely understood.
- Do not design table names only around LMS when the data belongs to NEWAX Core.
- Keep naming consistent with module boundaries and domain ownership.
- Prefer names that can be understood without private explanation.

Names should describe what the record is, who owns it, and which domain it belongs to.

## 4. Table Naming Rules

Table names must use clear lowercase `snake_case` names.

Rules:

- Use plural table names.
- Use `core_` for shared foundation tables.
- Use project domain prefixes for domain-specific tables.
- Use business terms instead of vague technical labels.
- Use profile tables when a person has a domain-specific role or identity.
- Do not put domain-specific business data into core identity tables.
- Do not create table names that only make sense to one developer.

Good:

```text
core_people
core_organizations
lms_student_profiles
lms_courses
crm_leads
legal_cases
```

Bad:

```text
people_data
student_info
misc
common
mapping
new_table
```

Table names should make ownership and domain clear.

## 5. Column Naming Rules

Column names must use clear lowercase `snake_case` names.

Rules:

- Use descriptive names.
- Use `id` for the primary key.
- Use clear foreign key names such as `organization_id`, `person_id`, or `course_id`.
- Use `status` for lifecycle state when a record has one primary lifecycle.
- Use standard timestamp names such as `created_at` and `updated_at`.
- Avoid vague column names such as `data`, `value`, `info`, `flag`, or `type` unless the meaning is documented and specific.
- Avoid abbreviations unless they are widely understood.

Good:

```text
organization_id
person_id
course_id
payment_status
approved_at
created_by
```

Bad:

```text
org
p_id
misc_data
info
details
when_done
```

Column names should explain the field without requiring a separate conversation.

## 6. Primary Key Rules

Primary keys identify records within a table.

Rules:

- Use `id` as the primary key column name.
- Use UUIDs or another approved globally unique identifier where appropriate.
- Do not expose predictable internal IDs publicly where security matters.
- Do not use table-specific primary key names such as `student_id` as the primary key of the same table unless an approved legacy constraint requires it.
- Keep primary key naming consistent across modules.

Example:

```text
core_people.id
lms_student_profiles.id
crm_leads.id
legal_cases.id
```

Foreign keys should use descriptive names. Primary keys should remain simple and consistent.

## 7. Foreign Key Rules

Foreign keys must clearly describe what they reference.

Use clear foreign key names such as:

```text
organization_id
person_id
user_id
role_id
permission_id
membership_id
course_id
student_profile_id
teacher_profile_id
payment_id
test_id
```

Rules:

- Foreign key names must describe the referenced entity.
- Use `person_id` when referencing a real human identity in `core_people`.
- Use `user_id` when referencing login access in `core_users`.
- Use `organization_id` for organization-scoped records.
- Avoid unclear names such as `owner`, `ref_id`, `entity_id`, `target_id`, or `parent_id` unless the relationship is documented and truly generic.
- Cross-module references must respect module ownership and approved interfaces.

Foreign keys should make relationships traceable and reviewable.

## 8. Core Table Prefix Rules

Shared foundation tables should use the `core_` prefix.

Examples:

```text
core_organizations
core_people
core_users
core_memberships
core_roles
core_permissions
core_contacts
core_audit_logs
```

Rules:

- Use `core_` only for shared NEWAX foundation data.
- Shared identity, organization, membership, role, permission, contact, and audit structures belong in core tables.
- Do not place LMS-specific, CRM-specific, Legal-specific, or Healthcare-specific business data in core tables.
- Core tables must remain reusable across future project domains.
- Core tables must not depend on LMS tables.

The `core_` prefix protects the Central Identity and Organization Registry from becoming mixed with one project domain.

## 9. Project Domain Prefix Rules

Project-specific tables should use domain prefixes.

LMS examples:

```text
lms_student_profiles
lms_teacher_profiles
lms_accountant_profiles
lms_admin_profiles
lms_courses
lms_lectures
lms_enrollments
lms_tests
lms_test_results
lms_payments
```

CRM examples:

```text
crm_leads
crm_customers
crm_deals
crm_tasks
```

Legal examples:

```text
legal_lawyer_profiles
legal_clients
legal_cases
legal_documents
```

Healthcare examples:

```text
healthcare_patient_profiles
healthcare_doctor_profiles
healthcare_appointments
healthcare_prescriptions
```

Finance examples:

```text
finance_invoices
finance_payments
finance_expenses
finance_payroll
```

Rules:

- Domain-specific business data must use the appropriate domain prefix.
- Future domains must not depend on LMS table names.
- Shared identity data belongs in `core_` tables, not domain tables.
- Domain profile tables should reference `core_people` through `person_id` where appropriate.
- Tenant-scoped domain tables should reference `core_organizations` through `organization_id` where appropriate.

Domain prefixes support future scalability and reporting clarity.

## 10. Relationship Table Rules

Relationship tables must use clear names that describe both sides of the relationship.

Good examples:

```text
core_membership_roles
core_role_permissions
lms_course_enrollments
lms_test_attempts
lms_student_courses
```

Bad examples:

```text
mapping
relation
link_table
student_map
course_link
```

Rules:

- Name relationship tables after the relationship they represent.
- Use domain prefixes where the relationship belongs to a project domain.
- Use `core_` where the relationship belongs to the shared foundation.
- Avoid generic relationship names unless the table is truly generic and documented.
- Relationship tables must still follow tenant and ownership rules where applicable.

Relationship names should make join purpose clear.

## 11. Status Field Rules

Use `status` when a record has a lifecycle.

Common values may include:

```text
active
inactive
pending
suspended
disabled
archived
approved
rejected
draft
published
```

Rules:

- Use `status` for the main lifecycle state of a record.
- Use a more specific name only when multiple statuses exist, such as `payment_status` or `approval_status`.
- Status values must be documented.
- Do not create random status names without documentation.
- Do not use unclear values such as `ok`, `bad`, `done`, `x`, or `flagged` without definition.
- Status values should be lowercase `snake_case` where multiple words are required.

Status fields must be predictable enough for reporting and support.

## 12. Timestamp Rules

Use standard timestamp names.

Required where applicable:

```text
created_at
updated_at
```

Use these additional timestamps where needed:

```text
deleted_at
approved_at
rejected_at
published_at
archived_at
last_login_at
```

Rules:

- Use `_at` suffix for timestamps.
- Use timestamps consistently across modules.
- Avoid names such as `date_created`, `modified_on`, `time_updated`, or `when_done`.
- Timezone handling must be defined by the implementation architecture when production code begins.
- Timestamp fields should support auditability and reporting.

Consistent timestamps make debugging, reporting, and migrations easier.

## 13. Soft Delete Rules

Soft delete naming must be consistent when soft deletes are used.

Rules:

- Use `deleted_at` to mark when a record was soft deleted.
- Use `deleted_by` where tracking the deleting user is required.
- Do not use unclear fields such as `is_deleted`, `removed`, or `hidden` unless approved and documented.
- Soft-deleted records must not appear in normal active queries unless intentionally requested.
- Soft delete behavior must not bypass tenant or permission rules.
- Data retention expectations must be documented for sensitive records.

Soft deletes are a lifecycle decision and must be handled consistently.

## 14. Audit Field Rules

Audit fields track who performed important actions.

Where appropriate, use:

```text
created_by
updated_by
deleted_by
approved_by
rejected_by
```

Rules:

- Audit user fields should reference `core_users` where the action is performed by a login account.
- Use audit fields for important lifecycle and security-sensitive actions.
- Do not use `person_id` for an action performer unless the action can be performed without login access and that behavior is approved.
- Audit fields do not replace audit logs for sensitive actions.
- Audit fields must respect tenant and permission rules.

Audit fields help support operational accountability.

## 15. Tenant And Organization Field Rules

Tenant-scoped records should include `organization_id` where appropriate.

Rules:

- Use `organization_id` to reference the business-facing tenant concept through `core_organizations`.
- Future `tenant_id` may be used only if NEWAX separates tenant from organization concept.
- Do not mix tenant boundaries casually.
- Every tenant-scoped query must be able to enforce organization boundaries.
- Reports, exports, dashboards, and API responses must respect tenant boundaries.
- Cross-tenant records or shared records must be explicitly designed and documented.
- Do not create tenant-scoped records without organization ownership where required.

Tenant ownership must be visible in table structure and query design.

## 16. User And Person Reference Rules

NEWAX separates real human identity from login access.

Rules:

- `person_id` references a real human identity in `core_people`.
- `user_id` references login access in `core_users`.
- Do not use `user_id` when the record belongs to a person who may not have login access.
- Do not duplicate person records across project domains.
- Domain profile tables should reference `core_people` through `person_id`.
- Login-related records should reference `core_users` through `user_id`.
- Action performer fields such as `created_by` should reference `core_users` where the action is performed by a login account.

Good:

```text
lms_student_profiles.person_id
lms_teacher_profiles.person_id
legal_clients.person_id
crm_customers.person_id
```

Bad:

```text
students.name
students.email
students.phone
```

Bad pattern: duplicating name, email, and phone into domain tables with no `core_people` reference when the person should be centrally represented.

## 17. Permission And Role Naming Rules

Database structures for permissions and roles must align with permission-based access control.

Rules:

- Permission keys should follow the `module.action` naming convention.
- Role records should represent responsibility groups, not hardcoded business logic.
- Do not hardcode role names in database logic.
- Role and permission assignment tables should have clear names.
- Permission changes must be auditable where security-sensitive.
- Client-specific roles must not require changing reusable core module internals.

Examples:

```text
students.view
students.create
payments.approve
reports.export
```

Example tables:

```text
core_roles
core_permissions
core_role_permissions
core_membership_roles
```

Permissions define access. Roles group permissions.

## 18. Event Naming Alignment

Audit and event naming should align with module event naming.

Use `module.action` style for events and audit event names.

Examples:

```text
student.created
payment.approved
result.updated
report.exported
```

Rules:

- Event names should use lowercase words separated by dots.
- Events should describe what happened, not what should happen next.
- Audit log action names should align with event naming where practical.
- Event names must not expose client-specific naming when the event belongs to reusable core behavior.
- Event naming should support reporting, audit review, and integrations.

Consistent event naming helps modules communicate without tight coupling.

## 19. Reporting And Analytics Naming Rules

Reporting and analytics structures must preserve domain and tenant clarity.

Rules:

- Reporting tables, views, or datasets should use clear domain-aware names.
- Reports must not hide tenant or organization scope.
- Analytics names should not mix unrelated domains without clear purpose.
- Derived reporting structures should document their source tables.
- Sensitive reporting datasets must preserve permission and tenant expectations.
- Avoid vague reporting names such as `stats`, `numbers`, `summary`, or `dashboard_data` unless the business meaning is specific and documented.

Good:

```text
lms_payment_reports
lms_student_result_summaries
crm_deal_pipeline_snapshots
legal_case_activity_reports
```

Bad:

```text
stats
numbers
summary
data_export
```

Reporting names should help Product, Engineering, Support, and Operations understand what is being measured.

## 20. What Must Never Happen

The following practices are not allowed:

- Do not create vague table names.
- Do not mix LMS-specific data into core identity tables.
- Do not make LMS tables the foundation for future projects.
- Do not duplicate people unnecessarily across domain tables.
- Do not create foreign keys with unclear names.
- Do not use inconsistent timestamp names.
- Do not use hardcoded role names in database logic.
- Do not create tenant-scoped records without organization ownership where required.
- Do not create naming conventions that only one developer understands.
- Do not use `core_` for project-specific business data.
- Do not use domain prefixes for shared identity data that belongs in the Central Registry.
- Do not create actual database migrations, production models, or implementation code from this standard alone.

Consistent data model naming protects the Central Registry, domain separation, tenant safety, identity consistency, future scalability, and long-term maintainability.
