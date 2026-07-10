# ADR 0008: Use Central Identity and Organization Registry

## Purpose

Document why NEWAX Core will use a shared central identity and organization registry as the foundation for multiple future project domains, including LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other business infrastructure systems.

This ADR makes the Central Registry an official NEWAX Core architecture decision. It does not create implementation code, database migrations, or production modules.

## 1. Decision Title

ADR 0008: Use Central Identity and Organization Registry

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being built as a reusable business infrastructure foundation, not only as an LMS codebase.

The first connected project domain is LMS, but future domains may include CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other business systems.

These domains will need a shared foundation for identity, organizations, memberships, roles, permissions, contacts, and audit logs. If each domain creates its own unrelated identity and organization records, NEWAX will create duplicate data, weak access control, inconsistent reporting, and difficult long-term maintenance.

## 5. Problem

Without a Central Identity and Organization Registry, each project domain may define separate people, users, organizations, roles, permissions, and contact data.

This would create risks such as:

- Duplicate person records across domains.
- LMS tables becoming the accidental foundation for future projects.
- Future domains depending directly on LMS-specific tables.
- Inconsistent user access across organizations.
- Hardcoded role checks.
- Weak tenant and organization boundaries.
- Poor auditability of identity and permission changes.
- Difficult cross-domain reporting and analytics.
- Unclear data ownership between shared identity data and project-specific business data.

NEWAX needs one shared foundation for identity and organization records while preserving project domain independence.

## 6. Decision

NEWAX Core will use a Central Identity and Organization Registry as the shared foundation for identity, organizations, memberships, roles, permissions, contacts, and audit logs.

The Central Registry will allow multiple future NEWAX project domains to connect to the same identity and organization foundation without depending on LMS-specific tables.

Core principle:

Do not design the LMS as the center of the NEWAX platform.

Design the Central Registry as the foundation.

Treat LMS as one connected project domain.

## 7. Reasoning

A Central Registry gives NEWAX a consistent foundation for future business infrastructure systems.

This decision supports:

- Identity consistency across domains.
- Clear organization and tenant boundaries.
- Reusable access control concepts.
- Better auditability of identity and permission changes.
- Safer cross-domain reporting.
- Better support for multi-role people.
- Reduced duplication across LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, and Hospitality.
- Long-term scalability as NEWAX grows beyond one project domain.

The Central Registry lets NEWAX start practical while protecting the platform from becoming LMS-centered.

## 8. Alternatives Considered

### Use LMS Tables As The Shared Foundation

The LMS project could define people, organizations, users, roles, and permissions as LMS-specific tables and future domains could reuse those tables.

This was not selected because future domains must not depend on LMS-specific tables. LMS is one connected project domain, not the foundation for all NEWAX projects.

### Separate Identity Models Per Domain

Each domain could define its own people, users, organizations, roles, and permissions.

This was not selected because it would create duplicate records, inconsistent access control, weak reporting, and difficult identity reconciliation across future NEWAX systems.

### External Identity Provider Only

NEWAX could rely only on an external identity provider for user accounts.

This was not selected as the full solution because NEWAX still needs business-facing organizations, people, memberships, roles, permissions, contacts, audit logs, and project-domain relationships inside its own platform foundation.

### Client-Specific Identity Tables

Each client system could maintain its own identity and organization records.

This was not selected as the default because NEWAX needs reusable business infrastructure with clear ownership, not isolated client-specific identity silos.

## 9. What The Central Registry Is

The Central Registry is the shared NEWAX Core foundation for identity, organizations, membership, access control, contact information, and audit context.

It should provide shared records that project domains can reference through stable identifiers such as:

- `person_id`.
- `user_id`.
- `organization_id`.
- `membership_id` where appropriate.

The registry should support multiple domains without making those domains depend on each other's project-specific tables.

## 10. What The Central Registry Is Not

The Central Registry is not:

- The LMS database.
- A place for every project-specific record.
- A replacement for project domain tables.
- A public user directory.
- A reason to ignore tenant isolation.
- Permission-free NEWAX access to all data.
- A dumping ground for unrelated shared-looking data.
- A place for client-specific customization logic.

The Central Registry owns shared identity and organization foundation data. Project-specific business data belongs in the related project domain.

## 11. Core Registry Entities

The Central Registry should include shared foundation entities such as:

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

Entity responsibilities:

| Entity | Responsibility |
| --- | --- |
| `core_organizations` | Represents client organizations, companies, institutes, branches, departments, or business units. |
| `core_people` | Represents real human beings once, independent of project-specific roles. |
| `core_users` | Represents login accounts connected to people. |
| `core_memberships` | Connects people or users to organizations. |
| `core_roles` | Represents responsibility groups inside an organization. |
| `core_permissions` | Defines or supports actual access rights. |
| `core_contacts` | Stores communication details where needed. |
| `core_audit_logs` | Records important system, identity, access, and security actions. |

This table list is architecture direction only and does not create database migrations.

## 12. Organizations

Organizations represent client organizations, institutes, companies, branches, departments, or business units.

Rules:

- Organizations belong in the Central Registry when they represent shared tenant or business context.
- Project-specific organization behavior belongs in the project domain.
- Tenant-scoped records should reference organizations through `organization_id` where appropriate.
- One organization must not accidentally access another organization's records.
- Future domains should reference central organizations instead of creating unrelated organization records.

Organizations are the primary business-facing tenant concept for NEWAX Core.

## 13. People

People represent real human beings once, regardless of whether they are students, teachers, accountants, lawyers, admins, customers, employees, patients, doctors, leads, or clients.

Rules:

- A person may exist without login access.
- A person may hold different roles in different organizations or domains.
- Project-specific profile records should reference `core_people` through `person_id`.
- The same person must not be duplicated unnecessarily across multiple project tables.
- Shared identity data belongs in `core_people`.

Example:

A person may be:

- Teacher in one LMS organization.
- Admin in another LMS organization.
- Client in a Legal domain.
- Lead in a CRM domain.

This should be represented through one central person record and domain-specific profile records.

## 14. Users

Users represent login accounts connected to people.

Rules:

- User login identity belongs in `core_users`.
- A user should connect to a person where appropriate.
- A person is not automatically a user.
- A user may have access to multiple organizations where permissions allow it.
- Project domains should not create separate authentication tables without an approved architecture decision.

Login access must be controlled through central identity, membership, role, and permission rules.

## 15. Organization Memberships

Memberships connect people or users to organizations.

Rules:

- Memberships should represent organization association and access context.
- A person may have memberships in multiple organizations.
- Memberships may support status such as active, invited, suspended, or archived.
- Membership changes that affect access must be auditable.
- Permissions must be scoped by organization where required.

Memberships help support tenant-aware access across LMS and future connected domains.

## 16. Roles

Roles represent responsibility groups inside an organization.

Examples:

- Owner.
- Admin.
- Teacher.
- Student.
- Accountant.
- Lawyer.
- Doctor.
- Sales Agent.
- HR Manager.

Rules:

- Roles are labels or responsibility groups.
- Roles should group permissions.
- Roles must not be hardcoded into business logic.
- Client-specific roles may be created without modifying reusable core modules directly.
- Role assignments should be auditable when security-sensitive.

Business logic must check permissions, not role names.

## 17. Permissions

Permissions define actual access rights.

Rules:

- Permissions should follow the `module.action` convention.
- Permissions must be scoped by organization where required.
- Permissions must be auditable when granted, revoked, or changed in security-sensitive contexts.
- Project domains own and document their domain-specific permissions.
- Core permission assignment and evaluation must preserve organization context.
- Reports, exports, administrative tools, and background jobs must not bypass permissions.

Examples:

```text
students.view
courses.publish
payments.approve
legal_cases.view
crm_deals.update
healthcare_appointments.create
reports.export
```

This aligns with ADR 0002: Use Permission-Based Access Control.

## 18. Contacts

Contacts store communication details where needed.

Contact records may include:

- Email addresses.
- Phone numbers.
- Addresses.
- Business contact details.
- Emergency contacts.
- Preferred communication channels.

Rules:

- Shared contact information belongs in the Central Registry when it may be reused across domains.
- Project-specific contact details may remain in the project domain when they only apply there.
- Contact details must be protected when sensitive.
- Contact changes related to identity, billing, security, or compliance should be auditable.
- Contact data should be minimized where possible.

The Central Registry should not collect sensitive contact data without a clear business reason and security controls.

## 19. Audit Logs

Audit logs record important system and security actions.

Audit events may include:

```text
person.created
person.updated
user.created
user.suspended
organization.created
organization.updated
membership.created
membership.removed
role.assigned
role.removed
permission.changed
admin.accessed_sensitive_data
report.exported
```

Rules:

- Identity and permission-related changes must be auditable.
- NEWAX super admin access must be auditable.
- Audit logs should preserve actor, organization, action, affected resource, timestamp, and security context where appropriate.
- Audit logs must not expose secrets or unnecessary sensitive data.
- Audit logs must be protected from unauthorized access and modification.

Audit logging is required for trust, security, support, and accountability.

## 20. Project Domain Separation

Project-specific data must be separated by domain.

Shared identity data belongs in the Central Registry. Project-specific business data belongs in the related project domain.

Example LMS domain tables:

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

Example Legal domain tables:

```text
legal_lawyer_profiles
legal_clients
legal_cases
legal_documents
```

Example CRM domain tables:

```text
crm_leads
crm_customers
crm_deals
crm_tasks
```

Example Healthcare domain tables:

```text
healthcare_patient_profiles
healthcare_doctor_profiles
healthcare_appointments
healthcare_prescriptions
```

Rules:

- Project-specific business data belongs in the related project domain.
- Future projects must not directly depend on LMS tables.
- Domain tables should reference the Central Registry using `person_id` and `organization_id` where appropriate.
- Domain modules should expose approved APIs, services, or events for cross-domain interaction.

Domain separation protects modularity and future scalability.

## 21. LMS As The First Connected Domain

LMS is the first connected project domain, not the center of the NEWAX platform.

Rules:

- LMS tables must reference the Central Registry using `person_id` and `organization_id` where appropriate.
- LMS-specific business data belongs in LMS domain tables.
- LMS profile records should reference central people.
- LMS tenant-scoped records should reference central organizations.
- Future domains must not directly depend on LMS tables.
- The Central Registry must not depend on LMS tables.

Good:

```text
core_people stores Ali Khan once.
lms_teacher_profiles connects Ali Khan to ABC Institute.
crm_leads connects Ali Khan to a CRM pipeline.
legal_clients connects Ali Khan to a legal case.
```

Bad:

```text
Creating separate unrelated Ali Khan records in students, teachers, lawyers, customers, and admins tables with no shared identity.
```

## 22. Future Connected Domains

Future domains such as CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other business systems should connect to the same Central Registry.

Rules:

- Future domains should reference `core_people`, `core_users`, and `core_organizations` where shared identity or tenant ownership is needed.
- Future domains should own their own business records.
- Future domains should register and document their permissions.
- Future domains should publish events for important business actions where appropriate.
- Future domains must not depend on LMS-specific tables.
- Future domains must respect Central Registry tenant, permission, and audit rules.

The Central Registry allows future domains to share identity without sharing project-specific business tables.

## 23. Data Ownership Rules

Data ownership must be explicit.

Rules:

- The Central Registry owns shared identity, organization, membership, access, contact, and audit foundation data.
- LMS owns LMS-specific business data.
- Legal owns legal-specific business data.
- CRM owns CRM-specific business data.
- Healthcare owns healthcare-specific business data.
- Future domains own their own project-specific business data.
- Shared identity data should not be duplicated into project domains without a documented reason.
- Domain-specific tables must not become the source of truth for shared identity.

Ownership clarity protects long-term maintainability and prevents platform drift.

## 24. Tenant And Organization Boundaries

Every tenant-scoped record must respect organization boundaries.

Rules:

- Organization is the primary business-facing tenant concept.
- Tenant-scoped records should include `organization_id` where appropriate.
- One organization must not access another organization's records accidentally.
- Cross-organization access must be explicitly authorized and auditable.
- Permissions must be scoped by organization where required.
- Reports must respect organization boundaries unless accessed by authorized NEWAX super admins.
- NEWAX administrative access must be explicit, permission-controlled, and auditable.

Tenant boundary violations must be treated as security issues.

## 25. Permission And Access Control Rules

Access control must be permission-based and tenant-aware where required.

Rules:

- Business logic must check permissions, not hardcoded role names.
- Permissions should follow the `module.action` convention.
- Roles should group permissions but should not define access by themselves.
- Permission checks should include organization context where required.
- Permission changes must be logged when security-sensitive.
- Client-specific roles must not require modification of reusable core modules.
- Data exports must be permission-controlled.

Permission decisions must preserve identity consistency, organization boundaries, and project domain ownership.

## 26. Audit And Security Requirements

Access to Central Registry data must be permission-controlled.

Security rules:

- Sensitive actions must be logged.
- Cross-organization access must be prevented unless explicitly authorized.
- NEWAX super admin access must be auditable.
- Data exports must be permission-controlled.
- User identity, contact details, role changes, and permission changes must be treated as sensitive.
- Audit logs should record identity and permission-related changes.
- Client customizations must not bypass registry security rules.
- Sensitive personal data should be minimized where possible.

Security review should be required for changes that affect identity, organizations, memberships, permissions, contacts, tenant boundaries, or administrative access.

## 27. Reporting And Analytics Considerations

The Central Registry should support reporting and analytics across project domains without collapsing domain ownership.

Rules:

- Cross-domain reporting should use central identifiers such as `person_id` and `organization_id`.
- Reports must respect organization boundaries.
- Reports must enforce permissions.
- Domain-specific metrics should remain owned by the domain that generates them.
- Shared organization and person dimensions should come from the Central Registry.
- Analytics should avoid unnecessary duplication of people and organizations across domains.
- NEWAX super admin reporting must be explicit and auditable.

Reporting convenience must not bypass tenant isolation or access control.

## 28. Scalability Considerations

NEWAX Core may start with one physical database organized by separated domains.

Future evolution may include:

- Central Registry Service.
- Separate LMS database.
- Separate CRM database.
- Separate Legal database.
- Separate Healthcare database.
- Analytics warehouse.
- Dedicated enterprise deployment.
- Hybrid deployment model.

Even if physical databases are separated later, the Central Registry remains the shared identity and organization foundation.

Scalability should be driven by operational scale, security needs, client requirements, compliance needs, and team ownership, not premature infrastructure complexity.

## 29. Maintenance Considerations

The Central Registry must be maintained with strong documentation and ownership.

Maintenance rules:

- Registry entities must have clear owners.
- Registry changes must document impact on connected domains.
- Domain dependencies on registry fields must be documented.
- Permission, membership, and organization changes require careful review.
- Breaking changes to registry identifiers or contracts must be avoided whenever possible.
- Changelogs should identify identity, organization, permission, contact, and audit changes when implementation begins.
- Client-specific behavior must remain outside reusable core registry modules.

The registry should remain stable, understandable, and safe to reuse across future NEWAX systems.

## 30. What Must Never Happen

The following practices are not allowed:

- Do not make LMS tables the foundation for all future NEWAX projects.
- Do not duplicate the same person unnecessarily across multiple domains.
- Do not allow future domains to depend on LMS-specific tables.
- Do not bypass organization boundaries.
- Do not hardcode role names into business logic.
- Do not allow permission changes without audit logs.
- Do not allow NEWAX super admin access without clear permissions and logging.
- Do not mix project-specific business data into core identity tables.
- Do not centralize sensitive data without a clear business reason, contract basis, and security controls.
- Do not treat the Central Registry as permission-free access to all client data.
- Do not create migrations or production modules from this ADR alone.

These rules protect ownership, control, tenant safety, security, modularity, identity consistency, and long-term scalability.

## 31. Impact On NEWAX Core

NEWAX Core must treat the Central Registry as foundational architecture.

Impact:

- Shared identity and organization data must be modeled centrally.
- Future domains must reference the Central Registry instead of LMS-specific tables.
- Module standards must include clear data ownership and registry dependency rules.
- Permission-based access control remains mandatory.
- Tenant-aware organization boundaries remain mandatory.
- Audit logs must track sensitive registry and access changes.
- Future scaling paths must preserve registry identity consistency.

This strengthens NEWAX Core as reusable business infrastructure rather than an LMS-only platform.

## 32. Impact On Client Systems

Client systems can share identity and organization foundations while keeping project-specific business data separate.

Impact:

- A person can participate in multiple roles, organizations, or domains without unnecessary duplicate identity records.
- Client systems can reuse organization, membership, role, permission, contact, and audit foundations.
- Client data must remain tenant-isolated.
- Client reports must respect organization and permission boundaries.
- Client-specific customizations must not modify reusable core registry modules directly.
- NEWAX administrative access must be explicit, permission-controlled, and auditable.

This gives client systems consistency while preserving domain-specific flexibility.

## 33. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Central Identity and Organization Registry Architecture](../architecture/central-registry-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [ADR 0002: Use Permission-Based Access Control](./0002-use-permission-based-access-control.md)
- [ADR 0003: Design for Multi-Tenancy](./0003-design-for-multi-tenancy.md)
- [ADR 0004: Separate Client Customizations from Core Modules](./0004-separate-client-customizations-from-core.md)
- [ADR 0005: Use Event-Driven Module Communication](./0005-use-event-driven-module-communication.md)
- [ADR 0006: Use Controlled Updates and Versioning](./0006-use-controlled-updates-and-versioning.md)
- [ADR 0007: Define LMS Centralized Database and Data Ownership Rules](./0007-define-lms-centralized-database-and-data-ownership.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 34. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, Security, Support, or leadership ownership is assigned.
