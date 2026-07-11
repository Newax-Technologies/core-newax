# ADR 0017: Build the Authentication Service Foundation

## 1. Decision Title

Build the first reusable Authentication service foundation for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

NEWAX Core now has executable People, Organizations, Memberships, Access Control, and Users foundations.

The Users Registry owns login-capable account identity and status. It deliberately does not own password hashes, sessions, login attempts, or authentication policy. The next controlled slice must prove login identity and issue secure sessions without collapsing Authentication back into Users.

Authentication must protect against credential disclosure, account enumeration, repeated password guessing, session-token theft, inactive-account access, and organization administrators applying platform-wide security actions.

## 5. Decision

NEWAX Core will provide a reusable `@newax/auth` foundation package with:

- Verified-identity initial password enrollment.
- Scrypt password hashing with unique random salts.
- Generic password login failures.
- Failed-attempt persistence.
- Temporary account locking after configurable repeated failures.
- Opaque session-token issuance with keyed hashes at rest.
- Session validation, touch, expiry, logout, and revocation.
- Password change with active-session revocation.
- Platform-scoped session administration.
- A controlled Users Registry integration port.
- PostgreSQL and Prisma application adapters.
- NestJS composition, tests, documentation, changelog, and version metadata.

The module owns:

```text
core_user_credentials
core_user_sessions
core_authentication_attempts
```

The module does not own:

```text
core_people
core_users
core_user_identities
core_memberships
roles
permissions
organization selection
domain profiles
business transactions
```

### 5.1 Users Registry integration

Authentication depends on the Users Registry through a controlled directory contract.

The contract permits Authentication to:

- Resolve a login identity.
- Read account status and lock state.
- Activate an invited account after valid initial credential enrollment.
- Record successful login metadata.
- Set or clear temporary account lock state.

Authentication must not take direct ownership of user account or login identity tables.

### 5.2 Password enrollment

Initial password enrollment requires:

- An existing login identity.
- Verified identity state.
- An invited account.
- A policy-compliant password that is not present on the configured whole-password blocklist.
- No existing password credential.

Credential creation and duplicate prevention are serialized with a PostgreSQL transaction-scoped advisory lock.

After credential creation, Authentication activates the invited account through the Users Registry gateway.

Identity verification workflows remain deferred. Authentication must not mark an identity verified merely because a password was supplied.

### 5.3 Password storage

The Node adapter uses scrypt with:

- A unique cryptographically random salt per credential.
- A profile of `N=2^17`, `r=8`, and `p=1`, matching the current OWASP recommendation when Argon2id is unavailable.
- Versioned encoded parameters with bounded parser values.
- Constant-time verification.
- A dummy derivation path for missing identities and credentials.
- Automatic rehashing after successful login when parameters change.

Plain-text passwords and password hashes must never appear in logs, events, responses, or audit metadata. Single-factor passwords require at least 15 Unicode code points, accept spaces and Unicode, use NFC normalization, and must not be subject to forced character-type composition rules. New passwords are compared as complete values against a blocklist of common, expected, or compromised passwords.

### 5.4 Login attempts and locking

Authentication attempts are append-oriented records containing:

- Optional user identifier.
- A keyed fingerprint of the presented login identity.
- Outcome.
- Optional IP address and user-agent metadata.
- Timestamp.

Raw login identity values are not stored in attempt records.

Unknown identity and invalid password failures return the same public error.

The initial default policy is:

```text
Failure window: 15 minutes
Maximum failures: 5
Account lock: 15 minutes
```

When a known account reaches the threshold, Authentication sets `locked_until` through the Users Registry gateway and revokes active sessions.

### 5.5 Session tokens

Sessions use opaque random tokens.

Rules:

- Tokens contain at least 256 bits of cryptographic randomness.
- The plain token is returned only at issuance.
- A keyed HMAC hash is stored in `core_user_sessions`.
- The token pepper is provided through validated application configuration.
- Production must provide an explicit pepper of at least 32 characters.
- Session expiry is absolute.
- Last-seen writes are throttled by a configurable interval.
- Invalid account state or an active lock invalidates a session.
- Password changes revoke active sessions.

### 5.6 Authorization boundary

Authentication proves identity. It does not choose an organization or calculate permissions.

The downstream sequence remains:

```text
Authenticated user
  -> selected active membership
  -> effective permissions
  -> organization-scoped operation
```

Session administration affects a global account and therefore requires platform context.

### 5.7 HTTP boundary

Public login and session endpoints remain deferred until the following are defined and tested:

- Request throttling.
- Secure cookie or bearer-token transport.
- CSRF policy.
- Trusted proxy and client-IP handling.
- Security headers.
- Response redaction.
- Durable audit persistence.

## 6. Consequences

### Positive

- Credentials and sessions remain separate from account identity.
- Password verification does not expose account existence through different errors.
- Repeated guessing can lock known accounts and revoke sessions.
- Session tokens are not stored in recoverable form.
- Authentication policy is centrally validated and configurable.
- Account status remains owned by Users while Authentication can enforce it.
- Membership and permission logic remain downstream and organization-aware.

### Negative

- Authentication depends on secure environment-secret management.
- Login attempts add a retention and privacy obligation.
- Account locking can be abused for denial of service without later IP and risk controls.
- Password authentication remains only one factor.
- The baseline blocklist must be replaced or supplemented with a production-scale compromised-password corpus before public endpoints are enabled.
- Public endpoints require another security-reviewed slice.
- Scrypt parameters require periodic security review.

## 7. Implementation Rules

- Never store or log plain-text passwords.
- Never log password hashes, session tokens, or token peppers.
- Never store raw login identity values in authentication-attempt records.
- Never return different public errors for unknown identity and invalid password.
- Never activate an invited account before verified identity and credential enrollment.
- Never store plain session tokens.
- Never allow inactive or locked accounts to maintain valid sessions.
- Never let organization context perform global session administration.
- Never treat authentication success as organization access.
- Never let Authentication own people, users, memberships, roles, or permissions.
- Always revoke active sessions after password change.
- Always require an explicit production token pepper.

## 8. Deferred Decisions

- Public login, logout, password, and session endpoints.
- Invitation tokens and identity verification workflows.
- Password reset and account recovery.
- MFA, passkeys, OTP, and magic links.
- External identity providers and SSO.
- Refresh-token families and session rotation.
- IP and device risk scoring.
- Distributed rate limiting.
- Durable audit and event persistence.
- Authentication-attempt retention and deletion policy.

## 9. Related Decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0009: Define Module Registry and Dependency Rules.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0015: Consolidate Roles and Permissions into Access Control.
- ADR 0016: Build the Users Registry Service Foundation.

## 10. Approval

This decision is accepted as the implementation baseline for the first Authentication service slice.
