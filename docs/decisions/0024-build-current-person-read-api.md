# ADR 0024: Build the Current Person Read API

## 1. Decision Title

Build a bounded authenticated current-person read endpoint.

## 2. Status

Accepted

## 3. Date

2026-07-12

## 4. Context

NEWAX Core now has a Central People Registry, global user accounts linked one-to-one with people, authenticated sessions, Trusted Account Request Context, and an HTTP Security Boundary.

An authenticated account needs a minimal way to display its own person identity without selecting a person record and without acquiring organization-wide People Registry authority.

The existing `people.view` permission governs organization-wide person retrieval. Requiring it for a user to view their own bounded profile would leak an administrative permission model into ordinary account self-access. Omitting authorization entirely would be equally careless, which is how simple profile endpoints become accidental directory services.

## 5. Problem

The system needs to answer:

```text
Who is the real person linked to this authenticated account?
```

It must not answer:

```text
Which person record would the client like to inspect?
```

The endpoint must preserve one Central Registry source of truth, reject client-selected person identifiers, revalidate current person state, detect trusted-context and repository boundary failures, and expose only a minimal non-sensitive profile.

## 6. Decision

NEWAX Core will expose:

```text
GET /api/core/people/current
```

The endpoint will:

- Require trusted account context.
- Derive the actor user and linked person exclusively from the authenticated session context.
- Accept no person identifier in the route, query, body, or arbitrary request header.
- Reject every query parameter.
- Reload the linked person from the People Registry source of truth.
- Require the person to remain active and non-deleted.
- Validate trusted actor, trusted person, and persisted person UUID integrity.
- Verify that the repository result matches the trusted person identifier.
- Return `Cache-Control: no-store`.
- Return only a bounded current-person profile.

### 6.1 Response contract

The response contains only:

```text
id
first_name
middle_name
last_name
preferred_name
status
```

`middle_name` and `preferred_name` may be `null`.

The response excludes:

- Government, registration, passport, professional, or other person identifiers.
- Date of birth.
- Gender.
- Contacts and addresses.
- User identities, credentials, authentication attempts, sessions, or bearer material.
- Memberships, organizations, roles, permissions, or capability summaries.
- Audit metadata.
- Internal deletion metadata.
- Creation and update timestamps.
- Domain-specific student, employee, patient, customer, supplier, or other profile data.

### 6.2 Authorization rule

Current-person access is authenticated self-access, not organization-wide People Registry access.

The HTTP endpoint uses trusted account context and does not declare `people.view` or any other organization permission.

The People package accepts a dedicated `CurrentPersonRequestContext` containing only:

```text
actorUserId
personId
```

The `personId` must already be linked to the authenticated account by Trusted Request Context. The client cannot replace it.

Organization context, roles, permission sets, membership types, and job titles do not authorize this endpoint.

### 6.3 Current-state and integrity rule

The linked person is reloaded for every current-person read.

If the person is missing, suspended, archived, or deleted, the profile is unavailable.

Malformed trusted identifiers, malformed persisted profile data, invalid deletion metadata, invalid status values, or a repository result outside the trusted person boundary are integrity failures.

### 6.4 Account-without-person rule

The current data model requires every user to reference one person. Therefore, an authenticated context without a linked person is not treated as an ordinary empty profile. It is an integrity failure in authentication or trusted-context establishment and fails closed.

## 7. Reasoning

This design preserves the established separation among People, Users, Authentication, Memberships, and Access Control.

Authentication proves the account. Trusted Request Context supplies the account-person relationship. People owns the person record and current-state validation. HTTP Security owns session enforcement, request controls, response protection, throttling, stable public errors, and audit records.

A dedicated self-access contract is smaller and safer than manufacturing a `people.self.view` permission that no existing permission-scope model supports. A future generalized self-scope permission framework may supersede this narrow rule, but it is not invented prematurely for one endpoint.

## 8. Alternatives Considered

### Require `people.view`

Rejected because it would deny ordinary authenticated accounts unless they also held organization-wide People Registry authority. It would also blur self-access and administrative directory access.

### Add `people.self.view`

Rejected for this slice because NEWAX Core does not yet define generalized self, assigned-record, department, or branch permission scopes. Adding one permission code without the broader model would create misleading architecture.

### Accept a person identifier from the client

Rejected because it would turn self-profile access into arbitrary person selection and create a direct object-reference risk.

### Read the person through the Users module

Rejected because Users owns account state and login identities, while People owns human identity records. Duplicating the profile contract in Users would create another source of truth.

### Return the complete `PersonRecord`

Rejected because it contains date of birth, gender, timestamps, and deletion metadata that are not required for self-profile presentation.

## 9. Consequences

### Positive

- Authenticated accounts can display their own minimal identity.
- Clients cannot select another person.
- Organization-wide People Registry permissions remain separate.
- Suspended, archived, deleted, or missing people stop resolving immediately.
- Sensitive identity and administrative data remain hidden.
- The Central Registry remains the sole person source of truth.
- No schema, migration, dependency, cache, or permission-model expansion is required.

### Negative

- The person record is reloaded after trusted context establishment.
- Accounts linked to inactive people cannot retrieve even a historical profile.
- Future self-service profile editing requires a separate decision and stronger validation.
- A future generalized self-scope authorization framework may require adapting this narrow contract.

## 10. Impact On NEWAX Core

The People package gains bounded current-person request and response contracts plus a read-only service operation.

The API People module gains one account-context controller.

The HTTP Security, Authentication, Users, Request Context, Prisma schema, migrations, dependency graph, and Module Registry remain unchanged.

The People package records the change in its unreleased changelog while retaining version `0.1.0` until the next controlled module release.

## 11. Impact On Client Systems

Clients gain a stable endpoint for account identity display without receiving organization authority or sensitive person records.

Client systems must not cache the response and must not infer organization roles, permissions, memberships, or domain profiles from it.

Client-specific profile data remains in the appropriate domain module.

## 12. Security Considerations

- Authentication is enforced through trusted account context.
- No route, query, body, or header person authority is accepted.
- GET request bodies remain rejected by the shared HTTP boundary.
- Every query parameter fails closed.
- Trusted and persisted UUIDs are validated.
- Repository boundary mismatches fail as integrity errors.
- Inactive and deleted people are concealed through the stable not-found mapping.
- Internal errors remain protected by the shared public error envelope.
- HTTP access remains subject to security headers, rate limiting, response redaction, and audit recording.
- The response includes no credentials, sessions, identifiers, contact information, organization authority, or audit metadata.

## 13. Scalability Considerations

The endpoint performs one indexed lookup by the `core_people` primary key.

No unbounded query, join, list, cache, or cross-organization scan is introduced.

The operation may remain inside the modular monolith and can be extracted with the People bounded context only if operational evidence later justifies service separation.

## 14. Maintenance Considerations

The endpoint follows the existing current-organization pattern for strict query rejection, bounded response mapping, current-state revalidation, integrity checks, and `no-store` responses while deliberately using account rather than organization context.

Future fields must be added explicitly to the bounded contract. They must not appear automatically because the persistence model contains them.

## 15. Related Documents

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0013: Build the People Registry Service Foundation.
- ADR 0016: Build the Users Registry Service Foundation.
- ADR 0018: Build the Trusted Request Context Foundation.
- ADR 0019: Build the HTTP Security Boundary.
- ADR 0020: Build Authentication HTTP Endpoints.
- ADR 0023: Build the Current Organization Read API.
- People Module README.
- NEWAX AI Engineering Accuracy and Verification Protocol.

## 16. Approved By

NEWAX Product, Engineering, Architecture, and Security through the approved Current Person Read API controlled slice.
