# ADR 0002: Use Permission-Based Access Control

## Purpose

Document why NEWAX Core will use permission-based access control instead of hardcoded roles.

This ADR aligns NEWAX Core with its role as a reusable business infrastructure foundation that must support security, flexibility, auditability, scalability, multi-tenancy, and long-term maintainability.

## 1. Decision Title

ADR 0002: Use Permission-Based Access Control

## 2. Status

Accepted

## 3. Date

2026-07-09

## 4. Context

NEWAX Core is being established as the private foundation for reusable business infrastructure modules.

The platform will need to support foundation modules, platform services, business modules, and client systems across different domains and organization structures.

Access control must be flexible enough to support reusable modules and client-specific roles without requiring business logic changes for every client or workflow variation.

## 5. Problem

Hardcoded role checks create long-term maintainability and security problems.

For example:

```text
if user.role == "Admin"
```

This approach tightly couples business logic to role names. It makes permissions harder to audit, harder to customize, and harder to scale across clients, tenants, modules, and products.

NEWAX Core needs an access-control model where reusable modules can define protected actions clearly, while client systems can group those permissions into roles that match their operating model.

## 6. Decision

NEWAX Core will use permission-based access control.

Roles will group permissions, but roles will not be hardcoded into business logic.

Business logic must check permissions, not role names.

Good example:

```text
user.can("payments.approve")
```

Bad example:

```text
if user.role == "Admin"
```

## 7. Reasoning

Permission-based access control gives NEWAX Core a more flexible and durable foundation.

Key reasons:

- Permissions define actual access.
- Roles can vary by client without changing reusable module code.
- Modules can own and document their own permissions.
- Permission checks are easier to audit than role-name checks.
- Multi-tenant access models are easier to support later.
- Security reviews can focus on protected actions rather than role labels.
- New business modules can register permissions without changing global role logic.
- Client systems can create custom roles from core permissions.

This model supports NEWAX Core as reusable business infrastructure instead of a single-client application.

## 8. Alternatives Considered

### Hardcoded Roles

This approach checks fixed role names directly in business logic.

It was not selected because it creates brittle behavior, hidden access rules, and client-specific code paths.

### Role-Based Access Only

This approach grants access based only on role membership.

It was not selected because roles are too coarse for reusable modules and future multi-tenant client customization.

### Attribute-Based Access Control First

This approach evaluates access from attributes, policies, context, and conditions.

It may become useful later for advanced policies, but it is too complex as the first access-control model for NEWAX Core.

Permission-based access control provides the right starting balance of clarity, security, flexibility, and maintainability.

## 9. Why Not Hardcoded Roles

Hardcoded roles are not suitable for NEWAX Core.

Problems with hardcoded roles:

- They couple business logic to role names.
- They make client-specific role customization difficult.
- They create duplicated conditional logic across modules.
- They make audits less precise.
- They encourage broad access such as `Admin` instead of specific protected actions.
- They make it harder to evolve permissions by module.
- They do not scale well across tenants, clients, and business domains.

NEWAX Core must avoid role-name checks in reusable module logic.

## 10. Roles Vs Permissions

Roles are labels or responsibility groups.

Permissions define actual access.

A role may group many permissions. For example, a `Finance Manager` role might include:

- `payments.view`
- `payments.submit`
- `payments.approve`
- `reports.view`
- `reports.export`

The role name should not determine access directly. Access is determined by the permissions assigned to the user through one or more roles.

Business logic must ask whether the user has the permission required for the action.

## 11. Permission Naming Convention

NEWAX Core permissions must use this naming convention:

```text
module.action
```

Examples:

```text
students.view
students.create
students.update
students.delete

courses.view
courses.create
courses.update
courses.delete

payments.view
payments.submit
payments.approve
payments.reject

reports.view
reports.export
```

Rules:

- The module name must identify the owning module or capability.
- The action must describe the protected operation.
- Permission names must be lowercase.
- Permission names must be stable after adoption.
- Permission names must be documented by the owning module.
- Permission names should be specific enough to audit, but not so granular that they become unmanageable.

## 12. Module Permission Ownership

Each module owns and documents its own permissions.

Rules:

- New modules must register their permissions clearly.
- Module permissions must be documented in the module's `permissions/` documentation.
- Protected APIs and services must reference documented permissions.
- Permission changes must be reflected in module documentation and changelogs.
- Modules must not invent hidden permissions in implementation details.
- Permission ownership must remain aligned with module ownership.

This keeps access control modular and reviewable.

## 13. Tenant-Level Permission Support

Permissions must support multi-tenancy in the future.

Initial direction:

- Permissions should be assignable within an organization or tenant boundary.
- A user may have different permissions in different organizations when product requirements justify it.
- Role assignments should be tenant-aware.
- Permission checks should include tenant context when required.
- Audit logs should preserve user, tenant, permission, action, and target context when applicable.

The first implementation does not need to solve every advanced tenancy case, but permission design must not block future multi-tenant access control.

## 14. Client-Specific Permission Customization

Client-specific roles may be created without changing core module code.

Rules:

- Client systems may define role names that match their operations.
- Client roles must map to documented NEWAX Core permissions.
- Client-specific access needs should be handled through role configuration, permission assignment, or approved extension points.
- Client customizations must not modify reusable core modules directly.
- Client-specific permission behavior must not weaken security, auditability, or module ownership.

This allows different clients to organize responsibilities differently while reusing the same secure core modules.

## 15. Security Considerations

Permission-based access control improves security when enforced consistently.

Security rules:

- Business logic must check permissions, not role names.
- Permission checks must be enforced in APIs and services, not only UI code.
- Permissions must be auditable.
- Permission changes should be logged for security.
- Privileged permissions must be reviewed carefully.
- Permission grants and role assignments should be traceable.
- Client-specific roles must not bypass core permission checks.

Permission-based access control supports least privilege by granting specific capabilities instead of broad role-based access.

## 16. Scalability Considerations

Permission-based access control scales better across modules, tenants, and clients.

Benefits:

- New modules can add permissions without changing global role logic.
- Clients can define custom roles from existing permissions.
- Multi-tenant access can evolve around organization-scoped permission assignment.
- Permission checks can remain stable even as role names differ by client.
- Auditing can track specific actions across the platform.

The model is more scalable than hardcoded role checks because it separates protected actions from responsibility labels.

## 17. Maintenance Considerations

Permission-based access control requires documentation and discipline.

Maintenance rules:

- Permission names must remain consistent.
- Deprecated permissions must be documented.
- Permission changes must update changelogs where they affect reusable behavior.
- Tests should cover protected actions.
- Modules must document their permissions before becoming reusable.
- Security-sensitive permission changes should be reviewed carefully.

This decision reduces long-term maintenance cost by avoiding scattered role checks and hidden access rules.

## 18. Impact On NEWAX Core

NEWAX Core will treat permissions as part of each module's public contract.

Impact:

- Module standards must require permission documentation.
- Reusable modules must define protected actions clearly.
- API and service standards must require permission checks.
- Future permission module design must support module-owned permissions.
- Future audit architecture must support permission-related activity.
- Role management must be treated as permission grouping, not access logic.

This strengthens NEWAX Core as reusable business infrastructure.

## 19. Impact On Client Systems

Client systems can define roles that match their real operations without changing reusable core modules.

Examples:

- A school may define `Teacher`, `Registrar`, or `Finance Officer` roles.
- A clinic may define `Doctor`, `Receptionist`, or `Billing Manager` roles.
- A CRM client may define `Sales Manager`, `Account Executive`, or `Support Lead` roles.

Those roles should map to documented permissions.

Client systems gain flexibility while NEWAX Core keeps stable, auditable access rules.

## 20. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 21. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, or Security ownership is assigned.
