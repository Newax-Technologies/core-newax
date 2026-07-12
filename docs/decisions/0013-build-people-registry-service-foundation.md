# ADR 0013: Build the People Registry Service Foundation

## 1. Decision Title

Build the first reusable People Registry service foundation for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

ADR 0012 established the executable Central Registry persistence foundation. The next controlled slice must provide reusable service rules for real-person identity without making authentication, memberships, contacts, addresses, or a business domain part of the People module.

The People module must protect sensitive identifiers, remain permission-driven, and avoid duplicate identifier assignment under concurrent requests.

## 5. Decision

NEWAX Core will provide a reusable `@newax/people` foundation package with:

- Person creation, retrieval, listing, update, and archival.
- Person identifier creation, listing, and verification.
- Explicit people and identifier permissions.
- Immutable public contracts.
- A persistence port and event-publisher port.
- A PostgreSQL and Prisma application adapter.
- A NestJS composition module.
- Unit tests, documentation, changelog, and version metadata.

The module owns:

```text
core_people
core_person_identifiers
```

The module does not own:

```text
users
authentication
memberships
roles
contacts
addresses
domain profiles
business transactions
```

### 5.1 Identifier duplicate protection

Identifier values are canonicalized before persistence.

The PostgreSQL adapter creates a transaction-scoped advisory lock from the normalized identifier type, issuing country, issuing authority, and value. It then checks for an existing assignment and creates the identifier within the same transaction.

This prevents two concurrent requests from assigning the same normalized identifier to different people through a check-then-insert race.

### 5.2 Authorization

The module requires explicit permissions:

```text
people.view
people.create
people.update
people.archive
people.identifiers.view
people.identifiers.manage
```

Roles may group these permissions, but module behaviour must not authorize actions through role names.

### 5.3 HTTP boundary

The module will not expose public REST endpoints in this slice.

HTTP controllers remain deferred until trusted authentication, organization context, permission guards, sensitive-field response controls, and audit actor resolution exist.

## 6. Consequences

### Positive

- Future domains share stable person identifiers.
- Person identity remains independent from user accounts and memberships.
- Identifier access can be controlled separately from ordinary person access.
- Concurrent duplicate assignment is prevented in the PostgreSQL adapter.
- The module can be reused without depending on LMS or another business domain.

### Negative

- The first adapter relies on a PostgreSQL advisory lock for concurrency control.
- Public APIs remain unavailable until the access-control boundary is implemented.
- Person archival consequences for future Users and Memberships modules require event consumers.
- Probabilistic duplicate-person matching remains deferred.

## 7. Implementation Rules

- Keep domain-specific profile fields outside `core_people`.
- Store canonical identifier values.
- Never log identifier values in lifecycle event adapters.
- Reject future dates of birth.
- Reject invalid identifier validity ranges.
- Reject updates and new identifiers for archived people.
- Preserve person records through archival rather than destructive deletion.
- Keep public contracts immutable.
- Require explicit permissions for every protected operation.

## 8. Deferred Decisions

- Public People REST endpoints.
- Person contacts and addresses.
- Person relationship records.
- Record matching and merge workflows.
- Identifier removal and historical revocation.
- Durable event delivery and transactional outbox support.
- Automated effects on Users and Memberships when a person is archived.

## 9. Related Decisions

- ADR 0001: Use Modular Monolith First.
- ADR 0002: Use Permission-Based Access Control.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0011: Define Technology Stack and Implementation Baseline.
- ADR 0012: Implement the Central Registry Data Foundation.

## 10. Approval

This decision is accepted as the implementation baseline for the first People Registry service slice.
