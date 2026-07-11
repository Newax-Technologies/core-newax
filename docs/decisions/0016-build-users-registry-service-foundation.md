# ADR 0016: Build the Users Registry Service Foundation

## 1. Decision Title

Build the first reusable Users Registry service foundation for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

NEWAX Core now has executable People, Organizations, Memberships, and Access Control foundations. The next required boundary is the login-capable user account connected to a central person.

A person may exist without login access. A user account is global and may be used across multiple approved organization memberships. Authentication credentials and sessions must remain separate from the account registry.

The design must prevent tenant administrators from accidentally applying platform-wide account blocks when they only intend to remove access to one organization.

## 5. Decision

NEWAX Core will provide a reusable `@newax/users` foundation package with:

- One global user account per person.
- Organization-scoped account creation and visibility.
- Platform-scoped account suspension, disabling, enabling, and archival.
- Login identity registration and primary identity management.
- An internal authentication integration gateway.
- Explicit administrative permissions.
- A persistence port, reference-directory port, and event-publisher port.
- PostgreSQL and Prisma application adapters.
- NestJS composition, tests, documentation, changelog, and version metadata.

The module owns:

```text
core_users
core_user_identities
```

The module does not own:

```text
people
organizations
memberships
roles
permissions
credentials
password hashes
sessions
MFA methods
password reset tokens
domain profiles
business transactions
```

### 5.1 Account creation

User creation requires:

- Trusted organization context.
- An active organization.
- An active person.
- An active membership connecting that person to the selected organization.
- A unique normalized primary login identity.

The user account and primary identity are created in one transaction with status `invited`.

### 5.2 Global account boundary

A user account is global across organizations.

Suspension, disabling, enabling, archival, and login identity management therefore require platform context where `organizationId` is `null`.

Organization-specific access must be removed through membership lifecycle and permission assignments rather than by applying a global account block.

### 5.3 Identity management

The first slice supports:

```text
email
username
phone
```

Identity values are normalized before uniqueness checks. One normalized identity may belong to only one user.

The final identity cannot be removed. Removing the primary identity promotes another identity atomically.

Verification flows remain owned by Authentication. The Users module stores verification state but does not expose an administrative verification shortcut.

### 5.4 Authentication integration

The Users module exports a controlled gateway that allows the later Authentication module to:

- Resolve a normalized login identity.
- Activate an invited account.
- Record successful login metadata.
- Set or clear account lock state.

Authentication does not take ownership of `core_users` or `core_user_identities`.

### 5.5 Authorization

Administrative operations require explicit permission codes:

```text
users.view
users.create
users.suspend
users.disable
users.enable
users.archive
users.identities.view
users.identities.manage
```

Business logic must not authorize by role name, job title, membership type, or account status alone.

### 5.6 HTTP boundary

Public Users endpoints remain deferred until Authentication, trusted organization and platform context resolution, permission guards, response redaction, rate limiting, and durable audit persistence exist.

## 6. Consequences

### Positive

- People remain independent from login accounts.
- One person can use one account across multiple organizations.
- Tenant administrators cannot accidentally suspend a global account from organization context.
- Login identifiers have stable normalization and uniqueness rules.
- Authentication can integrate without owning user records.
- Passwords and sessions remain isolated from account administration.
- Account history is preserved through non-destructive status changes.

### Negative

- Platform-wide account operations require a separate trusted context.
- Organization administrators must manage organization access through memberships rather than account status.
- Identity verification and activation require the later Authentication module.
- The initial adapter uses PostgreSQL advisory locks for duplicate-sensitive operations.
- External identity providers remain deferred.

## 7. Implementation Rules

- Never merge people and users into one concept.
- Never create a user without an active person and active organization membership.
- Never create more than one user for one person.
- Never allow one normalized identity to belong to multiple users.
- Never expose raw login identity values in application logs.
- Never allow organization context to perform platform-wide account status changes.
- Never remove the final login identity.
- Never store credentials or session secrets in the Users module.
- Never let Authentication take ownership of user registry tables.
- Never assume one user belongs to only one organization.

## 8. Deferred Decisions

- Public REST endpoints.
- Password credentials and password policy.
- Sessions and logout.
- MFA and recovery methods.
- Identity verification workflows.
- Invitations and activation tokens.
- Login attempts and risk controls.
- External identity providers and SSO.
- Self-service identity management.
- Durable audit and event persistence.
- Automated account effects from person archival.

## 9. Related Decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0009: Define Module Registry and Dependency Rules.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0014: Build the Memberships Registry Service Foundation.
- ADR 0015: Consolidate Roles and Permissions into Access Control.

## 10. Approval

This decision is accepted as the implementation baseline for the first Users Registry service slice.
