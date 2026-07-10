# Data Model Naming Example

## Purpose

This example shows practical good and bad naming patterns for NEWAX Core, LMS, CRM, Legal, and future project domains.

This is an example document only. It does not create actual database migrations, production models, implementation code, or database schemas.

## Good Table Names

```text
core_organizations
core_people
core_users
core_memberships
core_roles
core_permissions
core_contacts
core_audit_logs
lms_student_profiles
lms_courses
lms_test_results
crm_leads
crm_deals
legal_cases
healthcare_appointments
finance_invoices
```

Why these are good:

- They use lowercase `snake_case`.
- They use clear business names.
- They use `core_` for shared foundation data.
- They use domain prefixes for project-specific data.
- They avoid making LMS the center of future domains.

## Bad Table Names

```text
data
info
details
misc
common
stuff
temp
mapping
student_info
users_data
all_people
new_table
```

Why these are bad:

- They are vague.
- They do not show domain ownership.
- They are difficult to support and report on.
- They may hide duplicate identity or tenant boundary problems.
- They depend on private developer context.

## Good Column Names

```text
id
organization_id
person_id
user_id
membership_id
role_id
permission_id
course_id
student_profile_id
teacher_profile_id
payment_id
test_id
status
payment_status
approval_status
created_at
updated_at
deleted_at
approved_at
created_by
updated_by
approved_by
```

Why these are good:

- They are descriptive.
- They use lowercase `snake_case`.
- They make relationships clear.
- They align with identity, tenant, audit, and lifecycle rules.

## Bad Column Names

```text
p_id
u_id
org
ref
target
value
flag
misc_data
info
details
date_created
modified_on
when_done
```

Why these are bad:

- They are unclear or inconsistent.
- They make relationships difficult to review.
- They weaken reporting and support visibility.
- They do not consistently align with NEWAX timestamp and identity naming rules.

## Example Core Tables

```text
core_organizations
- id
- name
- status
- configuration
- created_at
- updated_at

core_people
- id
- full_name
- status
- created_at
- updated_at

core_users
- id
- person_id
- status
- last_login_at
- created_at
- updated_at

core_memberships
- id
- organization_id
- person_id
- status
- created_at
- updated_at

core_roles
- id
- organization_id
- name
- status
- created_at
- updated_at

core_permissions
- id
- permission_key
- module_key
- description
- created_at
- updated_at

core_audit_logs
- id
- organization_id
- user_id
- action
- entity_type
- entity_id
- created_at
```

Notes:

- Shared identity data belongs in `core_` tables.
- `person_id` points to a real human identity.
- `user_id` points to login access.
- Tenant-scoped records use `organization_id` where appropriate.

## Example LMS Tables

```text
lms_student_profiles
- id
- organization_id
- person_id
- status
- created_at
- updated_at

lms_teacher_profiles
- id
- organization_id
- person_id
- status
- created_at
- updated_at

lms_courses
- id
- organization_id
- course_name
- status
- published_at
- created_at
- updated_at

lms_lectures
- id
- organization_id
- course_id
- lecture_title
- status
- created_at
- updated_at

lms_enrollments
- id
- organization_id
- student_profile_id
- course_id
- status
- created_at
- updated_at

lms_tests
- id
- organization_id
- course_id
- test_title
- status
- created_at
- updated_at

lms_test_results
- id
- organization_id
- test_id
- student_profile_id
- status
- approved_at
- created_at
- updated_at

lms_payments
- id
- organization_id
- student_profile_id
- payment_status
- approved_by
- approved_at
- created_at
- updated_at
```

Notes:

- LMS-specific data uses the `lms_` prefix.
- LMS profile tables reference `core_people` through `person_id`.
- Tenant-scoped LMS records include `organization_id` where appropriate.
- LMS tables must not become the foundation for CRM, Legal, Healthcare, or future domains.

## Example CRM Tables

```text
crm_leads
- id
- organization_id
- person_id
- status
- created_at
- updated_at

crm_customers
- id
- organization_id
- person_id
- status
- created_at
- updated_at

crm_deals
- id
- organization_id
- customer_id
- deal_status
- created_at
- updated_at

crm_tasks
- id
- organization_id
- assigned_user_id
- status
- due_at
- created_at
- updated_at
```

Notes:

- CRM business data uses the `crm_` prefix.
- People should still be represented centrally when appropriate.
- CRM must not depend on LMS-specific tables.

## Example Legal Tables

```text
legal_lawyer_profiles
- id
- organization_id
- person_id
- status
- created_at
- updated_at

legal_clients
- id
- organization_id
- person_id
- status
- created_at
- updated_at

legal_cases
- id
- organization_id
- legal_client_id
- case_status
- created_at
- updated_at

legal_documents
- id
- organization_id
- legal_case_id
- uploaded_by
- status
- created_at
- updated_at
```

Notes:

- Legal business data uses the `legal_` prefix.
- Legal clients may reference `core_people` through `person_id`.
- Legal domain records should preserve organization boundaries.

## Example Relationships

Good relationship table names:

```text
core_membership_roles
core_role_permissions
lms_course_enrollments
lms_test_attempts
lms_student_courses
crm_customer_deals
legal_case_participants
```

Bad relationship table names:

```text
mapping
relation
link_table
student_map
course_link
entity_refs
```

Relationship naming guidance:

- Name the relationship clearly.
- Use `core_` only for shared foundation relationships.
- Use the domain prefix when the relationship belongs to a project domain.
- Avoid generic names unless the relationship is truly generic and documented.

## Example Audit Fields

Use audit fields where appropriate:

```text
created_by
updated_by
deleted_by
approved_by
rejected_by
```

Example with audit fields:

```text
lms_payments
- id
- organization_id
- student_profile_id
- payment_status
- created_by
- updated_by
- approved_by
- rejected_by
- created_at
- updated_at
- approved_at
- rejected_at
```

Audit field guidance:

- Audit user fields should reference `core_users` where the action is performed by a login account.
- Audit fields do not replace audit logs.
- Sensitive actions such as payment approval, result update, report export, role assignment, and permission changes should also be logged where appropriate.

## Reminder

- Shared identity data belongs in the Central Registry.
- Project-specific business data belongs in the related project domain.
- Tenant-scoped records must support organization boundary enforcement.
- Table and column names should be understandable by future NEWAX engineers, not only the original author.
