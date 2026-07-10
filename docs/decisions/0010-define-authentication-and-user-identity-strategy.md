# ADR 0010: Define Authentication and User Identity Strategy

## Purpose

Document how NEWAX Core will handle authentication, users, people, login access, sessions, account status, organization-scoped identity, and future security features across multiple project domains.

This ADR defines architecture direction only. It does not create authentication module code, database migrations, production modules, or implementation logic.

## 1. Decision Title

ADR 0010: Define Authentication and User Identity Strategy

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being built as a reusable business infrastructure foundation for multiple future project domains, including LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other systems.

NEWAX needs authentication and identity rules that work across many organizations, domains, and client systems. A person may exist in the Central Registry without login access. The same person may later become a student, teacher, admin, customer, employee, client, lawyer, doctor, or another domain-specific actor.

Authentication must integrate with the Central Identity and Organization Registry, permission-based access control, tenant boundaries, audit logging, and future security capabilities.

## 5. Problem

If NEWAX treats people, users, roles, and login access as the same concept, the platform will become difficult to secure and extend.

Poor identity design can create:

- Duplicate person records across domains.
- Login accounts for people who do not need access.
- Users accessing organizations without active membership.
- Hardcoded role checks.
- Inactive users retaining access.
- Super admin actions without audit visibility.
- LMS-specific user tables becoming dependencies for future domains.
- Weak session and password security.
- Difficult support for future features such as two-factor authentication, SSO, device management, API tokens, or service accounts.

NEWAX needs a clear authentication and identity strategy that separates human identity from login access and protects organization-scoped data.

## 6. Decision

NEWAX Core will separate human identity from login access.

A person represents a real human being.

A user represents a login account connected to a person.

A person may exist in the Central Registry without having login access.

A person may belong to multiple organizations through memberships.

A user may access one or more organizations depending on approved memberships, roles, permissions, and account status.

Core identity model:

```text
core_people
core_users
core_organizations
core_memberships
core_roles
core_permissions
core_audit_logs
```

Authentication must integrate with permission-based access control and organization-scoped access rules.

## 7. Reasoning

Separating people from users gives NEWAX a more accurate, secure, and scalable identity foundation.

This decision supports:

- Identity consistency across domains.
- Fewer duplicate person records.
- Login access only when needed.
- Multi-organization access without duplicating users.
- Tenant-aware permissions.
- Clear audit logs for login and identity actions.
- Future authentication features without redesigning identity.
- Stronger security for client systems.
- Better long-term maintainability across LMS and future domains.

Authentication should answer who is logging in. Identity should answer who the person is in the business system. Authorization should answer what that person is allowed to do.

## 8. Alternatives Considered

### Treat People And Users As The Same Record

NEWAX could use one record for both human identity and login access.

This was not selected because a person may exist without login access and may have different memberships or domain-specific roles over time.

### LMS-Specific User Tables

The LMS project could define its own user tables and future domains could reuse them.

This was not selected because future domains must not depend on LMS-specific tables. Identity belongs in the Central Registry.

### One User Per Organization

NEWAX could create separate user accounts for the same person in each organization.

This was not selected as the default because it creates duplication, weak identity consistency, and difficult cross-domain reporting.

### Hardcoded Role-Based Access

NEWAX could allow access based on role names such as `Admin`.

This was not selected because business logic must check permissions, not hardcoded role names.

### External Identity Provider Only

NEWAX could rely entirely on an external identity provider.

This may become useful for SSO or enterprise clients, but it does not replace NEWAX's need for people, organizations, memberships, roles, permissions, audit logs, and domain relationships in the Central Registry.

## 9. Authentication Vs Identity

Authentication answers:

```text
Who is trying to log in?
```

Identity answers:

```text
Who is this person in the business system?
```

Authorization answers:

```text
What is this person allowed to do?
```

Rules:

- Authentication must verify login access.
- Identity must preserve the real person record.
- Authorization must evaluate permissions in the correct organization and domain context.
- Authentication success must not automatically grant access to all organizations or modules.
- Login state must be combined with account status, memberships, and permissions.

These concepts must remain separate even if they are implemented together in future modules.

## 10. People Vs Users

People represent real human beings.

Examples:

- Student.
- Teacher.
- Accountant.
- Lawyer.
- Admin.
- Customer.
- Employee.
- Client.

Users represent login accounts.

A person becomes a user only when login access is required.

Example:

```text
Ali Khan exists in core_people.
Ali Khan receives login access through core_users.
Ali Khan is linked to ABC Institute through core_memberships.
Ali Khan receives permissions through roles and permissions.
```

Rules:

- `core_people` stores human identity.
- `core_users` stores login account identity.
- A person may exist without a user account.
- A user must be connected to a person.
- A person may have domain-specific profile records.
- The same person must not be duplicated unnecessarily across domains.

This aligns with ADR 0008: Use Central Identity and Organization Registry.

## 11. Organization-Scoped Access

A user must access records through an organization context where appropriate.

Example:

A person may be:

- Teacher in ABC Institute.
- Admin in XYZ Institute.
- Client in Legal domain.

The same person should not be duplicated unnecessarily.

Rules:

- A user must not access organizations where they have no active membership or approved access.
- Organization context must be included in permission checks where required.
- Tenant-scoped records must enforce `organization_id` boundaries where appropriate.
- Reports and exports must respect organization boundaries.
- Cross-organization access must be explicit, permission-controlled, and auditable.

Organization-scoped access protects tenant safety across LMS and future domains.

## 12. Login Account Rules

Login should be tied to a user account.

Rules:

- User accounts must be connected to a person.
- User access must respect organization memberships.
- Users must not access organizations where they have no active membership or approved access.
- Permissions must be checked before sensitive actions.
- Business logic must check permissions, not hardcoded role names.
- Login access should be disabled when the user account is suspended, disabled, or archived.
- Login identifiers must be protected from unnecessary exposure.
- Changes to login access should be auditable.

A login account gives a person a way to authenticate. It does not grant unrestricted business access.

## 13. Session Management

Sessions must be secure.

Rules:

- Session expiration should be configurable.
- Logout should invalidate active sessions where appropriate.
- Sensitive systems may require stricter session policies.
- Session behavior should support organization-scoped access.
- Session context should not bypass account status or permission checks.
- Session invalidation should be supported for suspended or disabled accounts.
- Future single-device login may be supported per client requirement.

Session management must protect users, organizations, and client systems from unauthorized access.

## 14. Password Management

Passwords must be handled as sensitive authentication data.

Rules:

- Passwords must never be stored in plain text.
- Password hashes must never be exposed.
- Password reset flows must be secure.
- Password reset events should be logged.
- Password rules should be configurable where appropriate.
- Password changes should invalidate sessions where appropriate.
- Password reset tokens or temporary credentials must expire.
- Future two-factor authentication should be supported by design.

Password management must be designed for security from the beginning, even before advanced authentication features are added.

## 15. Account Status Rules

User accounts must support practical status values.

Recommended account statuses:

```text
active
invited
suspended
disabled
archived
```

Status meanings:

- `active`: User may authenticate and access approved organizations according to permissions.
- `invited`: User has been invited but has not fully activated login access.
- `suspended`: User access is temporarily blocked.
- `disabled`: User access is blocked until explicitly restored.
- `archived`: User is retained for records but should not authenticate.

Rules:

- Inactive users must not access systems.
- Suspended, disabled, and archived users must not authenticate unless an approved recovery flow allows it.
- Account status changes must be auditable.
- Account status must be checked before sensitive actions.
- Membership status and account status must both be respected.

Account status is a security control, not only a display field.

## 16. Super Admin Access

NEWAX super admin access must be explicit, permission-controlled, and auditable.

Rules:

- Super admin access must not bypass audit logs.
- Super admin actions must be logged when they affect sensitive data, permissions, tenant records, or client systems.
- Super admins may require stronger authentication in the future.
- Super admin capabilities must be granted carefully and reviewed regularly.
- Super admin access must not accidentally bypass organization boundaries.
- Reports accessed by super admins must be explicit and auditable.

Super admin access is a high-trust capability and must be treated as security-sensitive.

## 17. Multi-Organization Users

A user may access one or more organizations depending on approved memberships, roles, permissions, and account status.

Rules:

- A person may have memberships in multiple organizations.
- A user may have different permissions in different organizations.
- The active organization context should be clear when accessing tenant-scoped data.
- Switching organization context must not leak data across organizations.
- Reports, dashboards, exports, and searches must respect the active organization context unless super admin access is explicitly used.
- Multi-organization access must be auditable where security-sensitive.

NEWAX must never assume that a user belongs to only one organization forever.

## 18. Permission Integration

Authentication must integrate with permission-based access control.

Bad:

```text
if user.role == "Admin"
```

Good:

```text
user.can("payments.approve")
```

Rules:

- Authentication confirms login.
- Authorization checks permissions.
- Business logic must check permissions, not hardcoded role names.
- Permission checks must include organization context where required.
- Roles may group permissions but must not define access by themselves.
- Permission changes must be auditable when security-sensitive.
- Client-specific roles must not require modification of reusable core modules.

This aligns with ADR 0002: Use Permission-Based Access Control.

## 19. Audit Logging Requirements

Audit logs should record important identity and authentication actions.

Audit events should include:

```text
user.login
user.logout
user.login_failed
user.password_reset_requested
user.password_reset_completed
user.created
user.suspended
user.disabled
role.assigned
role.removed
permission.changed
admin.accessed_sensitive_data
```

Audit records should preserve:

- Actor.
- Person context.
- User context.
- Organization context where applicable.
- Action.
- Timestamp.
- Source module or system.
- Security sensitivity where appropriate.
- Administrative context where applicable.

Audit logs must be protected from unauthorized access and modification.

## 20. Security Considerations

Authentication and user identity are security-critical foundation concerns.

Security rules:

- Never store plain text passwords.
- Never expose password hashes.
- Never hardcode role-based access checks.
- Never allow inactive users to access systems.
- Never allow access without permission checks.
- Never allow super admin actions without audit logs.
- Never duplicate person records unnecessarily when one person has multiple roles.
- Never assume a user belongs to only one organization forever.
- Password reset flows must be secure and auditable.
- Session expiration and invalidation must be supported.
- Sensitive identity, contact, membership, role, and permission changes must be logged.

Security review should be required for changes that affect authentication, account status, sessions, password flows, permissions, super admin access, or organization boundaries.

## 21. Scalability Considerations

Authentication and identity must scale across multiple project domains and client systems.

Scalability direction:

- Start with a practical Central Registry model.
- Keep `core_people` and `core_users` separate.
- Support multi-organization users from the beginning.
- Keep authentication independent from LMS-specific tables.
- Allow future integration with SSO, two-factor authentication, device management, and service accounts.
- Avoid premature distributed identity architecture until operational scale or client requirements justify it.
- Preserve stable identifiers so future services can integrate without rewriting identity.

The model should support future growth without turning LMS user tables into platform infrastructure.

## 22. Maintenance Considerations

Authentication and identity rules must remain documented and consistently enforced.

Maintenance rules:

- Identity and authentication modules must document owned data and public contracts when implementation begins.
- Account status behavior must be documented.
- Session and password policies must be documented.
- Permission integration must be tested when implementation begins.
- Audit events must be documented.
- Future authentication features must not bypass Central Registry ownership.
- Client-specific login policies must not modify reusable core modules directly.

Authentication should remain stable, secure, and understandable across all connected domains.

## 23. Future Authentication Features

NEWAX Core may later support:

- Two-factor authentication.
- OTP login.
- Magic links.
- Single sign-on.
- Organization-specific login policies.
- Single-device login.
- Device management.
- Login history.
- Risk-based authentication.
- API tokens.
- Service accounts.

Rules:

- Future features must preserve people and users as separate concepts.
- Future features must respect organization memberships and permissions.
- Future features must be auditable where security-sensitive.
- Future features must not require LMS-specific user tables.
- Future features must be introduced through controlled architecture and implementation review.

This ADR prepares the architecture for future security growth without implementing those features now.

## 24. Impact On NEWAX Core

NEWAX Core must treat authentication and user identity as foundation architecture.

Impact:

- `core_people` and `core_users` must remain separate concepts.
- Authentication must integrate with Central Registry records.
- User access must respect organization memberships.
- Permission-based access control remains mandatory.
- Super admin access must be explicit and auditable.
- Audit events must cover login, password, account status, role, and permission changes.
- Future domains must not depend on LMS-specific user tables.

This strengthens NEWAX Core as reusable business infrastructure across multiple domains.

## 25. Impact On Client Systems

Client systems can support secure login access while preserving identity consistency.

Impact:

- A person can exist without login access.
- A person can have different roles in different organizations or domains.
- Users can access only approved organizations and actions.
- Client-specific roles can be built from permissions without changing core business logic.
- Client systems can adopt future authentication features when approved.
- Client reports, exports, and administration must respect organization boundaries and permissions.
- NEWAX administrative access must be visible and auditable.

This protects client systems from duplicate identity records and unsafe access patterns.

## 26. What Must Never Happen

The following practices are not allowed:

- Do not treat People and Users as the same thing.
- Do not design identity only around LMS.
- Do not allow future domains to depend on LMS-specific user tables.
- Do not allow hardcoded role checks.
- Do not ignore organization boundaries.
- Do not let NEWAX super admin access become invisible.
- Do not store sensitive authentication data insecurely.
- Do not create multiple unrelated records for the same person across domains when a central identity can be used.
- Do not allow inactive users to authenticate.
- Do not bypass permission checks in reports, exports, background jobs, or administrative tools.
- Do not create authentication module code or migrations from this ADR alone.

These rules protect security, identity consistency, tenant safety, permissions, auditability, scalability, and long-term maintainability.

## 27. Related Documents

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
- [ADR 0009: Define Module Registry and Dependency Rules](./0009-define-module-registry-and-dependency-rules.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 28. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, Security, Support, or leadership ownership is assigned.
