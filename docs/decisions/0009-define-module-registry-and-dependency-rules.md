# ADR 0009: Define Module Registry and Dependency Rules

## Purpose

Document how NEWAX Core will identify, classify, version, register, and manage dependencies between reusable modules.

This ADR defines the architecture direction for an internal Module Registry. It does not create an actual module registry file, implementation code, or production modules.

## 1. Decision Title

ADR 0009: Define Module Registry and Dependency Rules

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being built as a reusable business infrastructure foundation made of foundation modules, platform service modules, business domain modules, and client solution modules.

As NEWAX grows, more modules will be planned, drafted, activated, deprecated, replaced, or archived. Client systems may combine different module versions and packages depending on their business needs, support plans, and deployment timing.

Without a formal registry and dependency model, modules may become difficult to classify, install, upgrade, secure, and compose safely.

## 5. Problem

NEWAX Core needs a clear source of truth for reusable modules and their relationships.

Without a Module Registry, NEWAX may face:

- Random modules with unclear ownership.
- Undeclared dependencies between modules.
- Circular dependencies.
- Foundation modules depending on business domains.
- LMS-specific modules becoming accidental defaults for future projects.
- Unused modules installed into client systems.
- Client customizations becoming hidden core dependencies.
- Unclear version compatibility.
- Unsafe upgrades.
- Weak auditability of installed client modules.

NEWAX needs a practical module registry and dependency policy that protects modularity, versioning, security, and long-term maintainability.

## 6. Decision

NEWAX Core will use a formal Module Registry to track every reusable module, its layer, version, dependencies, status, ownership, and compatibility rules.

The Module Registry will become the internal source of truth for which modules exist and how they may be combined into client systems.

The registry should define:

- Module identity.
- Module classification layer.
- Module version.
- Module status.
- Module owner.
- Declared dependencies.
- Required permissions.
- Exposed and consumed events.
- Configuration options.
- Compatibility notes.
- Documentation path.

This ADR defines the registry rules only. It does not create the registry file or implementation.

## 7. Reasoning

A formal Module Registry gives NEWAX control over reusable module growth.

This decision supports:

- Clear module ownership.
- Safe dependency management.
- Better version tracking.
- Better client deployment planning.
- Stronger security review.
- Cleaner package grouping.
- Easier upgrade and compatibility checks.
- Prevention of accidental LMS-centered architecture.
- Long-term scalability as NEWAX adds more domains and client solutions.

The registry helps keep NEWAX Core modular instead of becoming a collection of loosely related folders.

## 8. Alternatives Considered

### No Formal Registry

Modules could be discovered from folders, README files, or developer knowledge.

This was not selected because NEWAX needs explicit ownership, compatibility, dependency, security, and installation tracking as the platform grows.

### Public Marketplace Model

NEWAX could treat modules like public marketplace plugins.

This was not selected because the Module Registry is an internal engineering and architecture control mechanism, not a public marketplace.

### Client-Specific Module Lists Only

Each client system could define its own installed modules without a central NEWAX module registry.

This was not selected because NEWAX still needs a master internal source of truth for reusable modules and compatibility rules.

### Hardcoded Dependencies In Implementation

Modules could declare dependencies only through future code imports or package dependencies.

This was not selected because architecture dependency rules must be documented and reviewed before implementation details create hidden coupling.

## 9. What The Module Registry Is

The Module Registry is an internal NEWAX record of reusable modules.

It should define:

```text
module_name
module_key
module_layer
module_version
module_status
module_owner
dependencies
required_permissions
exposed_events
consumed_events
configuration_options
compatibility_notes
documentation_path
```

The Module Registry should help NEWAX answer:

- Which modules exist?
- Which layer does each module belong to?
- Who owns each module?
- Which version is current?
- Which dependencies are required?
- Which permissions are required?
- Which events are exposed or consumed?
- Which modules can be installed together?
- Which modules are approved for client deployments?

The registry should become a practical governance tool for reusable module composition.

## 10. What The Module Registry Is Not

The Module Registry is not:

- A public marketplace.
- A plugin store.
- A place for random code snippets.
- A replacement for module documentation.
- A reason to install unnecessary modules into client systems.
- A way to bypass module review.
- A place for client-specific customizations to become hidden core dependencies.

A registry entry confirms that a module is known and tracked. It does not remove the need for README files, standards, changelogs, version files, tests, security review, or architecture review.

## 11. Module Classification Layers

Modules must be classified into architecture layers.

Layer model:

| Layer | Name | Purpose |
| --- | --- | --- |
| Layer 1 | Foundation Modules | Identity, people, organization, user, role, and permission foundations. |
| Layer 2 | Platform Service Modules | Shared operational services used across domains and client solutions. |
| Layer 3 | Business Domain Modules | Domain-specific reusable business capabilities. |
| Layer 4 | Client Solution Modules | Composed client-facing solutions built from reusable modules. |

Lower layers must remain more stable and more independent than higher layers.

## 12. Foundation Modules

Foundation modules provide the core platform base used by higher layers.

Examples:

- Authentication.
- People.
- Organizations.
- Users.
- Roles.
- Permissions.

Rules:

- Foundation modules must be client-neutral.
- Foundation modules must be highly stable.
- Foundation modules must not depend on business domain modules.
- Foundation modules must not depend on client solution modules.
- Foundation modules may provide services used by platform, business, and client solution modules.
- Security review is especially important for foundation modules.

Foundation modules protect the identity, organization, user, role, and permission base of NEWAX Core.

## 13. Platform Service Modules

Platform service modules provide shared operational capabilities reused across business domains and client solutions.

Examples:

- Dashboard.
- Workflow.
- Notifications.
- Documents.
- Reports.
- Files.
- Search.
- Audit.
- Integrations.

Rules:

- Platform service modules may depend on foundation modules.
- Platform service modules should remain domain-neutral where possible.
- Platform service modules must not depend on client solution modules.
- Platform service modules should not depend on business domain modules unless explicitly approved and documented.
- Platform services should expose approved APIs, services, events, or configuration points.

Platform services should help business modules without becoming tied to one business domain.

## 14. Business Domain Modules

Business domain modules provide reusable capabilities for a specific business domain or vertical.

Examples:

- `lms-students`.
- `lms-teachers`.
- `lms-courses`.
- `lms-payments`.
- `crm-leads`.
- `legal-cases`.
- `healthcare-appointments`.
- `finance-invoices`.

Rules:

- Business domain modules may depend on foundation modules.
- Business domain modules may depend on approved platform service modules.
- Business domain modules must declare every required dependency.
- Business domain modules must not silently use another module.
- Business domain modules must not depend on client solution modules.
- Domain modules should avoid direct dependencies on unrelated business domains unless explicitly approved and documented.

Business modules should remain reusable within their domain without becoming client-specific.

## 15. Client Solution Modules

Client solution modules compose lower-level modules into client-facing systems or solution editions.

Examples:

- `lms-foundation-edition`.
- `school-management-system`.
- `clinic-system`.
- `legal-case-system`.
- `crm-portal`.
- `operations-dashboard`.

Rules:

- Client solution modules may depend on foundation modules.
- Client solution modules may depend on platform service modules.
- Client solution modules may depend on business domain modules.
- Client solution modules must declare installed modules and expected versions.
- Client solution modules must not become hidden dependencies of lower layers.
- Client-specific customizations must remain outside reusable core modules unless promoted through architecture review.

Client solution modules are composition layers, not replacements for reusable module ownership.

## 16. Module Metadata

Every registry entry should include practical metadata.

Required metadata should include:

| Field | Purpose |
| --- | --- |
| `module_name` | Human-readable module name. |
| `module_key` | Stable machine-friendly identifier. |
| `module_layer` | Architecture layer classification. |
| `module_version` | Current module version. |
| `module_status` | Lifecycle status. |
| `module_owner` | Responsible Product, Engineering, Architecture, or module owner. |
| `dependencies` | Required module dependencies and version constraints where needed. |
| `required_permissions` | Permissions required or owned by the module. |
| `exposed_events` | Events published by the module. |
| `consumed_events` | Events listened to by the module. |
| `configuration_options` | Supported configuration points. |
| `compatibility_notes` | Known compatibility constraints or upgrade notes. |
| `documentation_path` | Path to module documentation. |

Module status values:

```text
planned
draft
active
deprecated
replaced
archived
```

Metadata must be maintained as modules evolve.

## 17. Module Dependency Rules

Every module must declare its dependencies explicitly.

Rules:

- A module must declare every required dependency.
- A module must not silently use another module without declaring it.
- Dependencies must follow the layer model.
- Lower layers must not depend on higher layers.
- Circular dependencies are not allowed.
- Dependencies on sensitive modules should be reviewed carefully.
- Dependency changes must be documented and reviewed before production use.
- Client-specific customizations must not become hidden dependencies of reusable core modules.

Dependency rules protect module independence and upgrade safety.

## 18. Allowed Dependencies

Allowed dependencies follow the layer direction from lower layers to higher composition.

Allowed rules:

- Platform service modules may depend on foundation modules.
- Business domain modules may depend on foundation modules.
- Business domain modules may depend on approved platform service modules.
- Client solution modules may depend on foundation modules.
- Client solution modules may depend on platform service modules.
- Client solution modules may depend on business domain modules.

Allowed example:

```text
lms-payments depends on:
- organizations
- people
- users
- permissions
- audit
```

Reason:

`lms-payments` is a business domain module that needs foundation identity, organization, user, permission, and audit capabilities.

## 19. Forbidden Dependencies

Forbidden dependencies violate layer direction or create unsafe coupling.

Forbidden rules:

- Foundation modules must not depend on business domain modules.
- Foundation modules must not depend on client solution modules.
- Platform service modules must not depend on client solution modules.
- Lower layers must not depend on higher layers.
- Circular dependencies are not allowed.
- Modules must not depend on undeclared dependencies.
- Client-specific customizations must not become hidden core dependencies.
- Future domains must not depend on LMS-specific modules by default.

Forbidden example:

```text
authentication depends on lms-students
```

Reason:

Authentication is a foundation module and must remain independent from LMS-specific business logic.

## 20. Version Tracking

The Module Registry must track module versions.

Rules:

- Every reusable module must have a `VERSION` file.
- Every reusable module must have a `CHANGELOG.md` file.
- The registry should identify the current approved version of each module.
- The registry should support version compatibility notes where required.
- Breaking changes must be documented.
- Major version upgrades require review.
- Module updates must respect ADR 0006 controlled updates and versioning.

Version tracking allows NEWAX to support multiple client systems without forcing every client to run the latest version immediately.

## 21. Module Installation Rules

Modules should be installed into client systems intentionally.

Rules:

- Client systems should install only required modules.
- Modules must not be installed by default only because they exist.
- Required dependencies must be installed before or with the dependent module.
- Client deployment manifests must not enable modules without required dependencies.
- Security-sensitive modules require review before installation.
- Installation history should be auditable when implementation begins.
- Client-specific customizations must not modify reusable core modules directly.

Installation should be controlled, documented, and traceable.

## 22. Module Compatibility Rules

Modules must define compatibility expectations when they depend on other modules.

Rules:

- Modules must define compatible dependency versions where required.
- Breaking changes must be documented.
- Major version upgrades require review.
- Permission, event, database, API, and configuration changes must identify compatibility impact.
- Client customizations must not modify reusable core modules directly.
- Module updates must respect controlled updates and versioning rules.
- Compatibility checks should be part of future update tooling.

Compatibility rules protect client systems from unsafe module combinations.

## 23. Package Grouping Rules

Where modules are commonly deployed together, NEWAX may define packages.

Example package:

```text
LMS Foundation Package v1.0.0
- authentication
- people
- organizations
- users
- roles
- permissions
- lms-students
- lms-teachers
- lms-courses
- lms-lectures
- lms-tests
- lms-payments
- reports
- audit
```

Rules:

- Packages must list included modules and versions.
- Packages must document dependency assumptions.
- Packages must document compatibility notes.
- Packages must not hide module-level ownership.
- Packages must not include unused modules by default.
- Package updates must respect ADR 0006 controlled updates and versioning.

Package grouping should simplify deployment without weakening module boundaries.

## 24. Client Deployment Manifests

Each client deployment should eventually define which modules are installed.

Example:

```text
client: ABC Institute
solution: LMS Foundation Edition
modules:
- authentication: 1.0.0
- people: 1.0.0
- organizations: 1.0.0
- users: 1.0.0
- roles: 1.0.0
- permissions: 1.0.0
- lms-students: 1.0.0
- lms-teachers: 1.0.0
- lms-courses: 1.0.0
- lms-payments: 1.0.0
- lms-tests: 1.0.0
- reports: 1.0.0
- audit: 1.0.0
```

Rules:

- Deployment manifests should identify installed module versions.
- Deployment manifests should identify packages where used.
- Deployment manifests should be traceable for support and audit.
- Deployment manifests should not enable undeclared dependencies.
- Deployment manifests should support controlled updates and rollback planning.

Client deployment manifests will help NEWAX understand what each client system is running.

## 25. Security Considerations

The Module Registry must support secure module composition.

Security rules:

- Security-sensitive modules must declare required permissions.
- Modules that expose sensitive events must document them.
- Modules that access tenant-scoped data must declare tenant boundary expectations.
- Client deployment manifests must not enable modules without required dependencies.
- Module installation and upgrade history should be auditable.
- Modules that access identity, permissions, payments, reports, audit logs, or sensitive data require careful review.
- Client-specific customizations must not bypass module security rules.

The registry should make security-sensitive dependencies visible before modules are installed or upgraded.

## 26. Scalability Considerations

The Module Registry should help NEWAX scale module ownership and client deployments over time.

Scalability direction:

- Start with a practical internal registry model.
- Keep module identity and metadata stable.
- Support future packages and deployment manifests.
- Support future compatibility checks.
- Support future update tooling.
- Keep layer rules clear as more domains are added.
- Avoid making LMS the default dependency for future projects.

The registry should support growth without forcing premature marketplace or plugin-store complexity.

## 27. Maintenance Considerations

The Module Registry requires ongoing maintenance discipline.

Maintenance rules:

- Registry entries must be updated when module status changes.
- Dependency changes must be reviewed.
- Version changes must align with changelogs.
- Deprecated, replaced, and archived modules must be documented.
- Documentation paths must remain accurate.
- Module owners must be clear.
- Client deployment manifests should be updated when installed modules change.
- Package definitions should be reviewed when included modules change.

A stale registry is dangerous because it gives false confidence about module safety and compatibility.

## 28. Impact On NEWAX Core

NEWAX Core must treat module registration and dependency declaration as part of reusable module quality.

Impact:

- Reusable modules must have registry entries before being approved for production use.
- Modules must declare their layer and dependencies.
- Module dependencies must follow architecture layer rules.
- Module versioning must align with ADR 0006.
- Module events, permissions, configuration, and compatibility notes must be visible.
- Packages and client solution modules must define included modules clearly.
- Future update tooling may use registry metadata for compatibility checks.

This improves ownership, control, modularity, scalability, dependency safety, versioning, and maintainability.

## 29. Impact On Client Systems

Client systems should be composed from registered, versioned, compatible modules.

Impact:

- Client deployments should identify installed modules and versions.
- Client systems should not receive unused modules by default.
- Client systems should not install modules with missing dependencies.
- Client customizations must remain outside reusable core modules.
- Client upgrades should use compatibility and version information from the registry.
- Support teams can more easily understand what each client system is running.

The registry helps client systems remain stable, auditable, and easier to maintain.

## 30. What Must Never Happen

The following practices are not allowed:

- Do not allow random modules with no registry entry.
- Do not allow circular module dependencies.
- Do not allow foundation modules to depend on LMS, CRM, Legal, Healthcare, or other business domains.
- Do not install unused modules into client systems by default.
- Do not allow modules to use undeclared dependencies.
- Do not allow client-specific customizations to become hidden core dependencies.
- Do not treat the Module Registry as a public marketplace.
- Do not let the LMS become the default dependency for future projects.
- Do not use package grouping to hide module ownership or version differences.
- Do not bypass controlled updates and versioning rules.

These rules protect NEWAX Core from hidden coupling and unsafe module composition.

## 31. Related Documents

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
- [ADR 0008: Use Central Identity and Organization Registry](./0008-use-central-identity-and-organization-registry.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 32. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, Security, Support, or leadership ownership is assigned.
