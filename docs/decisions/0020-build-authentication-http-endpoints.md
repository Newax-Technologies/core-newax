# ADR 0020: Build Bounded Authentication HTTP Endpoints

- Status: Accepted
- Date: 2026-07-12
- Owners: NEWAX Engineering

## Context

Authentication, Trusted Request Context, and the HTTP Security Boundary now exist as separate verified layers.

Authentication proves a user identity and issues revocable sessions. Trusted Request Context converts a valid session into account or organization execution context. HTTP Security protects the transport boundary through HTTPS, trusted proxy handling, request framing, origin checks, CSRF validation, throttling, response controls, and durable audit records.

The system still requires a minimal browser-facing authentication surface. Exposing every authentication capability at once would mix verified core services with unfinished recovery, invitation, MFA, organization-selection, and administrative workflows. It would also make it easier for client-controlled request data to leak into trusted identity or tenant context.

## Decision

NEWAX will expose only four initial authentication endpoints:

- `POST /api/auth/login`
- `GET /api/auth/session`
- `GET /api/auth/csrf`
- `POST /api/auth/logout`

These endpoints are application-layer adapters. They do not change ownership of Authentication, Trusted Request Context, or HTTP Security.

### Login

Login is the only unauthenticated state-changing endpoint currently allowed.

It must:

- Be explicitly marked as a public authentication mutation.
- Use the authentication-sensitive rate limit.
- Pass exact Origin or Referer validation and Fetch Metadata checks.
- Accept only a strict JSON body containing `identityType`, `identityValue`, and `password`.
- Reject unknown properties, unsupported identity types, malformed objects, and oversized values.
- Delegate credential verification, account locking, and session creation to Authentication.
- Place the opaque session token only in a host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Never return the raw session token in the response body.
- Issue a session-bound CSRF token in a host-only `Secure`, `SameSite=Strict` cookie and response body.
- Mark the successfully authenticated user and session on the server-side request object only for durable HTTP audit context.

The HTTP guard must fail closed if public mutation metadata is used without public context, authentication-sensitive throttling, and a state-changing method.

### Session inspection

Session inspection requires trusted account context.

It returns only:

- Authenticated state.
- User identifier.
- Person identifier.
- Session identifier.
- Session expiry.

It does not select an organization, calculate permissions, or return credentials, tokens, account internals, IP addresses, or user-agent history.

### CSRF bootstrap

CSRF bootstrap requires trusted account context.

It issues a fresh token bound to the already validated session. The CSRF cookie lifetime must not exceed the remaining session lifetime.

### Logout

Logout requires trusted account context and normal state-changing request protections, including CSRF validation.

It revokes the presented opaque session through Authentication and clears both the session and CSRF cookies. Logout does not accept a user identifier or session identifier from the request body.

### Public mutation boundary

Ordinary public state-changing endpoints remain prohibited.

A dedicated `PublicAuthenticationEndpoint` metadata contract is used instead of weakening `PublicEndpoint`. This preserves the default rule that unauthenticated mutations are denied unless the endpoint is explicitly recognized as an authentication-sensitive transport operation.

### Audit behavior

Successful public authentication mutations are recorded through the HTTP security audit sink even though no trusted request context existed before the controller ran.

The controller may attach only the server-authenticated user and session identifiers for this purpose. Raw session tokens, passwords, CSRF secrets, and login identity values must not be added to request audit metadata.

## Alternatives Considered

### Expose all Authentication service operations

Rejected. Password enrollment, password changes, recovery, session administration, invitation handling, MFA, and external identity providers require additional product and security decisions.

### Return bearer tokens in JSON

Rejected. The initial browser transport uses secure host-only cookies to reduce accidental token exposure to application code, logs, browser storage, and client-side state management.

### Allow all public state-changing endpoints after Origin validation

Rejected. Origin validation is necessary but does not justify changing the default-deny policy for unrelated unauthenticated mutations.

### Merge HTTP controllers into the Authentication foundation module

Rejected. Authentication remains transport-independent. NestJS controllers, cookies, headers, and browser policy belong to the application and HTTP boundary layers.

### Require organization selection during login

Rejected. Authentication proves account identity only. Organization authority must be established later through a validated membership and Trusted Request Context.

## Consequences

### Positive

- The first browser authentication workflow becomes usable without weakening the foundation boundaries.
- Session tokens remain outside response bodies and browser storage contracts.
- Public login receives exact-origin controls, strict parsing, sensitive throttling, generic failures, and durable auditing.
- Tenant selection remains separate from authentication.
- Future recovery, MFA, passkey, and SSO workflows can be added as separately reviewed slices.

### Negative

- Clients must manage both session and CSRF cookies and send the CSRF token header on state-changing authenticated requests.
- The first HTTP surface does not include password setup, password reset, account recovery, MFA, or organization selection.
- End-to-end reverse-proxy and browser tests remain necessary before production deployment.

## Security Rules

- Production authentication endpoints require HTTPS.
- Login accepts no organization, membership, role, permission, person, user, session, or status authority from the caller.
- Login failures remain generic.
- Raw session tokens are cookie-only and never returned in JSON.
- Public login must be exact-origin validated and authentication-rate-limited.
- Authenticated mutations require session-bound CSRF validation.
- Cookie lifetimes must not exceed session expiry.
- Response bodies use stable minimal contracts and `Cache-Control: no-store`.
- Unknown request properties fail closed.
- Public authentication mutation metadata cannot be reused as a general public-write bypass.

## Deferred

- Password enrollment endpoints.
- Password change endpoints.
- Password reset and account recovery.
- Invitation and identity-verification workflows.
- MFA, passkeys, OTP, magic links, SSO, and external identity providers.
- Refresh-token rotation and session families.
- Organization and membership selection APIs.
- User-managed session listing and revocation.
- Administrative authentication endpoints.
- End-to-end browser, reverse-proxy, and deployment tests.

## Related Decisions

- ADR 0010: Define authentication and user identity strategy.
- ADR 0017: Build Authentication service foundation.
- ADR 0018: Build Trusted Request Context foundation.
- ADR 0019: Build HTTP Security Boundary.
