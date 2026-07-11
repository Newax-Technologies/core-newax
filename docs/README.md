# NEWAX Core Documentation

## Purpose

This directory contains the internal architecture, engineering standards, architecture decision records, governance rules, and reference templates for NEWAX Core.

NEWAX Core is the private reusable foundation for the systems NEWAX builds as **The Business Infrastructure Company**. Its documentation protects clear ownership, controlled evolution, tenant safety, dependable delivery, and long-term maintainability.

No production code belongs in this directory.

## Documentation Status

The foundational architecture and engineering governance documentation is established.

Current maturity:

- Architecture model documented.
- Central Identity and Organization Registry documented.
- Architecture decisions 0001 through 0010 recorded.
- Core engineering standards documented.
- Module approval requirements documented.
- Initial Module Registry created in draft status.
- Reference templates created for standards and review workflows.
- Individual module implementation documentation remains incomplete.
- All registered modules remain `planned` until implementation and formal approval.

A documented module is not automatically an approved module. Reuse requires the Module Approval Checklist, required tests, security review, versioning, changelog maintenance, and an updated Module Registry entry.

## Start Here

New contributors should review the documentation in this order:

1. [Core Architecture](architecture/core-architecture.md)
2. [Central Registry Architecture](architecture/central-registry-architecture.md)
3. [Architecture Decision Records](decisions/README.md)
4. [Module Standard](standards/module-standard.md)
5. [Module Registry Standard](standards/module-registry-standard.md)
6. [Security Baseline Standard](standards/security-baseline-standard.md)
7. [Data Model Naming Standard](standards/data-model-naming-standard.md)
8. [API Design Standard](standards/api-design-standard.md)
9. [Testing Standard](standards/testing-standard.md)
10. [Documentation Standard](standards/documentation-standard.md)
11. [Module Approval Checklist](standards/module-approval-checklist.md)
12. [Initial Module Registry](../registry/module-registry.json)

## Architecture

Architecture documents describe how NEWAX Core is structured and how its main foundations relate.

| Document                                                                       | Purpose                                                                                                                                  |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [Architecture Index](architecture/README.md)                                   | Entry point for architecture documentation.                                                                                              |
| [Core Architecture](architecture/core-architecture.md)                         | Defines the layered NEWAX Core architecture and modular-monolith-first direction.                                                        |
| [Central Registry Architecture](architecture/central-registry-architecture.md) | Defines the shared People, Organizations, Users, Memberships, Roles, Permissions, Contacts, and Audit foundation used by future domains. |

## Architecture Decision Records

Architecture Decision Records explain major technical decisions, their context, consequences, and constraints.

| ADR                                                                              | Decision                                                                     |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [ADR 0001](decisions/0001-use-modular-monolith-first.md)                         | Use a modular monolith first.                                                |
| [ADR 0002](decisions/0002-use-permission-based-access-control.md)                | Use permission-based access control instead of hardcoded role authorization. |
| [ADR 0003](decisions/0003-design-for-multi-tenancy.md)                           | Design for multi-tenancy and organization-scoped data boundaries.            |
| [ADR 0004](decisions/0004-separate-client-customizations-from-core.md)           | Separate client customizations from reusable core modules.                   |
| [ADR 0005](decisions/0005-use-event-driven-module-communication.md)              | Use documented events for suitable cross-module communication.               |
| [ADR 0006](decisions/0006-use-controlled-updates-and-versioning.md)              | Use controlled updates and semantic versioning.                              |
| [ADR 0007](decisions/0007-define-lms-centralized-database-and-data-ownership.md) | Define the LMS centralized database and module data-ownership model.         |
| [ADR 0008](decisions/0008-use-central-identity-and-organization-registry.md)     | Use a Central Identity and Organization Registry across future domains.      |
| [ADR 0009](decisions/0009-define-module-registry-and-dependency-rules.md)        | Define the Module Registry and dependency rules.                             |
| [ADR 0010](decisions/0010-define-authentication-and-user-identity-strategy.md)   | Separate authentication, person identity, user accounts, and authorization.  |

Additional resources:

- [ADR Index](decisions/README.md)
- [ADR Template](decisions/ADR-TEMPLATE.md)

## Engineering Standards

Standards define the minimum expectations for reusable NEWAX modules, packages, APIs, environments, client deployments, security, testing, and documentation.

| Standard                                                                                | Purpose                                                                                                                          |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Module Standard](standards/module-standard.md)                                         | Defines the required structure and responsibilities of reusable modules.                                                         |
| [Module Registry Standard](standards/module-registry-standard.md)                       | Defines module metadata, lifecycle, dependency, ownership, and registration rules.                                               |
| [Client Deployment Manifest Standard](standards/client-deployment-manifest-standard.md) | Defines how installed modules, versions, packages, extensions, environments, and update policies are tracked for client systems. |
| [Package Standard](standards/package-standard.md)                                       | Defines how modules are grouped into controlled packages and solution editions.                                                  |
| [Environment Standard](standards/environment-standard.md)                               | Defines local, development, staging, and production environment expectations.                                                    |
| [Security Baseline Standard](standards/security-baseline-standard.md)                   | Defines minimum authentication, permission, tenant, data, audit, secret, file, backup, and production security rules.            |
| [Data Model Naming Standard](standards/data-model-naming-standard.md)                   | Defines database table, column, key, timestamp, tenant, audit, and domain naming rules.                                          |
| [API Design Standard](standards/api-design-standard.md)                                 | Defines endpoint, request, response, validation, pagination, authorization, tenancy, and versioning rules.                       |
| [Testing Standard](standards/testing-standard.md)                                       | Defines unit, integration, API, permission, tenant-isolation, security, acceptance, and release testing requirements.            |
| [Documentation Standard](standards/documentation-standard.md)                           | Defines documentation requirements for modules, APIs, permissions, events, configuration, databases, packages, and deployments.  |
| [Module Approval Checklist](standards/module-approval-checklist.md)                     | Defines the quality gate required before a module may move from `draft` to `active`.                                             |

## Registries

The operational registry is stored outside the documentation directory because it is structured governance data rather than narrative documentation.

| Registry                                                  | Status  | Purpose                                                                                                                                                |
| --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [NEWAX Module Registry](../registry/module-registry.json) | `draft` | Tracks planned modules, layers, versions, dependencies, permissions, events, configuration, database ownership, tenant scope, and documentation paths. |

Registry rules:

- A registry entry does not prove implementation.
- A `planned` or `draft` module must not be presented as reusable production infrastructure.
- Only an approved module may move to `active`.
- Registry metadata must match module documentation, `VERSION`, and `CHANGELOG.md` files.
- Client deployment manifests may reference only declared and compatible modules.

## Reference Templates

Templates provide approved starting structures. They are examples, not production implementations or automatic approvals.

| Template                                                                                                              | Purpose                                                                      |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Module Template](../templates/module-template/README.md)                                                             | Starting structure for reusable modules.                                     |
| [Module Registry Example](../templates/module-registry/module-registry.example.json)                                  | Example module-registry metadata.                                            |
| [Client Deployment Manifest Example](../templates/client-deployment-manifest/client-deployment-manifest.example.json) | Example client deployment composition and version record.                    |
| [Package Example](../templates/package/package.example.json)                                                          | Example package definition.                                                  |
| [Environment Example](../templates/environment/environment.example.md)                                                | Example environment documentation.                                           |
| [Security Review Checklist Example](../templates/security/security-review-checklist.example.md)                       | Example security review checklist.                                           |
| [Data Model Naming Example](../templates/data-model/data-model-naming.example.md)                                     | Good and bad database naming examples.                                       |
| [API Design Example](../templates/api/api-design.example.md)                                                          | Example endpoints, responses, errors, permissions, and tenant-safe behavior. |
| [Module Testing Checklist Example](../templates/testing/module-testing-checklist.example.md)                          | Example module release-testing checklist.                                    |
| [Module README Example](../templates/documentation/module-readme.example.md)                                          | Example complete module README for `lms-students`.                           |
| [Module Approval Example](../templates/approval/module-approval-checklist.example.md)                                 | Example completed approval review for `lms-students`.                        |

## Architecture Layers

NEWAX Core uses four controlled layers:

### 1. Foundation Modules

Shared identity, organization, user, role, permission, and access foundations.

Examples:

- People
- Organizations
- Memberships
- Users
- Authentication
- Roles
- Permissions
- Contacts

### 2. Platform Service Modules

Shared operational services that support multiple domains.

Examples:

- Audit
- Files
- Notifications
- Dashboard
- Reports
- Workflow
- Search
- Integrations

### 3. Business Domain Modules

Reusable capabilities for defined business domains.

Examples:

- LMS Students
- LMS Teachers
- LMS Courses
- LMS Lectures
- LMS Enrollments
- LMS Tests
- LMS Test Results
- LMS Payments
- Future CRM, Legal, Healthcare, Finance, HR, Real Estate, Retail, and Hospitality modules

### 4. Client Solutions

Approved compositions of lower-layer modules, packages, configurations, and client extensions.

Client solutions must not become dependencies of lower architectural layers.

## Central Registry Principle

The Central Identity and Organization Registry is the foundation. The LMS is one connected business domain, not the center of the platform.

Shared identity and organization concepts belong to the Central Registry:

- Organizations
- People
- Users
- Memberships
- Roles
- Permissions
- Contacts
- Audit context

Domain modules reference shared records through stable identifiers such as `person_id`, `organization_id`, and `user_id` where appropriate.

Future domains must not depend on LMS tables to identify people, users, organizations, roles, or permissions.

## Module Lifecycle

Every registered module follows this lifecycle:

```text
planned -> draft -> active -> deprecated -> replaced or archived
```

Meaning:

- `planned`: Proposed and tracked, but not being represented as reusable.
- `draft`: Under design, implementation, documentation, or testing.
- `active`: Approved for controlled reuse.
- `deprecated`: Maintained temporarily but not selected for new deployments.
- `replaced`: Superseded by another module or version.
- `archived`: No longer maintained or approved for deployment.

Status changes require review and registry updates.

## Documentation Requirements for Every Module

Before a module may become `active`, it must have:

```text
README.md
VERSION
CHANGELOG.md
```

Its documentation must also cover:

- Purpose and business capability
- Scope and exclusions
- Architectural layer
- Dependencies
- Permissions
- Exposed and consumed events
- Configuration options
- Database ownership
- Tenant scope
- API behavior where applicable
- Testing expectations
- Security considerations
- Client extension guidance
- Maintenance ownership
- Compatibility and upgrade notes

## Change Rules

Documentation must be updated in the same feature change when behavior affects:

- Public APIs
- Permissions
- Events
- Configuration
- Database ownership
- Tenant boundaries
- Security behavior
- Package composition
- Deployment compatibility
- Module version or lifecycle status

Architecture changes that alter established decisions should create or supersede an ADR rather than silently rewriting history.

## Current Documentation Gaps

The following work remains before documentation can be considered complete at module level:

- Create complete documentation for every registered module.
- Add matching `VERSION` and `CHANGELOG.md` files for every module.
- Verify every registry documentation path exists.
- Verify dependency declarations and version ranges.
- Validate permission and event naming consistency.
- Validate table ownership and tenant scope.
- Confirm no circular dependencies exist.
- Complete implementation-specific API, security, testing, and maintenance notes as modules are built.

## Ownership

This documentation is owned by NEWAX Product, Engineering, Architecture, and Security according to subject matter.

The long-term objective is straightforward: NEWAX should be able to understand, operate, support, extend, and upgrade its infrastructure without depending on undocumented memory, client-specific improvisation, or one engineer's private interpretation of the system.
