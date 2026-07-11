# NEWAX Module Registry Standard

## Purpose

Define how NEWAX Core will register, classify, version, track, and manage reusable modules across Foundation, Platform Services, Business Domain Modules, and Client Solutions.

This standard is for internal NEWAX engineering use. It aligns with ADR 0009: Define Module Registry and Dependency Rules.

This document does not create production module code, actual module implementations, database migrations, or a production registry system.

## 1. What The Module Registry Is

The Module Registry is the internal NEWAX record of reusable modules.

It defines which reusable modules exist, how they are classified, who owns them, which version is current, what they depend on, and how they may be safely combined into client systems.

The registry should track module identity, architecture layer, version, status, ownership, dependencies, permissions, events, configuration, database ownership, tenant scope, documentation paths, changelog paths, and compatibility notes.

The registry is a governance and architecture tool for keeping NEWAX Core modular, maintainable, and safe to reuse.

## 2. What The Module Registry Is Not

The Module Registry is not:

- A public marketplace.
- A plugin store.
- A place for random code snippets.
- A replacement for module documentation.
- A replacement for `README.md`, `VERSION`, or `CHANGELOG.md` files.
- A reason to install unnecessary modules into client systems.
- A place for client-specific customizations to become hidden core dependencies.
- A shortcut around module approval, testing, or security review.

A registry entry means a module is tracked. It does not mean the module is automatically approved for production use.

## 3. Why NEWAX Needs A Module Registry

NEWAX Core is expected to grow across foundation services, shared platform capabilities, business domains, and client-facing solutions.

Without a registry, NEWAX risks unclear ownership, undeclared dependencies, duplicate modules, unsafe client installations, circular dependencies, and uncontrolled module growth.

The Module Registry helps NEWAX:

- Maintain a source of truth for reusable modules.
- Protect architecture layer boundaries.
- Track module versions and lifecycle status.
- Make dependency relationships explicit.
- Support controlled client deployments.
- Support future compatibility checks.
- Avoid LMS-specific modules becoming default dependencies for future projects.
- Improve auditability, security review, and upgrade planning.

The registry gives NEWAX long-term control over reusable business infrastructure.

## 4. Module Classification Layers

Every registry entry must classify the module into one architecture layer.

| Layer   | Name                     | Purpose                                                                   |
| ------- | ------------------------ | ------------------------------------------------------------------------- |
| Layer 1 | Foundation Modules       | Core identity, organization, user, role, and permission foundations.      |
| Layer 2 | Platform Service Modules | Shared operational services reused across domains and client solutions.   |
| Layer 3 | Business Domain Modules  | Domain-specific reusable business capabilities.                           |
| Layer 4 | Client Solution Modules  | Composed solutions built from foundation, platform, and business modules. |

Layer classification controls dependency direction and module ownership expectations.

Lower layers must remain independent from higher layers.

## 5. Foundation Modules

Foundation modules provide the base capabilities used by the rest of NEWAX Core.

Examples:

- `authentication`.
- `people`.
- `organizations`.
- `users`.
- `roles`.
- `permissions`.

Rules:

- Foundation modules must be client-neutral.
- Foundation modules must not depend on business domain modules.
- Foundation modules must not depend on client solution modules.
- Foundation modules must be security-focused and carefully reviewed.
- Foundation modules must define permissions, tenant expectations, and audit requirements clearly where applicable.

Foundation modules must remain stable because higher layers depend on them.

## 6. Platform Service Modules

Platform service modules provide shared operational capabilities used across multiple domains or client solutions.

Examples:

- `dashboard`.
- `workflow`.
- `notifications`.
- `documents`.
- `reports`.
- `files`.
- `search`.
- `audit`.
- `integrations`.

Rules:

- Platform service modules may depend on foundation modules.
- Platform service modules should remain domain-neutral where practical.
- Platform service modules must not depend on client solution modules.
- Dependencies on business domain modules require explicit architecture approval.
- Platform service modules should expose documented APIs, services, events, or configuration points.

Platform services should serve domains without becoming tied to one client or one vertical.

## 7. Business Domain Modules

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
- Business domain modules must not depend on client solution modules.
- Business domain modules must declare every required dependency.
- Business domain modules must not silently use another module.
- Business domain modules should not depend on unrelated business domains unless explicitly approved and documented.

Business domain modules must remain reusable within their domain and must not become client-specific.

## 8. Client Solution Modules

Client solution modules compose lower-level modules into usable client-facing solutions or solution editions.

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
- Client solution modules must list included modules and versions.
- Client solution modules must not become hidden dependencies of lower layers.
- Client-specific customizations must remain outside reusable core modules unless promoted through architecture review.

Client solution modules are composition records, not replacements for module ownership.

## 9. Required Module Metadata

Every registry entry should include:

| Field                   | Purpose                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| `module_name`           | Human-readable module name.                                                       |
| `module_key`            | Stable machine-friendly module identifier.                                        |
| `module_layer`          | One of `foundation`, `platform_service`, `business_domain`, or `client_solution`. |
| `module_version`        | Current approved module version.                                                  |
| `module_status`         | Lifecycle status.                                                                 |
| `module_owner`          | Responsible Product, Engineering, Architecture, Security, or module owner.        |
| `description`           | Short description of the module purpose.                                          |
| `dependencies`          | Required module dependencies and version expectations.                            |
| `required_permissions`  | Permissions owned or required by the module.                                      |
| `exposed_events`        | Events published by the module.                                                   |
| `consumed_events`       | Events consumed by the module.                                                    |
| `configuration_options` | Supported configuration keys or categories.                                       |
| `database_ownership`    | Tables, records, or data responsibilities owned by the module.                    |
| `tenant_scope`          | Whether the module is global, tenant-scoped, organization-scoped, or mixed.       |
| `documentation_path`    | Path to module documentation.                                                     |
| `changelog_path`        | Path to the module changelog.                                                     |
| `compatibility_notes`   | Known compatibility constraints, dependency rules, or upgrade notes.              |

Additional metadata may be added later if approved through architecture review.

## 10. Module Naming Rules

Module names and keys must be clear and predictable.

Rules:

- Use clear business names.
- Use lowercase module keys.
- Use hyphen-separated module keys.
- Avoid vague names.
- Avoid generic names such as `misc`, `common`, `stuff`, or `new-feature`.
- Avoid client-specific names inside reusable core modules.
- Use domain prefixes for business domain modules where useful, such as `lms-`, `crm-`, `legal-`, or `healthcare-`.

Good:

```text
lms-students
lms-payments
organizations
permissions
audit
```

Bad:

```text
abc-institute-students
new-feature
misc
common
stuff
```

Names should be stable enough to survive version upgrades and client deployments.

## 11. Module Key Rules

The `module_key` is the stable machine-friendly identifier for a module.

Rules:

- Use lowercase kebab-case.
- Keep module keys stable after approval.
- Do not include client names in reusable core module keys.
- Do not reuse a key for a different module concept.
- Deprecated or archived keys should remain traceable.
- Use domain prefixes for business domain modules where needed.
- Use clear, specific names instead of generic utility names.

Examples:

```text
authentication
organizations
permissions
lms-students
lms-payments
crm-leads
legal-cases
```

Changing a module key is a breaking governance change and requires review.

## 12. Module Version Rules

Modules must use semantic versioning.

Format:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
```

Rules:

- Every reusable module must maintain a `VERSION` file.
- Every reusable module must maintain a `CHANGELOG.md` file.
- `PATCH` updates fix bugs or security issues without changing expected behavior.
- `MINOR` updates add compatible improvements.
- `MAJOR` updates may include breaking changes and require careful migration review.
- Registry version metadata must match the module `VERSION` file when the module is approved for use.
- Breaking changes must be documented in the changelog and compatibility notes.

Module versioning must align with ADR 0006: Use Controlled Updates and Versioning.

## 13. Module Status Rules

Use these status values:

```text
planned
draft
active
deprecated
replaced
archived
```

Status meanings:

- `planned`: The module is intended but not ready for build or reuse.
- `draft`: The module is being designed or developed but is not approved for production reuse.
- `active`: The module is approved for reuse under documented conditions.
- `deprecated`: The module should not be used for new work, but existing usage may remain temporarily.
- `replaced`: Another module supersedes this module.
- `archived`: The module is no longer maintained or intended for use.

Rules:

- Status changes must be reviewed.
- Deprecated modules must identify replacement guidance where possible.
- Replaced modules must identify the replacement module.
- Archived modules must not be installed into new client systems.

Status exists to prevent unclear module lifecycle decisions.

## 14. Dependency Declaration Rules

Every module must declare dependencies.

Rules:

- Foundation modules must not depend on business domain modules.
- Foundation modules must not depend on client solution modules.
- Lower layers must not depend on higher layers.
- Circular dependencies are not allowed.
- A module must not silently use another module without declaring it.
- Client-specific extensions must not become hidden core dependencies.
- Dependency version expectations should be documented where required.
- Dependency changes must be reviewed before production use.

Allowed example:

```text
lms-payments depends on:
- organizations
- people
- users
- permissions
- audit
```

Forbidden example:

```text
authentication depends on lms-students
```

Dependency declarations protect module independence, upgrade safety, and architecture layer boundaries.

## 15. Permission Declaration Rules

Modules must declare permissions they own or require.

Rules:

- Permission names should follow the `module.action` convention.
- Security-sensitive modules must declare required permissions.
- Business logic must check permissions, not hardcoded role names.
- Permissions should include tenant or organization context where required.
- Permission changes must be documented and auditable when security-sensitive.
- Client-specific roles may group permissions without modifying reusable module code.

Examples:

```text
students.view
students.create
payments.approve
reports.export
permissions.manage
```

Permission declarations support security review and client role configuration.

## 16. Event Declaration Rules

Modules must declare events they expose or consume.

Rules:

- Event names should follow the `module.action` convention.
- Exposed events must document when they are published.
- Consumed events must document expected behavior.
- Security-sensitive events must be identified.
- Events must not expose secrets or unnecessary sensitive data.
- Client extensions may listen to approved events without modifying reusable core modules.

Examples:

```text
student.created
payment.approved
report.exported
user.login
permission.changed
```

Event declarations support modular communication and client-safe customization.

## 17. Configuration Declaration Rules

Modules must declare supported configuration options.

Rules:

- Configuration options must be documented.
- Configuration should be used before client-specific code where reasonable.
- Sensitive configuration must be protected.
- Tenant-specific configuration must respect organization boundaries.
- Configuration changes that affect security, access, reporting, or integrations should be auditable.
- Configuration must not become a hidden way to bypass permissions or tenant isolation.

Configuration declarations help client systems customize behavior safely.

## 18. Documentation Requirements

A registry entry does not replace module documentation.

Each reusable module must maintain:

- `README.md`.
- `VERSION`.
- `CHANGELOG.md`.
- Documentation for permissions, events, configuration, database ownership, tenant scope, and dependencies.

Rules:

- `documentation_path` must point to useful module documentation.
- `changelog_path` must point to the module changelog.
- Documentation must explain public contracts and extension points.
- Documentation must identify client customization guidance.
- Documentation must be updated when registry metadata changes.

Registry metadata and module documentation must stay consistent.

## 19. Compatibility Requirements

Modules must document compatibility expectations.

Rules:

- Modules must define compatible dependency versions where required.
- Breaking changes must be documented.
- Major version upgrades require review.
- Permission, event, database, API, and configuration changes must identify compatibility impact.
- Client customizations must not modify reusable core modules directly.
- Compatibility notes must be updated when dependencies or public contracts change.

Compatibility requirements support controlled updates and reduce client deployment risk.

## 20. Client Deployment Manifest Rules

Each client deployment should eventually define installed modules and versions.

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

- Deployment manifests should list installed modules and versions.
- Deployment manifests should list packages where used.
- Deployment manifests should not enable modules with missing dependencies.
- Deployment manifests should support support review, compatibility checks, upgrades, and rollback planning.
- Deployment manifests should be auditable when implementation begins.

Client deployment manifests help NEWAX understand what each client system is running.

## 21. Package Grouping Rules

Where modules are commonly deployed together, NEWAX may define packages.

Example:

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
- Package updates must respect controlled updates and versioning rules.

Packages simplify deployment but do not replace module-level responsibility.

## 22. Approval Checklist Before Registry Entry

Before a module receives an approved registry entry, confirm:

- Module purpose is clear.
- Module key follows naming rules.
- Module layer is correct.
- Module owner is identified.
- Module status is assigned.
- Module version is defined.
- Dependencies are declared.
- Dependency direction follows layer rules.
- No circular dependencies exist.
- Required permissions are declared.
- Exposed and consumed events are declared.
- Configuration options are documented.
- Database ownership is documented.
- Tenant scope is documented.
- Documentation path exists or is planned.
- Changelog path exists or is planned.
- Compatibility notes are documented where needed.
- Client-specific behavior is not hidden inside the reusable module.
- Security-sensitive behavior has been reviewed or flagged for review.

A module should not become `active` until the relevant approval criteria are satisfied.

## 23. What Must Never Happen

The following practices are not allowed:

- Do not allow random modules with no registry entry.
- Do not allow circular module dependencies.
- Do not allow foundation modules to depend on LMS, CRM, Legal, Healthcare, or other business domains.
- Do not install unused modules into client systems by default.
- Do not allow modules to use undeclared dependencies.
- Do not allow client-specific customizations to become hidden core dependencies.
- Do not treat the Module Registry as a public marketplace.
- Do not let LMS become the default dependency for future projects.
- Do not use package grouping to hide module ownership or version differences.
- Do not bypass controlled updates and versioning rules.
- Do not create production module implementations from this standard alone.

The Module Registry exists to protect ownership, control, modularity, dependency safety, versioning, and long-term maintainability.
