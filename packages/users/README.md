# NEWAX Users Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

The Users module maintains login-capable account records linked to central people without treating every person as a user.

A person may exist without login access. One person may have one global user account and multiple organization memberships. The account identifies who may authenticate; memberships and Access Control determine where that person may operate and what actions are allowed.

## Owned concepts and data

The module owns:

- User account lifecycle.
- Login identity registration and primary identity selection.
- Account status, lock state, and last successful login metadata.
- Read-only authentication integration contracts.
- User lifecycle events.

Database ownership:

- `core_users`
- `core_user_identities`

The module does not own people, organizations, memberships, roles, permissions, credentials, password hashes, sessions, MFA methods, password-reset tokens, domain profiles, or business transactions.

## Public module API

The package exports:

- `UsersService`
- `UserAuthenticationGateway`
- `UsersRepository`
- `UserReferenceDirectory`
- `UserEventPublisher`
- `UserIdentityNormalizer`
- User request, persistence, response, event, and authentication contracts
- `USER_PERMISSIONS`
- `UserModuleError`

Administrative operations:

```text
create
getById
list
suspend
disable
enable
archive
listIdentities
addIdentity
setPrimaryIdentity
removeIdentity
```

Authentication integration:

```text
resolveIdentity
activateInvitedUser
recordSuccessfulLogin
setLockedUntil
```

## Identity separation

```text
Person
  -> User account
  -> Login identities

Person
  -> Memberships
  -> Organization roles
  -> Permissions
```

A user account does not grant organization access. Authentication must combine user status with an active membership and evaluated permissions.

## Account creation

User creation requires:

- An active organization selected in trusted request context.
- An active person.
- An active membership connecting that person to the selected organization.
- A unique normalized login identity.
- Explicit `users.create` permission.

The account and primary identity are created atomically with status `invited`.

One person may have only one user account. One normalized login identity may belong to only one user.

## Account-wide operations

Suspension, disabling, enabling, archival, and login identity management affect a global account shared across organizations. These operations therefore require platform context where `organizationId` is `null`.

Organization administrators should revoke one organization’s access by ending or suspending the relevant membership, not by suspending the global user account. Blocking someone everywhere because one branch dislikes them would be impressive governance theatre, but poor infrastructure.

## Account statuses

```text
invited
active
suspended
disabled
archived
```

- `invited`: account exists but activation is incomplete.
- `active`: authentication may proceed subject to identity verification, lock state, memberships, and permissions.
- `suspended`: temporary platform-wide access block.
- `disabled`: explicit platform-wide access block.
- `archived`: retained for records and permanently unavailable to normal account administration.

Only the authentication integration gateway may activate an invited account.

## Login identities

Supported identity types in this slice:

```text
email
username
phone
```

Normalization rules:

- Email addresses are trimmed and lowercased.
- Usernames are trimmed, lowercased, and restricted to approved characters.
- Phone numbers use normalized E.164 format.

The final identity cannot be removed. Removing the primary identity automatically promotes another identity in the same transaction.

Identity verification remains an Authentication responsibility. The Users module stores verification state but does not provide an administrative shortcut that pretends proof occurred.

## Permissions

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

Organization-scoped viewing conceals accounts whose people do not have active or suspended memberships in the selected organization.

Account-wide status and identity changes require platform context.

## Concurrency and consistency

The PostgreSQL adapter uses transaction-scoped advisory locks for:

- Account creation by person and normalized identity.
- Identity addition by user and normalized identity.
- Primary identity changes.
- Identity removal.

Locks are acquired in sorted order to reduce deadlock risk.

## Dependencies

The module depends on:

- People `>=0.1.0`
- Organizations `>=0.1.0`
- Memberships `>=0.1.0`

It does not depend directly on Authentication or Access Control. Administrative permissions arrive through trusted request context. Authentication uses the exported gateway without taking ownership of user records.

## Events

```text
user.created
user.suspended
user.disabled
user.enabled
user.archived
user.identity_added
user.identity_removed
user.primary_identity_changed
```

Raw login identity values are excluded from application log events.

## HTTP exposure

This slice does not expose public HTTP endpoints.

Controllers remain deferred until authentication, trusted membership and platform context resolution, permission guards, response redaction, rate limiting, and durable audit persistence exist.

## Known limitations

- Public REST endpoints are not enabled.
- Passwords, sessions, MFA, verification flows, login attempts, and password reset remain deferred to Authentication.
- Self-service profile and identity changes are deferred.
- External identity providers and SSO subjects are deferred.
- Durable audit and event persistence remain deferred.
- Automated account effects from person archival remain deferred.

## Related decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0014: Build the Memberships Registry Service Foundation.
- ADR 0015: Consolidate Roles and Permissions into Access Control.
- ADR 0016: Build the Users Registry Service Foundation.
