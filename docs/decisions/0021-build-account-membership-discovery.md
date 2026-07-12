# ADR 0021: Build Account Membership Discovery

- Status: Accepted
- Date: 2026-07-12
- Owners: NEWAX Engineering

## Context

Authentication can now establish a browser session, Trusted Request Context can validate a selected membership, and the HTTP Security Boundary can enforce account and organization request modes.

A client still needs a safe way to learn which organization memberships belong to the authenticated person before it can select one. Asking the client to already know an organization identifier would encourage tenant identifiers to be stored, guessed, or supplied as authority. Returning every membership record visible to an administrator would be even worse because account context has no organization permissions.

Membership discovery must therefore be a self-scoped, read-only bridge between authenticated account context and later organization-context selection.

## Decision

NEWAX will add bounded account membership discovery to the Trusted Request Context platform service and expose one application-layer endpoint:

```text
GET /api/account/memberships
```

The endpoint requires trusted account context. The person identifier is always derived from the authenticated session and is never accepted from query parameters, headers, or request bodies.

### Eligible memberships

Discovery returns only memberships that satisfy all of the following:

- The membership belongs to the person in trusted account context.
- The person remains active and is not archived.
- The membership status is `active`.
- The membership has not been ended.
- The organization status is `active`.
- The organization has not been archived or soft-deleted.

Persistence filters these conditions, and the service boundary verifies person ownership, status values, identifier integrity, pagination integrity, and duplicate absence again before returning data.

### Response contract

Each result contains only the information needed to present an organization choice:

- Membership identifier.
- Organization identifier.
- Organization display name.
- Organization type.
- Membership type.
- Job title when present.
- Membership start date when present.

The response excludes:

- Person identifiers.
- Membership reference numbers.
- Legal registration and tax data.
- Role names.
- Permission codes.
- Credentials, sessions, or authentication metadata.
- Any client-declared tenant authority.

The collection uses bounded `page` and `per_page` query parameters, rejects unknown query fields, returns standard list metadata, and uses `Cache-Control: no-store`.

### Authority boundary

Membership discovery does not grant organization access.

A client may present one returned membership identifier through the approved membership-selection transport. Trusted Request Context must then re-read the membership, confirm ownership and active status, derive the organization, and evaluate current effective permissions.

Discovery therefore answers only:

```text
Which active memberships may this authenticated person attempt to select?
```

It does not answer:

```text
What is this person allowed to do in an organization?
```

### Permission model

The discovery endpoint does not require an organization permission because organization context does not yet exist and the endpoint returns only the authenticated person's own active selection options.

This exception is narrow. It cannot be used to search people, enumerate organizations, inspect other accounts, or retrieve membership administration data.

## Alternatives Considered

### Require the client to know organization identifiers

Rejected. Organization identifiers supplied by the client are transport input, not trusted authority, and would produce fragile or unsafe organization-selection flows.

### Reuse the organization-scoped Memberships list operation

Rejected. That service requires an already validated organization context and `memberships.view`, which creates a circular dependency for initial organization selection.

### Return every historical membership

Rejected. Ended and suspended memberships are not valid organization-context choices and would create unnecessary privacy and support exposure.

### Return roles and permissions with discovery

Rejected. Permissions must be evaluated only after the selected membership and organization boundary are validated. Discovery results would otherwise become stale authority snapshots.

### Add a new database table or cached membership index

Rejected. The existing Central Registry membership and organization records are the source of truth. A new persistence layer is unnecessary until measured scale proves otherwise.

## Consequences

### Positive

- Authenticated users can discover valid organization choices without client-declared tenant authority.
- Cross-person and inactive membership results fail closed.
- Organization selection remains separate from authentication and permission evaluation.
- The endpoint exposes a minimal, privacy-conscious contract.
- No schema change or additional source of truth is introduced.

### Negative

- Discovery performs membership and organization reads before organization context is established.
- Page-based pagination can shift if memberships change between requests.
- The client must still submit a selected membership identifier on later organization-scoped requests.
- Preferred defaults, organization hierarchy presentation, and recent-membership ordering remain separate product decisions.

## Security Rules

- The person identifier comes only from trusted account context.
- The endpoint must not accept `person_id`, `user_id`, `organization_id`, role, permission, or status filters.
- Unknown query fields fail closed.
- Only active memberships in active organizations are returned.
- Directory results for another person, malformed identifiers, invalid statuses, duplicates, or inconsistent totals are integrity failures.
- Membership reference numbers and permission data are not returned.
- Responses use `Cache-Control: no-store`.
- A discovered membership must be fully revalidated before organization access is established.
- Account membership discovery must never be treated as permission evaluation.

## Deferred

- Preferred or default membership selection.
- Recent organization ordering.
- Organization hierarchy and branch presentation.
- Suspended and ended membership history views.
- Membership search by administrators.
- Cross-organization platform-operator discovery.
- Membership caching and invalidation.
- End-to-end browser and production deployment tests.

## Related Decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0014: Build Memberships Registry Service Foundation.
- ADR 0018: Build Trusted Request Context Foundation.
- ADR 0019: Build HTTP Security Boundary.
- ADR 0020: Build Bounded Authentication HTTP Endpoints.
