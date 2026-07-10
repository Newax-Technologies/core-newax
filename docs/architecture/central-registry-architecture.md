# NEWAX Central Identity and Organization Registry Architecture

## Purpose

This document defines how NEWAX Core will use a central identity and organization registry that can support multiple future project domains including LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, and other business infrastructure systems.

The Central Registry is a foundational architecture decision for NEWAX Core. It keeps shared identity, organization, access, contact, and audit concepts in one reusable foundation so future project domains can connect to the same source of truth without depending on each other.

This document is for internal NEWAX engineering use. It does not define implementation code, database migrations, or production modules.

## Core Principle

Design the database so NEWAX can use one central identity and organization registry across multiple future projects.

Do not design the LMS as the center of the platform. Design the Central Registry as the foundation. Treat LMS as one connected project domain.

Shared identity data belongs in the Central Registry. Project-specific business data belongs in that project domain.

## 1. What The Central Registry Is

The NEWAX Central Registry is the shared foundation for identity, organizations, membership, access control, contact information, and audit context across NEWAX-powered systems.

It is the place where NEWAX should define shared records that may be reused across project domains such as LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, and future business infrastructure systems.

The Central Registry should include:

- Organizations.
- People.
- Users.
- Organization memberships.
- Roles.
- Permissions.
- Contacts.
- Audit logs.

The registry provides a stable foundation that project domains can reference through identifiers such as `person_id`, `user_id`, and `organization_id`.

## 2. What The Central Registry Is Not

The Central Registry is not:

- The LMS system.
- A place for project-specific business records.
- A dumping ground for every shared-looking table.
- A replacement for domain-specific modules.
- A shortcut for bypassing project boundaries.
- A place for client-specific customization logic.
- A place where future project domains should depend on LMS tables.

The registry owns shared identity and organization data. It should not absorb business rules that belong to a specific project domain.

## 3. Why NEWAX Needs A Central Registry

NEWAX Core is intended to become reusable business infrastructure across many future products and client systems.

Without a Central Registry, each project domain may create its own separate identity, organization, contact, and access records. That would create duplicated data, inconsistent permissions, difficult reporting, poor auditability, and weak long-term platform control.

The Central Registry gives NEWAX:

- One foundation for organizations and people.
- Clear tenant and organization boundaries.
- Shared identity records across project domains.
- Reusable membership and access control concepts.
- Better auditability across systems.
- Safer future reporting and analytics.
- A practical path for multi-domain client solutions.
- Less duplication as NEWAX builds more vertical systems.

The Central Registry helps NEWAX grow from an LMS-first project into a broader business infrastructure platform.

## 4. Core Registry Entities

The Central Registry should include the core entities that are shared across project domains.

Recommended central registry tables:

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
| `core_organizations` | Stores client organizations, business units, branches, or tenant-facing organizations. |
| `core_people` | Stores person records independent of login status or project-specific role. |
| `core_users` | Stores authentication-facing user records linked to people where appropriate. |
| `core_memberships` | Stores relationships between people or users and organizations. |
| `core_roles` | Stores role labels or responsibility groups. |
| `core_permissions` | Stores permission definitions or permission assignments as the access model evolves. |
| `core_contacts` | Stores reusable contact information for people or organizations. |
| `core_audit_logs` | Stores audit context for important actions across core and connected domains. |

This table list is architectural direction only. It does not create migrations or implementation code.

## 5. Organizations

Organizations are the primary business-facing tenant concept in NEWAX Core.

An organization may represent:

- A client company.
- An institute.
- A school.
- A clinic.
- A law firm.
- A retail group.
- A branch.
- A business unit.

Rules:

- Shared organization identity belongs in `core_organizations`.
- Project-specific organization behavior belongs in the project domain.
- Organization records should support future multi-tenancy.
- Business records should reference `organization_id` where tenant ownership is required.
- Future domains must be able to reference organizations without depending on LMS tables.

For the LMS project, LMS records should reference `core_organizations` through `organization_id`.

## 6. People

People are human identity records in the Central Registry.

A person may later become a student, teacher, lawyer, doctor, CRM customer, HR employee, finance contact, real estate client, or another domain-specific actor.

Rules:

- Shared human identity belongs in `core_people`.
- A person is not automatically a user.
- A person may exist without login access.
- A person may participate in multiple project domains over time.
- Project-specific roles such as student or teacher belong in project domain tables.

For the LMS project, tables such as `lms_students` and `lms_teachers` should reference `core_people` through `person_id`.

## 7. Users

Users are authentication-facing records that represent login access to a NEWAX-powered system.

Rules:

- Authentication identity belongs in `core_users`.
- A user should link to a person where appropriate.
- A user may have access to one or more organizations depending on membership and permission rules.
- A person may exist without a user account.
- Login access must not be assumed from project-specific records alone.

Project domains should not create their own independent authentication model unless an architecture decision explicitly approves it.

## 8. Organization Memberships

Organization memberships define the relationship between people or users and organizations.

A membership may represent:

- A user belonging to an organization.
- A person associated with an organization.
- A role assignment context.
- A tenant-scoped access context.
- A status such as active, invited, suspended, or archived.

Rules:

- Membership records belong in `core_memberships` when the relationship is shared across domains.
- Project-specific participation records may still exist in project domains.
- Memberships should support tenant-aware permissions.
- Membership changes should be auditable when they affect access or security.
- Domain records should not invent parallel organization membership rules when central membership is sufficient.

For LMS, a student enrollment is project-specific, but the student's relationship to the organization may still reference the Central Registry.

## 9. Roles

Roles are labels or responsibility groups used to organize permissions.

Examples:

- Owner.
- Admin.
- Manager.
- Teacher.
- Student.
- Accountant.
- Case Manager.
- Sales Agent.

Rules:

- Shared role definitions or assignments should live in the Central Registry where they apply across domains or organizations.
- Roles must not be hardcoded into business logic.
- Roles should group permissions.
- Business logic must check permissions, not role names.
- Client-specific roles may be configured without modifying reusable core modules directly.

This aligns with ADR 0002: Use Permission-Based Access Control.

## 10. Permissions

Permissions define actual access to actions and resources.

Rules:

- Permissions should follow the `module.action` convention.
- Permissions should be tenant-aware where required.
- Permissions must be auditable when granted, revoked, or changed in security-sensitive contexts.
- Project domains may define their own permissions, but they should register and document them clearly.
- Business logic should check permissions, not hardcoded role names.

Examples:

```text
students.view
students.create
courses.publish
payments.approve
reports.export
legal_cases.view
crm_deals.update
```

The Central Registry should provide the foundation for permission ownership and assignment, while project domains own their domain-specific permission definitions.

## 11. Contacts

Contacts store reusable contact information for people and organizations.

Contact data may include:

- Email addresses.
- Phone numbers.
- Addresses.
- Emergency contacts.
- Business contact details.
- Preferred communication channels.

Rules:

- Shared contact information belongs in `core_contacts` when it may be reused across domains.
- Project-specific contact details may remain in the project domain when they only apply there.
- Sensitive contact data must be protected.
- Contact changes should be auditable when they affect security, billing, compliance, or identity verification.
- Duplicate contact records should be avoided where a shared contact model is appropriate.

Contact ownership must be clear before data is reused across domains.

## 12. Audit Logs

Audit logs record important actions across the Central Registry and connected project domains.

Audit logs should support:

- Security review.
- Permission review.
- Tenant boundary review.
- Support troubleshooting.
- Compliance and accountability.
- Update and configuration traceability.

Rules:

- Security-sensitive registry changes must be auditable.
- Connected domains should preserve person, user, organization, tenant, and action context where appropriate.
- Audit logs should not store unnecessary sensitive data.
- Cross-domain actions should be traceable without requiring future domains to depend on LMS tables.
- Client-specific customizations must not bypass audit requirements.

Audit logging is a platform trust requirement, not only a debugging feature.

## 13. Project Domain Separation

Project-specific data must be separated by domain.

The Central Registry should hold shared foundation data. Domain tables should hold business records that only belong to that project domain.

Example structure:

```text
core_organizations
core_people
core_users
core_memberships
core_roles
core_permissions
core_contacts
core_audit_logs

lms_students
lms_teachers
lms_courses
lms_tests
lms_results
lms_payments

legal_lawyers
legal_clients
legal_cases

crm_leads
crm_customers
crm_deals
```

Rules:

- Shared identity data belongs in the Central Registry.
- Project-specific business data belongs in that project domain.
- Future projects must not directly depend on LMS tables.
- LMS tables must reference Central Registry tables when they need shared person or organization identity.
- Domain modules should expose documented APIs, services, or events instead of allowing other domains to reach into internal tables.

This separation protects modularity and future scalability.

## 14. LMS As The First Connected Domain

LMS is the first connected project domain, not the center of NEWAX Core.

For the LMS project:

- `lms_students` should reference `core_people` through `person_id`.
- `lms_students` should reference `core_organizations` through `organization_id` where tenant ownership is required.
- `lms_teachers` should reference `core_people` through `person_id`.
- LMS records such as courses, tests, results, and payments should reference `organization_id` where appropriate.
- LMS permissions should be registered and documented without hardcoding roles.
- LMS-specific business rules should stay in the LMS domain.

The LMS domain may use central people and organizations, but the Central Registry must not depend on LMS tables.

## 15. Future Connected Domains

Future domains such as CRM, Legal, Healthcare, Finance, HR, Real Estate, Retail, Hospitality, and other business systems should connect to the same Central Registry.

Rules:

- Future domains should reference `core_people`, `core_users`, and `core_organizations` where shared identity or tenant ownership is needed.
- Future domains must not directly depend on LMS tables.
- Future domains should own their own business data.
- Future domains should register their own permissions.
- Future domains should publish events for important business actions where appropriate.
- Future domains should respect Central Registry tenant, identity, permission, and audit rules.

The Central Registry is the shared foundation. Each project domain remains independently owned.

## 16. Data Ownership Rules

Data ownership must be explicit.

Rules:

- The Central Registry owns shared identity, organization, membership, access, contact, and audit foundation data.
- LMS owns LMS-specific business data.
- Legal owns legal-specific business data.
- CRM owns CRM-specific business data.
- Future domains own their own project-specific business data.
- Shared data should not be duplicated into project domains unless there is a documented reason.
- Project domains should reference central identifiers instead of copying central records.
- Domain-specific tables should not become the source of truth for shared identity.

Ownership clarity protects long-term maintainability and prevents platform drift.

## 17. Tenant And Organization Boundaries

Tenant and organization boundaries are central to NEWAX Core security.

Rules:

- Organization is the primary business-facing tenant concept.
- Tenant-scoped records should include `organization_id` where appropriate.
- One organization must not accidentally access another organization's data.
- Tenant boundaries must be enforced in APIs and services, not only in user interface code.
- Connected domains must preserve organization context when querying or reporting data.
- Cross-organization access must be explicit, permissioned, and auditable.
- Future domains must not bypass tenant rules by reading LMS tables directly.

This aligns with ADR 0003: Design for Multi-Tenancy.

## 18. Permission And Access Control Rules

Access control must be permission-based and tenant-aware where required.

Rules:

- Business logic must check permissions, not hardcoded role names.
- Permissions should follow the `module.action` convention.
- Roles should group permissions but should not define access by themselves.
- Domain modules own and document their domain permissions.
- Shared permission assignment and evaluation should align with the Central Registry architecture.
- Permission changes should be logged when security-sensitive.
- Client-specific roles must not require modification of reusable core modules.

Permission decisions should preserve central identity, organization context, and project domain ownership.

## 19. Audit And Security Requirements

The Central Registry contains sensitive platform foundation data and must be treated as a high-security area.

Security requirements:

- Identity records must be protected.
- Organization ownership must be protected.
- Membership changes must be auditable when access is affected.
- Role and permission changes must be auditable.
- Contact changes must be protected where sensitive.
- Cross-domain access must be explicit and reviewed.
- Tenant boundaries must be tested where implementation exists.
- Client customizations must not bypass registry security rules.
- Sensitive audit data must not expose secrets or unnecessary private data.

Security review should be required for changes that affect identity, organizations, memberships, permissions, or tenant boundaries.

## 20. Reporting And Analytics Considerations

The Central Registry should make reporting across future project domains possible without making domains depend on each other.

Reporting direction:

- Cross-domain reporting should use central identifiers such as `person_id` and `organization_id`.
- Reports must respect tenant and permission boundaries.
- Domain-specific metrics should remain owned by the domain that generates them.
- Shared organization and person dimensions should come from the Central Registry.
- Audit reports should preserve actor, organization, action, and timestamp context where appropriate.
- Analytics should avoid duplicating identity records across domains.

The reporting model should support long-term analysis across LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, and future domains while preserving data ownership.

## 21. Future Scalability Path

The Central Registry should begin practical and modular, aligned with NEWAX Core's modular monolith direction.

Future scalability path:

- Start with clear central tables and strict domain boundaries.
- Keep identifiers stable so connected domains can evolve safely.
- Document domain dependencies and ownership.
- Use events for cross-domain reactions where appropriate.
- Add stronger indexing, caching, background jobs, or read models when evidence shows they are needed.
- Consider service extraction only when operational scale, team structure, or performance requirements justify it.
- Keep future deployment models open, including shared deployments, dedicated client deployments, or hybrid approaches.

The Central Registry should support future growth without forcing premature distributed architecture.

## 22. Implementation Notes

This document defines architecture direction only.

Implementation notes for future planning:

- Do not create database migrations from this document alone.
- Do not create production modules from this document alone.
- Use `core_` prefixes for central registry table planning unless a later architecture decision changes the naming direction.
- Use project prefixes such as `lms_`, `legal_`, and `crm_` for domain-specific tables.
- Use `person_id` when a domain record references a central person.
- Use `organization_id` when a domain record belongs to an organization or tenant.
- Keep public contracts documented before other domains rely on them.
- Prefer APIs, services, or events for cross-domain interaction.
- Update ADRs if registry ownership, tenancy, permissions, or domain dependency rules change.

Future implementation must align with the NEWAX Core Architecture, NEWAX Module Standard, and existing ADRs for modular monolith, permissions, multi-tenancy, customization separation, events, and controlled updates.

## 23. What Must Never Happen

The following practices are not allowed:

- Designing LMS as the center of the NEWAX platform.
- Making the Central Registry depend on LMS tables.
- Making future domains depend directly on LMS tables.
- Storing shared identity data only inside a project domain.
- Duplicating people, users, or organizations across domains without a documented reason.
- Hardcoding roles into business logic.
- Bypassing tenant boundaries through direct table access.
- Allowing one organization to access another organization's records accidentally.
- Placing project-specific business rules inside the Central Registry.
- Modifying reusable core modules directly for client-specific behavior.
- Creating migrations or production modules before architecture and ownership are approved.
- Allowing client customizations to bypass central permissions, tenant safety, or audit requirements.

The Central Registry must remain a stable foundation for NEWAX business infrastructure, not a project-specific database shortcut.
