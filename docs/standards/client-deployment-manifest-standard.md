# NEWAX Client Deployment Manifest Standard

## Purpose

Define how NEWAX will document, track, and manage which modules, versions, packages, configurations, and client-specific extensions are installed for each client system.

This standard is for internal NEWAX engineering use. It aligns with ADR 0006: Use Controlled Updates and Versioning, ADR 0007: Define LMS Centralized Database and Data Ownership Rules, and ADR 0009: Define Module Registry and Dependency Rules.

This document defines a standard and example template only. It does not create production module code, actual module implementations, database migrations, or an update service.

## 1. What A Client Deployment Manifest Is

A Client Deployment Manifest is the official NEWAX record of what is installed, configured, supported, and approved for a specific client system.

It identifies the client, solution, deployment environment, installed modules, installed packages, module versions, client extensions, database model, tenant scope, support plan, update policy, approval status, and change history.

The manifest should allow NEWAX Product, Engineering, Support, and Operations to understand exactly what a client system is running without guessing from code, deployment notes, or informal messages.

## 2. What A Client Deployment Manifest Is Not

A Client Deployment Manifest is not:

- A production module implementation.
- A database migration.
- A replacement for the Module Registry.
- A replacement for module documentation.
- A place to hide client-specific behavior.
- A public client contract by default.
- A reason to install unnecessary modules.
- A shortcut around testing, approval, security review, or controlled updates.

The manifest describes an installed client system. It does not define reusable module architecture by itself.

## 3. Why NEWAX Needs Deployment Manifests

NEWAX Core will support reusable modules, packages, client-specific extensions, and different deployment models over time.

Without deployment manifests, NEWAX risks losing track of which client runs which module versions, which extensions are installed, which dependencies are active, which database model is used, and whether an update is safe.

Deployment manifests help NEWAX:

- Track installed modules and exact versions.
- Track installed packages and package versions.
- Keep client-specific extensions visible.
- Support controlled updates and rollback planning.
- Identify security-sensitive modules.
- Understand tenant and organization scope.
- Improve support readiness.
- Prevent hidden customizations inside reusable core modules.
- Maintain long-term client system accountability.

Every client deployment must have a manifest before it is treated as a managed NEWAX system.

## 4. Required Manifest Fields

Every client deployment manifest should include:

| Field | Purpose |
| --- | --- |
| `client_name` | Human-readable client name. |
| `client_key` | Stable machine-friendly client identifier. |
| `organization_id` | Central Registry organization identifier for the client where available. |
| `solution_name` | Human-readable solution name. |
| `solution_key` | Stable solution identifier. |
| `deployment_environment` | Environment where the manifest applies. |
| `deployment_status` | Current lifecycle status of the deployment. |
| `support_plan` | Support level assigned to the deployment. |
| `installed_modules` | Installed module keys and exact versions. |
| `installed_packages` | Installed package keys and versions where packages are used. |
| `client_extensions` | Client-specific extensions installed outside reusable core modules. |
| `configuration_profile` | Configuration profile or tracked configuration groups for the deployment. |
| `database_model` | Declared database deployment model. |
| `tenant_scope` | Tenant or organization scope for the deployment. |
| `update_policy` | How updates may be applied. |
| `last_updated` | Date or timestamp when the manifest was last updated. |
| `approved_by` | Person, role, or group that approved the manifest. |

Additional fields may be added as NEWAX builds operational tooling, but these fields are the baseline.

Valid `deployment_environment` values:

```text
local
development
staging
production
```

Valid `deployment_status` values:

```text
planned
active
suspended
archived
```

Valid `support_plan` values:

```text
none
basic
standard
priority
enterprise
```

Valid `update_policy` values:

```text
manual
scheduled
security_only
managed_by_newax
```

Valid `database_model` values:

```text
centralized_shared_database
dedicated_client_database
hybrid_database
on_premise
private_enterprise_deployment
```

## 5. Client Identity

The manifest must identify the client clearly.

Rules:

- `client_name` must use the official business-facing client name.
- `client_key` must be lowercase, stable, and hyphen-separated.
- `organization_id` should reference the Central Registry organization record when available.
- Client identity must not be inferred from folder names, database names, or deployment URLs alone.
- Client identity changes must be documented in the manifest change history.

Example:

```text
client_name: ABC Institute
client_key: abc-institute
organization_id: org_abc_institute
```

Client identity is required for support, auditing, tenant safety, and long-term account ownership.

## 6. Solution Identity

The manifest must identify the solution installed for the client.

Rules:

- `solution_name` must describe the installed solution or edition.
- `solution_key` must be lowercase, stable, and hyphen-separated.
- Solution identity should align with the Module Registry and package definitions where applicable.
- A client may have more than one deployment manifest if it runs more than one NEWAX-powered solution.

Example:

```text
solution_name: LMS Foundation Edition
solution_key: lms-foundation-edition
```

Solution identity helps NEWAX understand which composition of modules and packages the client system is expected to use.

## 7. Installed Modules

Every installed module must be listed with an exact version.

Rules:

- Every installed module must include a `module_key`.
- Every installed module must include an exact `module_version`.
- Module keys must match the Module Registry.
- Installed modules must be intentional and traceable.
- Unused modules must not be installed by default.
- Security-sensitive modules must be identified clearly.
- Client-specific behavior must not be hidden as an undeclared module change.

Example installed modules for ABC Institute LMS Foundation Edition:

```text
- authentication: 1.0.0
- people: 1.0.0
- organizations: 1.0.0
- users: 1.0.0
- roles: 1.0.0
- permissions: 1.0.0
- audit: 1.0.0
- reports: 1.0.0
- lms-students: 1.0.0
- lms-teachers: 1.0.0
- lms-courses: 1.0.0
- lms-lectures: 1.0.0
- lms-tests: 1.0.0
- lms-payments: 1.0.0
```

Installed module visibility is the foundation for update safety and support readiness.

## 8. Installed Packages

Installed packages describe groups of modules deployed together.

Rules:

- Installed packages must include exact package versions.
- Packages must list included modules or reference a package definition.
- Packages must not hide module-level version differences.
- Packages must not include unnecessary modules by default.
- Package updates must follow controlled update rules.
- Package metadata must stay consistent with installed module metadata.

Example:

```text
package_name: LMS Foundation Package
package_key: lms-foundation-package
package_version: 1.0.0
```

Packages simplify deployment tracking, but installed modules remain the source of truth for what is actually running.

## 9. Module Versions

Module versions must be explicit.

Rules:

- Use semantic versioning.
- Use exact versions in client deployment manifests.
- Do not use vague values such as `latest`, `current`, or `main`.
- Every version must be traceable to a module `VERSION` file, module changelog, or approved registry entry.
- Version mismatches between packages and installed modules must be reviewed.
- Major updates require approval before production deployment.

Example:

```text
lms-payments: 1.0.0
```

Not allowed:

```text
lms-payments: latest
```

Exact version tracking supports controlled updates, rollback planning, and support troubleshooting.

## 10. Dependency Tracking

Every dependency must be traceable.

Rules:

- Installed modules must have required dependencies installed unless explicitly approved otherwise.
- Dependency versions must satisfy module compatibility requirements.
- Missing dependencies block production approval.
- Circular dependencies are not allowed.
- Client-specific extensions must declare dependencies on core modules or packages.
- A module must not silently use another module without declaring it.

Dependency tracking should align with the Module Registry and ADR 0009.

Example:

```text
lms-payments depends on:
- organizations
- people
- users
- permissions
- audit
```

Dependency visibility prevents fragile deployments and hidden coupling.

## 11. Configuration Tracking

The manifest must document how configuration is tracked for the client deployment.

Rules:

- The manifest should identify the configuration profile used by the deployment.
- Tenant-specific configuration must be documented where relevant.
- Security-sensitive configuration must be protected and not exposed carelessly.
- Configuration changes that affect access, reporting, payments, data exports, or integrations should be auditable.
- Configuration must not be used to bypass permissions, tenant isolation, or module ownership.

Examples of tracked configuration groups:

```text
authentication_policy
permission_profile
report_export_policy
payment_receipt_profile
notification_preferences
```

The manifest should record configuration identity and ownership, not necessarily every secret or sensitive value.

## 12. Client Extension Tracking

Every client-specific extension must be documented.

Rules:

- Client extensions must live outside reusable core modules.
- Every client extension must have a name, key, version, owner, status, and dependency list.
- Extensions must declare which core modules, events, APIs, or configuration points they depend on.
- Extensions must not directly modify reusable core module internals.
- Extensions must not block future module updates.
- Extension changes must be documented in the manifest change history.

Example:

```text
abc-institute-payment-receipt-extension: 0.1.0
```

Client extension tracking protects upgrade safety and keeps customization visible.

## 13. Tenant And Organization Scope

The manifest must declare tenant and organization scope.

Rules:

- Tenant or organization boundaries must be clear.
- The manifest must identify the client organization where available.
- Tenant-scoped modules must respect organization boundaries.
- Reports, exports, and administrative access must respect tenant scope.
- NEWAX administrative access must be explicit, permission-controlled, and auditable.
- The manifest must not imply that one client can access another client's records.

Example:

```text
tenant_scope: organization_scoped
organization_id: org_abc_institute
```

Tenant scope is required for security, reporting, support, and future scalability.

## 14. Support Plan Tracking

The manifest must declare the support plan for the client deployment.

Rules:

- Use the approved support plan values.
- Support plan must be visible to Product, Engineering, Support, and Operations.
- Support plan may affect response expectations, update scheduling, monitoring expectations, and review priority.
- Support plan must not override security requirements.
- Support plan changes must be documented.

Valid values:

```text
none
basic
standard
priority
enterprise
```

Support plan tracking helps NEWAX support client systems consistently.

## 15. Update Eligibility

The manifest must describe update eligibility and update policy.

Rules:

- Update eligibility must follow ADR 0006 controlled updates and versioning.
- Client systems must not automatically receive every latest module update without review.
- Security updates may be prioritized but still require controlled deployment.
- Major updates must be reviewed before production installation.
- Client extensions must be checked before module updates.
- Database model and tenant scope must be considered before updates.
- Rollback planning should be considered for production updates.

Valid update policy values:

```text
manual
scheduled
security_only
managed_by_newax
```

Update eligibility helps NEWAX protect client stability while keeping systems maintainable.

## 16. Security-Sensitive Modules

The manifest must identify security-sensitive modules.

Security-sensitive modules may include modules that handle:

- Authentication.
- Users.
- Roles.
- Permissions.
- Payments.
- Reports and exports.
- Audit logs.
- Personal or sensitive records.
- Administrative access.

Rules:

- Security-sensitive modules must be clearly identified.
- Permission requirements must be traceable.
- Sensitive configuration must be protected.
- Security-sensitive updates must be reviewed.
- Sensitive actions must be auditable where appropriate.
- Reports and exports must not bypass permissions or tenant boundaries.

Security-sensitive module tracking helps NEWAX manage risk across client deployments.

## 17. Audit And Change History

Manifest changes must be auditable.

Rules:

- Manifest updates should record what changed, when it changed, who changed it, and who approved it.
- Production manifest changes require stronger review than local or development manifests.
- Module additions, removals, and version changes must be recorded.
- Client extension additions, removals, and version changes must be recorded.
- Database model changes must be reviewed and documented.
- Support plan and update policy changes must be recorded.
- Security-sensitive manifest changes should identify the reason for the change.

Audit history makes the manifest useful for support, security, and long-term maintenance.

## 18. Manifest Approval Rules

A deployment manifest must be reviewed before it becomes authoritative.

Rules:

- Production manifests must be reviewed before major updates.
- Production manifests must list exact module versions.
- Production manifests must declare database model and tenant scope.
- Production manifests must identify client extensions.
- Production manifests must identify security-sensitive modules.
- Missing required fields block approval.
- Missing required dependencies block approval.
- Unapproved client-specific changes inside reusable core modules block approval.

Approvers may include NEWAX Engineering, Product, Architecture, Security, Support, or Operations depending on deployment risk.

## 19. Manifest Update Rules

Manifests must stay current.

Rules:

- Update the manifest when modules are added, removed, upgraded, downgraded, deprecated, or replaced.
- Update the manifest when packages are added, removed, or changed.
- Update the manifest when client extensions are added, removed, or changed.
- Update the manifest when deployment status changes.
- Update the manifest when support plan or update policy changes.
- Update the manifest when database model or tenant scope changes.
- Update the manifest when security-sensitive configuration categories change.
- Do not leave production manifests stale after deployment changes.

A stale manifest is operationally unsafe because it hides what the client system is actually running.

## 20. What Must Never Happen

The following practices are not allowed:

- Do not deploy a managed client system without a manifest.
- Do not list vague module versions such as `latest`.
- Do not hide client-specific customizations inside reusable core modules.
- Do not install modules without declaring dependencies.
- Do not allow client extensions to become hidden core dependencies.
- Do not bypass ADR 0006 controlled update rules.
- Do not perform major production updates without manifest review.
- Do not leave database model unclear.
- Do not ignore tenant or organization boundaries.
- Do not treat package versions as a substitute for installed module versions.
- Do not allow reports, exports, payments, authentication, roles, or permissions to bypass security review.
- Do not create production module implementations from this standard alone.

The Client Deployment Manifest exists to protect ownership, control, module visibility, update safety, support readiness, and long-term maintainability.

## Example Manifest: ABC Institute LMS Foundation Edition

The following example is illustrative. The JSON template in `templates/client-deployment-manifest/client-deployment-manifest.example.json` provides the structured example form.

```text
client_name: ABC Institute
client_key: abc-institute
organization_id: org_abc_institute
solution_name: LMS Foundation Edition
solution_key: lms-foundation-edition
deployment_environment: production
deployment_status: planned
support_plan: standard
database_model: centralized_shared_database
tenant_scope: organization_scoped
update_policy: managed_by_newax
last_updated: 2026-07-10
approved_by: NEWAX Engineering

installed_modules:
- authentication: 1.0.0
- people: 1.0.0
- organizations: 1.0.0
- users: 1.0.0
- roles: 1.0.0
- permissions: 1.0.0
- audit: 1.0.0
- reports: 1.0.0
- lms-students: 1.0.0
- lms-teachers: 1.0.0
- lms-courses: 1.0.0
- lms-lectures: 1.0.0
- lms-tests: 1.0.0
- lms-payments: 1.0.0

client_extensions:
- abc-institute-payment-receipt-extension: 0.1.0
```
