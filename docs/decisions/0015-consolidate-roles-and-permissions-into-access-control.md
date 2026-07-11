# ADR 0015: Consolidate Roles and Permissions into Access Control

## 1. Decision Title

Implement roles, permissions, membership-role assignments, templates, and permission evaluation as one Access Control bounded context.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

The initial Module Registry listed Roles and Permissions as separate planned modules. Implementation analysis showed that the separation did not represent independent business ownership or lifecycle.

Role creation, role-permission changes, template instantiation, membership-role assignment, revocation, and effective permission evaluation operate on one tightly connected model. Splitting these capabilities would require cross-module transactions and introduce circular service dependencies.

The access path is:

```text
Person
  -> Membership
  -> Membership Role Assignment
  -> Role
  -> Role Permission
  -> Permission
```

Users and authentication prove login identity, but they do not own authorization policy. Authorization is anchored to the selected membership and its organization.

## 5. Decision

NEWAX Core will implement one reusable `@newax/access-control` foundation package.

The Access Control module owns:

```text
core_permissions
core_roles
core_role_permissions
core_membership_roles
```

The previously planned Roles and Permissions registry entries will be replaced by one Access Control entry before either planned module becomes active.

The module provides:

- Stable permission registration.
- System, template, and organization roles.
- Role-permission assignment with allow or deny effects.
- Transactional role-template instantiation.
- Membership-role assignment and revocation.
- Effective membership permission evaluation.
- Organization isolation.
- Explicit administrative permissions.

### 5.1 Permission-driven authorization

Protected business logic checks explicit permission codes. It must not authorize actions through role names, job titles, or membership types.

Permission codes are derived from module, resource, and action.

### 5.2 Membership-based evaluation

Roles are assigned to memberships rather than globally to people or users.

Permission evaluation requires an active membership and considers only:

- Non-revoked assignments.
- Assignments inside their validity period.
- Active organization roles.
- Active permissions.

Deny takes precedence over allow.

### 5.3 Role templates

Templates are global blueprints. Instantiating a template creates an organization role and copies its permission mappings in one database transaction.

Existing organization roles do not automatically change when a template changes.

### 5.4 Users dependency

The Access Control module does not depend on the Users module for permission evaluation.

A future authenticated user selects or resolves one membership context. The membership then becomes the authorization anchor.

Actor user identifiers may be recorded on administrative changes where the existing database schema supports them.

### 5.5 HTTP boundary

Public Access Control endpoints remain deferred until authentication, trusted membership selection, permission guards, tenant-safe request context, and audit persistence exist.

## 6. Consequences

### Positive

- Role, permission, assignment, and evaluation rules remain consistent.
- Template instantiation and permission copying can be atomic.
- The architecture avoids circular dependencies between Roles and Permissions.
- Authorization remains independent from login implementation.
- Organization isolation is enforced at one boundary.
- Deny precedence is implemented once.

### Negative

- The Access Control module is broader than the originally planned individual modules.
- Changes to role and permission behaviour share one version lifecycle.
- The initial PostgreSQL adapter uses advisory locking for duplicate-sensitive operations.
- Permission scopes below organization level remain deferred.

## 7. Implementation Rules

- Never authorize by role name, job title, or membership type.
- Assign roles only to memberships.
- Assign only organization roles to memberships.
- Treat system roles as immutable through organization administration.
- Treat templates as blueprints, not assignable roles.
- Hide cross-organization roles and assignments as not found.
- Ignore suspended or ended memberships during evaluation.
- Ignore revoked, expired, archived-role, and archived-permission grants.
- Apply deny precedence.
- Keep permission codes stable and machine-readable.
- Use one transaction when instantiating a role template.

## 8. Deferred Decisions

- Public REST endpoints.
- User-to-membership context selection.
- Department, branch, record, assigned, and self scopes.
- Direct membership permission overrides.
- Delegated administration constraints.
- Durable audit and event persistence.
- Policy caching and invalidation.
- External policy engines.

## 9. Related Decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0009: Define Module Registry and Dependency Rules.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0014: Build the Memberships Registry Service Foundation.

## 10. Approval

This decision is accepted as the implementation baseline for the first Access Control service slice.
