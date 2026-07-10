# ADR 0007: Define LMS Centralized Database and Data Ownership Rules

## Purpose

Document how the current NEWAX LMS project will use a centralized operational database while still preserving module-level data ownership, tenant isolation, and future scalability.

This ADR applies to the current LMS project database strategy. It does not make the LMS database model the default for every future NEWAX project.

## 1. Decision Title

ADR 0007: Define LMS Centralized Database and Data Ownership Rules

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being built as a reusable business infrastructure foundation. The first connected project domain is the LMS project.

The LMS project needs one practical operational database for current product delivery. At the same time, NEWAX Core must protect module boundaries, tenant isolation, data ownership, security, auditability, and future compatibility with other project domains.

NEWAX also needs to avoid designing the LMS as the center of the platform. The Central Identity and Organization Registry must remain the shared foundation for people, users, organizations, memberships, roles, permissions, contacts, and audit context.

## 5. Problem

A centralized LMS operational database can simplify initial development and operations, but it can also create long-term risk if table ownership, access rules, tenant boundaries, and cross-module behavior are not clearly defined.

Without clear rules, the LMS database may lead to:

- One module casually modifying another module's tables.
- LMS tables becoming the accidental foundation for future NEWAX projects.
- Duplicate person and organization records.
- Weak tenant isolation between client organizations.
- Hardcoded role checks.
- Reports and exports bypassing permissions.
- NEWAX administrative access without audit visibility.
- Difficult future migration to other deployment models.

NEWAX needs a practical centralized LMS database strategy that still preserves modular ownership and future scalability.

## 6. Decision

For the current LMS project, NEWAX will use one centralized operational LMS database.

This centralized LMS database may store data from all LMS client organizations, including:

- Organizations.
- People.
- Users.
- Students.
- Teachers.
- Accountants.
- Admins.
- Courses.
- Lectures.
- Enrollments.
- Tests.
- Test results.
- Payments.
- Roles.
- Permissions.
- Audit logs.
- System activity.

This centralized model applies only to the LMS project and must not become the default architecture for every future NEWAX project.

Core principle:

Module ownership does not always mean separate physical databases.

It means each module owns its own data responsibilities, tables, migrations, validation rules, access rules, and documentation.

## 7. Reasoning

A centralized operational LMS database is practical for the current stage of NEWAX LMS because it supports simpler development, deployment, reporting, backup, and operational management.

The decision supports:

- Faster initial LMS delivery.
- Lower infrastructure complexity.
- Easier local development and debugging.
- Simpler transaction handling across LMS workflows.
- Practical reporting for LMS clients.
- Centralized tenant-aware access control.
- A clear foundation for future modular evolution.

The centralized database must still respect module ownership. It should be centralized physically, but modular logically.

## 8. Alternatives Considered

### Separate Physical Database Per LMS Module

Each LMS module could own a separate physical database.

This was not selected for the current LMS project because it would add operational complexity before module boundaries, scale requirements, and team ownership justify it.

### Separate Database Per Client Organization

Each LMS client organization could receive its own database.

This can provide strong isolation, but it increases deployment, backup, support, migration, and reporting complexity. It may be considered later for enterprise or regulated clients.

### LMS Tables As The Platform Foundation

The LMS database could become the foundation for future NEWAX projects.

This was not selected because LMS is one connected domain, not the center of NEWAX Core.

### Fully Distributed Services From The Beginning

Each LMS capability could be implemented as a separate service with separate storage.

This was not selected because NEWAX Core starts as a modular monolith and should introduce distributed complexity only when operational scale justifies it.

## 9. What Database Ownership Means

Database ownership means a module is responsible for the data it owns, even when tables live in one centralized database.

Ownership includes:

- Table definitions.
- Migrations.
- Data validation rules.
- Access rules.
- Permission checks.
- Service-layer behavior.
- Documentation.
- Tests when implementation begins.
- Change review for owned tables.

Examples:

- Student module owns student-related records.
- Teacher module owns teacher-related records.
- Payment module owns payment records.
- Test module owns tests and results.
- Course module owns courses, lectures, and enrollments.
- Permission module owns roles and permissions.
- Audit module owns audit logs.

Ownership is logical and contractual. It does not require a separate physical database for each module.

## 10. LMS Centralized Operational Database

The LMS project will use one centralized operational database for the current implementation direction.

The database may contain:

- Central registry tables.
- LMS project domain tables.
- Module-owned LMS tables.
- Tenant-scoped LMS records.
- Audit and system activity records.
- Configuration and permission records where appropriate.

Rules:

- The database is centralized for LMS operations.
- Module ownership remains mandatory.
- Tenant boundaries remain mandatory.
- Cross-module access must use approved APIs, services, or events.
- Reports and exports must respect permissions and organization boundaries.
- Sensitive records must receive stronger access controls.

The centralized LMS database is an operational choice, not permission to create a messy monolith.

## 11. Central Identity And Organization Registry

The LMS database should be designed around a central identity and organization registry.

Shared foundation tables should include:

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

- Shared identity data belongs in the Central Registry.
- Shared organization data belongs in the Central Registry.
- Project-specific LMS business data belongs in the LMS domain.
- LMS tables should reference the Central Registry through `person_id` and `organization_id`.
- Do not create duplicate person records when one person has multiple LMS roles.
- Do not design LMS tables as the foundation for future domains.

The Central Registry is the foundation. LMS is one connected project domain.

## 12. LMS Project Domain Tables

LMS-specific business data should live in LMS project domain tables.

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

Rules:

- LMS profile tables should reference `core_people` through `person_id`.
- Tenant-scoped LMS tables should reference `core_organizations` through `organization_id`.
- LMS domain tables should not become shared identity tables.
- LMS domain tables should be owned by their responsible module.
- Future domains must not directly depend on LMS tables.

Project-specific LMS data belongs in the LMS domain.

## 13. Module-Owned Data Responsibilities

Each LMS module must own and document its data responsibilities.

Examples:

- Student module owns student profiles, student status, and student-specific LMS data.
- Teacher module owns teacher profiles and teacher-specific LMS data.
- Course module owns courses, lectures, and enrollments.
- Test module owns tests, test attempts, and test results.
- Payment module owns payment records, payment state, and payment audit context.
- Permission module owns roles, permissions, and access assignments.
- Audit module owns audit logs and audit event records.

Responsibilities include:

- Maintaining migration files when implementation begins.
- Documenting owned tables.
- Documenting required permissions.
- Documenting cross-module access points.
- Protecting data integrity.
- Defining validation rules.
- Publishing events for important business actions where appropriate.

A centralized database does not remove module ownership.

## 14. Tenant And Organization Boundaries

Every tenant-scoped LMS record must include `organization_id` where appropriate.

Examples:

```text
lms_student_profiles.organization_id
lms_teacher_profiles.organization_id
lms_courses.organization_id
lms_enrollments.organization_id
lms_tests.organization_id
lms_test_results.organization_id
lms_payments.organization_id
```

Rules:

- One client organization must never access another client organization's records.
- Every query must enforce tenant or organization boundaries where required.
- Permissions must be scoped by organization where appropriate.
- Reports must respect organization boundaries unless accessed by authorized NEWAX super admins.
- NEWAX administrative access must be explicit, permission-controlled, and auditable.
- Tenant boundaries must be enforced in services and APIs, not only in UI code.

Tenant isolation failures must be treated as security issues.

## 15. Cross-Module Data Access Rules

Modules must not directly modify another module's internal data.

Good:

```text
Payment module requests student information through a Student service or approved interface.
```

Bad:

```text
Payment module directly modifies student profile records.
```

Good:

```text
Payment module publishes payment.approved event.
```

Bad:

```text
Payment module directly updates unrelated course, student, or result records without an approved interface.
```

Rules:

- Modules may read or modify their own tables through their own services.
- Modules must use approved interfaces for another module's owned data.
- Modules must not rely on another module's private table structure.
- Cross-module behavior should be documented.
- Security-sensitive cross-module actions should be auditable.

Centralized storage must not become unrestricted shared table access.

## 16. API-First And Service-Layer Access

Modules should expose approved APIs, services, or internal interfaces for data access.

Rules:

- Business logic should go through the owning module's service layer.
- Validation should live with the owning module.
- Permission checks should be applied before protected actions.
- Service interfaces should document expected inputs, outputs, and access rules.
- Direct database writes to another module's tables are not allowed unless explicitly approved and documented.
- Reports may use read models or controlled queries, but they must respect permissions and tenant boundaries.

Service-layer access protects module boundaries inside the centralized LMS database.

## 17. Event-Based Synchronization

Events may be used when one module or client extension needs to react to important actions in another module.

Examples:

```text
student.created
student.updated
student.suspended
teacher.created
payment.submitted
payment.approved
payment.rejected
test.created
result.updated
report.exported
user.login
permission.changed
admin.accessed_sensitive_data
```

Rules:

- The owning module should publish events for important business actions where reaction is expected.
- Event listeners must use approved APIs or services when they need additional data.
- Events should not expose secrets or unnecessary sensitive data.
- Security-sensitive events should be logged where appropriate.
- Events must not bypass tenant or permission rules.
- Events should support client customization without modifying reusable core modules directly.

This aligns with ADR 0005: Use Event-Driven Module Communication.

## 18. Database Migration Rules

Each module must store and document its own migrations inside its `database/` folder when implementation begins.

Example:

```text
packages/
  payments/
    database/
      migrations/

packages/
  students/
    database/
      migrations/
```

Rules:

- Migration ownership belongs to the module that owns the tables being changed.
- Migrations must be reviewed for tenant, permission, audit, and rollback impact.
- Shared registry migrations must be treated as foundation changes.
- Cross-module schema changes require coordination with affected module owners.
- Migrations must not silently change another module's owned data.
- Migration files should be documented before production use.

This ADR does not create actual database migrations.

## 19. Reporting And Analytics Considerations

The centralized LMS database can support practical LMS reporting, but reporting must follow security and ownership rules.

Rules:

- Reports must respect organization boundaries.
- Reports must enforce permissions.
- Reports must not expose one organization's data to another organization.
- Payment records and student results require stronger access controls.
- Cross-module reports should use approved read models, services, or documented reporting queries.
- NEWAX super admin reports must be explicit and auditable.
- Analytics should preserve `person_id` and `organization_id` links to the Central Registry.

Reporting convenience must not bypass security or module ownership.

## 20. Audit Logging Requirements

Audit logs should record important actions across the LMS system.

Audit events should include actions such as:

```text
student.created
student.updated
student.suspended
teacher.created
payment.submitted
payment.approved
payment.rejected
test.created
result.updated
report.exported
user.login
permission.changed
admin.accessed_sensitive_data
```

Audit records should preserve:

- Actor.
- Organization context.
- Affected resource.
- Action.
- Timestamp.
- Source module.
- Security sensitivity where appropriate.
- NEWAX administrative context where applicable.

Audit logs must be protected from unauthorized access and modification.

## 21. NEWAX Administrative Access

NEWAX administrative access may be necessary for support, maintenance, security review, and platform operations.

Rules:

- NEWAX super admin access must be explicit.
- NEWAX super admin access must be permission-controlled.
- NEWAX super admin access must be auditable.
- Access to sensitive records must be logged.
- Administrative access must not bypass tenant safety accidentally.
- Administrative actions should include reason or context where appropriate.
- Reports accessed by NEWAX admins must respect permission rules or clearly documented super admin authority.

Administrative access is a high-trust capability and must be treated as a security-sensitive area.

## 22. Security Considerations

Centralized LMS data must be protected with access control.

Security rules:

- Sensitive actions must be logged.
- NEWAX super admin access must be limited and auditable.
- Data exports must be permission-controlled.
- Payment records and student results must receive stronger access controls.
- Sensitive personal data should be minimized where possible.
- Backups must be encrypted or access-controlled.
- Restore processes must be tested.
- Tenant boundaries must be enforced for every tenant-scoped query.
- Permissions must not be bypassed in reports, exports, background jobs, or administrative tools.
- Role names must not be hardcoded into business logic.

Security review should be required for changes that affect tenant isolation, payments, student results, permissions, exports, or administrative access.

## 23. Scalability Considerations

The centralized LMS database is practical for the current LMS stage, but it must not block future scale.

Scalability direction:

- Start with one centralized LMS operational database.
- Keep module ownership clear so modules can evolve independently.
- Use stable identifiers such as `person_id` and `organization_id`.
- Monitor query performance, data growth, and tenant-specific load.
- Add indexes, read models, queues, background jobs, or caching when evidence shows they are needed.
- Consider dedicated databases, hybrid models, or service extraction only when scale, performance, compliance, or client requirements justify it.

The architecture should allow NEWAX to evolve without premature distributed-system complexity.

## 24. Maintenance Considerations

The centralized LMS database must remain maintainable through clear ownership and documentation.

Maintenance rules:

- Each module should document owned tables and migrations.
- Each module should document validation and access rules.
- Cross-module dependencies should be documented.
- Table changes should be reviewed with affected module owners.
- Reports should document sensitive data usage.
- Audit-sensitive actions should remain traceable.
- Client-specific behavior should remain outside reusable core modules.
- Changelogs should document schema, permission, event, and reporting changes when implementation begins.

Centralized operations require discipline so the database does not become unclear over time.

## 25. Future Project Compatibility

The LMS centralized database model is project-specific.

Future NEWAX projects may use:

- Dedicated client database.
- Shared centralized database.
- Hybrid database model.
- On-premise deployment.
- Private enterprise deployment.
- Separate domain databases connected to the Central Registry.

Rules:

- Future domains must not directly depend on LMS tables.
- Shared identity data belongs in the Central Registry.
- Project-specific business data belongs in that project domain.
- Future domains such as CRM, Legal, Healthcare, Finance, HR, Real Estate, and Hospitality should be able to connect to the same Central Registry without depending on LMS tables.
- LMS architecture must not block future domain ownership or deployment models.

The LMS project should prove reusable foundation patterns, not become the entire NEWAX platform.

## 26. What Must Never Happen

The following practices are not allowed:

- Do not make LMS tables the foundation for all future projects.
- Do not allow one client organization to access another organization's data.
- Do not allow modules to casually modify each other's tables.
- Do not centralize sensitive data without clear contract, privacy, and security rules.
- Do not allow NEWAX super admin access without audit logs.
- Do not create duplicate person records when one person has multiple roles.
- Do not hardcode access by role name.
- Do not bypass permission checks in reports or exports.
- Do not let centralized storage erase module ownership.
- Do not create migrations or production modules from this ADR alone.
- Do not make future domains depend directly on LMS tables.
- Do not bypass tenant boundaries through direct database access.

These rules protect NEWAX ownership, control, tenant safety, security, modularity, and long-term scalability.

## 27. Impact On NEWAX Core

NEWAX Core must support centralized LMS operations while preserving reusable platform boundaries.

Impact:

- Central Registry architecture becomes foundational for LMS identity and organization design.
- Module standards must apply even when modules share one database.
- Permission-based access control remains mandatory.
- Tenant isolation must be enforced through `organization_id` where appropriate.
- Events should be used for important cross-module reactions.
- Future domains must remain independent from LMS tables.
- Database ownership must be documented at the module level.

This decision reinforces NEWAX Core as reusable business infrastructure rather than an LMS-only system.

## 28. Impact On LMS Client Systems

LMS client systems can use one centralized operational database while remaining tenant-isolated and permission-controlled.

Impact:

- Multiple LMS client organizations may exist in the same operational database.
- Client data must be separated by organization boundaries.
- Client reports must respect organization scope and permissions.
- Client-specific customizations must not modify reusable core modules directly.
- Payment records, student results, and sensitive personal data need stronger controls.
- NEWAX support and administrative actions must be explicit and auditable.
- Future deployment options remain open when client requirements change.

This gives LMS clients practical delivery while protecting security and future growth.

## 29. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Central Identity and Organization Registry Architecture](../architecture/central-registry-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [ADR 0002: Use Permission-Based Access Control](./0002-use-permission-based-access-control.md)
- [ADR 0003: Design for Multi-Tenancy](./0003-design-for-multi-tenancy.md)
- [ADR 0004: Separate Client Customizations from Core Modules](./0004-separate-client-customizations-from-core.md)
- [ADR 0005: Use Event-Driven Module Communication](./0005-use-event-driven-module-communication.md)
- [ADR 0006: Use Controlled Updates and Versioning](./0006-use-controlled-updates-and-versioning.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 30. Approved By

Initial architecture direction approved for NEWAX Core and LMS foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, Security, Support, or leadership ownership is assigned.
