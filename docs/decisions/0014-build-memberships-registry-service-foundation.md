# ADR 0014: Build the Memberships Registry Service Foundation

## 1. Decision Title

Build the first reusable Memberships Registry service foundation for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

NEWAX Core now has executable Organization and People foundations. The next required boundary is the relationship that connects a person to an organization without duplicating either record.

Users, roles, permissions, LMS enrolments, HR employment records, healthcare relationships, CRM contacts, and other domains need a stable organization context. Creating user accounts before memberships would leave authentication without a trustworthy business context and encourage global role assignments.

The Memberships module must preserve tenant isolation, prevent duplicate active relationships, and remain separate from job titles, authentication accounts, and domain profiles.

## 5. Decision

NEWAX Core will provide a reusable `@newax/memberships` foundation package with:

- Organization-scoped membership creation, retrieval, listing, update, and non-destructive removal.
- Explicit membership permissions.
- Immutable public contracts.
- A persistence port, reference-directory port, and event-publisher port.
- A PostgreSQL and Prisma application adapter.
- A NestJS composition module.
- Unit tests, documentation, changelog, and version metadata.

The module owns:

```text
core_memberships
core_membership_roles
```

The first slice implements lifecycle operations for `core_memberships` only. Operations for `core_membership_roles` remain deferred until the Access Control module defines role, permission, assignment, scope, and revocation behaviour.

The module does not own:

```text
people
organizations
users
authentication credentials
role definitions
permissions
contacts
addresses
domain profiles
business transactions
```

### 5.1 Organization context

Every protected operation requires a selected organization in `MembershipRequestContext`.

The create payload does not accept an organization identifier. The service derives the organization from trusted request context. Memberships belonging to another organization are treated as not found.

### 5.2 Duplicate protection

The PostgreSQL adapter creates a transaction-scoped advisory lock from the organization, person, and normalized membership type. It then checks for an existing active or suspended membership and creates the new membership within the same transaction.

Ended memberships do not block a later membership of the same type.

### 5.3 Lifecycle

Membership removal is non-destructive. It sets the membership status to `ended` and records an end date.

Membership type and organization are immutable after creation. Job titles remain descriptive data and must never be interpreted as authorization roles.

### 5.4 Authorization

The module requires:

```text
memberships.view
memberships.create
memberships.update
memberships.remove
```

Role names and job titles must not be used as authorization conditions.

### 5.5 HTTP boundary

The module will not expose public REST endpoints in this slice.

Controllers remain deferred until trusted authentication, organization selection, permission evaluation, tenant middleware, and audit actor resolution exist.

## 6. Consequences

### Positive

- People may participate in multiple organizations without duplicate identity records.
- Later access control can assign roles to organization-scoped memberships.
- Tenant context is explicit in every operation.
- Cross-organization membership existence is not exposed.
- Duplicate active relationships are prevented under concurrent requests.
- Membership history is preserved.

### Negative

- The PostgreSQL adapter relies on advisory locking for duplicate-sensitive creation.
- Public APIs remain unavailable until access-control boundaries exist.
- Role assignment operations remain deferred.
- Archive-event consumers for People and Organizations are not implemented yet.
- Future scheduled memberships are not supported in this first slice.

## 7. Implementation Rules

- Never duplicate person or organization identity fields in membership records.
- Never authorize through membership type or job title.
- Derive organization scope from trusted request context.
- Hide cross-organization records as not found.
- Permit new memberships only for active people and active organizations.
- Preserve ended membership records.
- Keep domain-specific relationship fields outside the shared membership table.
- Require explicit permissions for every protected operation.
- Use documented contracts for read-only People and Organizations reference checks.

## 8. Deferred Decisions

- Public Membership REST endpoints.
- User and authentication integration.
- Role, permission, and membership-role assignment operations.
- Department, branch, record, and self scopes.
- Archive-event orchestration.
- Durable audit and event persistence.
- Scheduled future memberships.
- Domain-specific membership extensions.

## 9. Related Decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0009: Define Module Registry and Dependency Rules.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0013: Build the People Registry Service Foundation.

## 10. Approval

This decision is accepted as the implementation baseline for the first Memberships Registry service slice.
