# NEWAX Access Control Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

The Access Control module provides permission-driven, organization-aware authorization for NEWAX business infrastructure.

Permissions define atomic capabilities. Roles group permissions. Roles are assigned to memberships, not globally to people or users. Permission evaluation resolves the effective capabilities of one active membership inside one organization.

## Why roles and permissions are one module

The planned Roles and Permissions entries are implemented as one bounded context because role creation, permission assignment, membership-role assignment, revocation, template instantiation, and evaluation must remain consistent.

Splitting those operations into separate deployable modules would create cross-module transactions and circular service dependencies without creating a meaningful business boundary.

## Owned concepts and data

The module owns:

- Permission definitions.
- System, template, and organization role definitions.
- Role-permission mappings with allow or deny effects.
- Membership-role assignments and revocations.
- Role template instantiation.
- Effective permission evaluation.
- Access-control lifecycle events.

Database ownership:

- `core_permissions`
- `core_roles`
- `core_role_permissions`
- `core_membership_roles`

The module does not own people, organizations, memberships, users, authentication credentials, sessions, job titles, domain records, or business transactions.

## Public module API

The package exports:

- `AccessControlService`
- `PermissionEvaluator`
- `AccessControlRepository`
- `AccessReferenceDirectory`
- `AccessControlEventPublisher`
- Access-control request, response, persistence, and event contracts
- `ACCESS_CONTROL_PERMISSIONS`
- `AccessControlError`

Administrative operations include:

```text
registerPermission
listPermissions
createRole
createTemplate
createRoleFromTemplate
getRoleById
listRoles
updateRole
archiveRole
setRolePermission
removeRolePermission
listRolePermissions
assignRole
revokeRole
listAssignments
```

Authorization evaluation uses:

```text
PermissionEvaluator.evaluate(membershipId)
```

## Permission model

Permission codes are derived from module, resource, and action:

```text
organizations.view
people.identifiers.view
access_control.roles.create
```

Protected business logic checks permission codes, never role names.

Administrative permissions:

```text
access_control.permissions.view
access_control.permissions.manage
access_control.roles.view
access_control.roles.create
access_control.roles.update
access_control.roles.archive
access_control.roles.permissions.manage
access_control.assignments.view
access_control.assignments.manage
access_control.templates.manage
```

## Role model

Role types:

- `system`: reserved and immutable through organization administration.
- `template`: global blueprint that can be instantiated into an organization role.
- `organization`: assignable role owned by one organization.

Role codes are immutable. Organization roles cannot cross organization boundaries. Templates are not assigned directly to memberships.

## Evaluation rules

The evaluation path is:

```text
Membership
  -> effective membership-role assignments
  -> active organization roles
  -> active role-permission mappings
  -> effective permission codes
```

Rules:

- Suspended or ended memberships receive no permissions.
- Revoked assignments are ignored.
- Assignments outside their validity window are ignored.
- Archived roles and permissions are ignored.
- Only organization roles are evaluated for memberships.
- Explicit deny wins over allow when multiple roles contain the same permission.
- Results are sorted for deterministic downstream use and testing.

## Role templates

Templates are global role blueprints. Instantiation creates a new organization role and copies its role-permission mappings in one database transaction.

Templates remain independent after instantiation. Later template changes do not silently alter existing client roles. Enterprise operators generally dislike waking up to permissions they did not approve, an oddly sensible human preference.

## Concurrency and consistency

The PostgreSQL adapter uses transaction-scoped advisory locks for:

- Permission registration by permission code.
- Role creation by role scope and role code.
- Membership-role assignment by membership and role.

Role creation from templates and permission copying occur atomically.

## Dependencies

The module depends on:

- Organizations `>=0.1.0`
- Memberships `>=0.1.0`

Read-only organization and membership checks use the `AccessReferenceDirectory` contract.

The module does not depend on Users for permission evaluation. Authentication identifies a user; application context later selects one of that user’s memberships for authorization.

## Events

```text
permission.registered
permission.updated
role.created
role.updated
role.archived
role.permission_changed
role.assigned
role.removed
```

Sensitive permission evaluation results are not written to the logging event adapter.

## HTTP exposure

This slice does not expose public HTTP endpoints.

Controllers remain deferred until authentication, trusted membership selection, tenant-safe request context, permission guards, and audit persistence exist. The evaluator is an internal application capability, not an endpoint for permission archaeology.

## Testing

Unit tests cover:

- Administrative permission enforcement.
- Stable permission-code derivation.
- Cross-organization role isolation.
- Membership-role assignment rules.
- Suspended membership behaviour.
- Deny precedence.

Repository CI validates PostgreSQL migrations, formatting, linting, strict TypeScript, tests, and production builds.

## Client customization

Clients may create organization roles and instantiate approved templates. Client-specific role names are allowed, but business logic must continue checking stable permission codes.

Client-specific permissions require a registered module, resource, and action. Hardcoded client role-name checks are prohibited.

## Known limitations

- Public REST endpoints are not enabled.
- User-to-membership context selection is deferred.
- Department, branch, record, and self scopes are deferred.
- Direct membership permission overrides are deferred.
- Durable audit and event persistence remain deferred.
- Archive-event consumers remain deferred.

## Related decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0014: Build the Memberships Registry Service Foundation.
- ADR 0015: Consolidate Roles and Permissions into Access Control.
