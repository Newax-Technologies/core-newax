# ADR 0019: Build the HTTP Security Boundary

## 1. Decision Title

Build the first reusable HTTP Security Boundary for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-12

## 4. Context

NEWAX Core now has executable Organizations, People, Memberships, Access Control, Users, Authentication, and Trusted Request Context foundations and platform services.

Those internal boundaries are not sufficient by themselves. Network requests remain untrusted until the application has established secure transport assumptions, safe request framing, origin integrity, authenticated session context, membership context, effective permissions, abuse controls, response controls, and auditable outcomes.

Public controllers introduced before this boundary would be forced to implement security independently. That would produce inconsistent cookie handling, origin checks, rate limits, errors, logging, and permission enforcement across modules.

The next controlled slice must provide one shared HTTP boundary without making Foundation Modules depend on HTTP or NestJS.

## 5. Decision

NEWAX Core will provide a reusable `@newax/http-security` platform service package and NestJS application adapters with:

- Production HTTPS enforcement.
- Exact trusted proxy networks.
- Early request processing before body parsing.
- Request-method, expectation, framing, and declared-size validation.
- Server-controlled request identifiers.
- Security response headers.
- Secure host-only session and CSRF cookies.
- Exact-origin and Fetch Metadata validation.
- JSON body enforcement for state-changing requests.
- Signed session-bound CSRF protection.
- PostgreSQL-backed distributed rate limiting.
- Trusted Request Context resolution.
- Explicit permission metadata and enforcement.
- Sensitive response redaction.
- Stable public error envelopes.
- HTTP security audit records.

The module owns:

```text
core_http_rate_limit_buckets
```

The module writes governance events to the shared:

```text
core_audit_logs
```

It does not own Authentication sessions, Users, Memberships, Organizations, roles, permissions, or domain records.

### 5.1 Protocol and deployment

The boundary is named for HTTP because HTTP is the application protocol.

Production clients must connect over HTTPS.

The application may receive plain HTTP from a trusted reverse proxy after TLS termination only when:

- The proxy network is explicitly configured.
- The application port is private.
- Forwarded protocol and client-address values are accepted only from those networks.
- Direct public access to the application port is prevented by infrastructure controls.

Hop-count proxy trust is not allowed because proxy-path length is not a stable security identity.

Production configuration must provide:

- `HTTP_REQUIRE_HTTPS=true`
- Exact HTTPS origins
- An explicit CSRF secret
- Exact trusted proxy IP addresses or CIDR networks

### 5.2 Early request boundary

The early middleware runs before body parsing and route handlers.

It must:

- Generate a server-controlled UUID request identifier.
- Apply security headers.
- Reject unsupported methods.
- Reject method-override headers.
- Reject unsupported expectation headers.
- Reject duplicate, ambiguous, or malformed HTTP request framing.
- Reject unsupported transfer encodings.
- Reject declared body sizes above the configured limit.
- Reject insecure requests when HTTPS is required.

Client-supplied request identifiers are not used as server audit identifiers. A later decision may preserve them as separately labelled untrusted correlation metadata.

### 5.3 Browser session transport

Browser sessions use:

```text
__Host-newax_session
```

The session cookie is host-only, `Secure`, `HttpOnly`, `Path=/`, `SameSite=Lax`, and has no `Domain` attribute.

The CSRF cookie uses:

```text
__Host-newax_csrf
```

The CSRF cookie is host-only, `Secure`, `Path=/`, readable by the same-origin client, and `SameSite=Strict`.

Cookie clearing uses both `Max-Age=0` and a past `Expires` value.

Bearer authorization headers, refresh-token families, service credentials, and native-client transport remain deferred.

### 5.4 Organization selection

The client may select a membership through:

```text
x-newax-membership-id
```

The header is not organization authority.

Trusted Request Context derives the organization from the membership and verifies:

- Authenticated user and person.
- Membership ownership.
- Active membership status.
- Active organization status.
- Effective permissions.

Client-supplied user, person, organization, role, status, and permission values are never accepted as authority.

### 5.5 Origin and CSRF protection

State-changing requests require:

- An exact allowed `Origin` or an allowed-origin `Referer` fallback.
- Acceptable Fetch Metadata site classification.
- JSON or structured JSON content type when a body exists.
- An authenticated account context.
- A signed CSRF token supplied in both the CSRF cookie and `x-newax-csrf` header.

CSRF tokens contain cryptographic randomness, are signed with keyed HMAC, and are bound to the authenticated session identifier.

The CSRF token is an integrity token rather than a confidential value. It may be returned to the same-origin client, while passwords, session tokens, credential hashes, and cryptographic secrets remain confidential.

CORS does not replace authentication, CSRF protection, or authorization.

### 5.6 Rate limiting

Rate limits are applied before Authentication and Trusted Request Context resolution.

Rate-limit keys combine trusted client-address resolution and route identity.

Authentication-sensitive routes use lower limits.

The initial store uses PostgreSQL fixed-window buckets so limits remain consistent across application instances. Keys are HMAC-hashed before persistence so raw IP-and-route values are not stored in the rate-limit table.

The design may later be replaced with an edge or dedicated distributed limiter without changing route policy contracts.

### 5.7 Permission enforcement

Route permission metadata is valid only for organization-context endpoints.

Permission codes are validated, deduplicated, and checked against the immutable effective permission set produced by Trusted Request Context.

Role names, job titles, membership types, request headers, and client claims are not authorization evidence.

Endpoints without explicit context metadata default to organization context and therefore fail closed.

### 5.8 Response and error controls

Successful responses pass through a sensitive-value redactor.

The redactor removes credentials, passwords, secrets, cookies, raw session tokens, authorization values, private keys, recovery materials, and related normalized key variants.

Public errors use stable generic envelopes with a server request identifier.

Internal error messages, stack traces, SQL details, persistence details, and security-rule internals are not returned.

Only known NEWAX error-code namespaces are eligible for domain error mapping. Arbitrary thrown objects cannot choose their own HTTP status by including a `code` property.

### 5.9 Security headers

The API applies:

- No-store cache policy.
- A restrictive API Content Security Policy.
- Cross-origin opener and resource policies.
- Origin agent clustering.
- Restrictive Permissions Policy.
- No-referrer policy.
- MIME sniffing protection.
- Frame denial.
- Cross-domain policy denial.
- HSTS for secure requests.

HSTS preload remains disabled by default and requires deliberate infrastructure review.

### 5.10 Audit behavior

The boundary records security denials, failures, and completed authenticated state-changing requests in `core_audit_logs`.

Audit records exclude:

- Raw cookies.
- Session tokens.
- CSRF tokens.
- Passwords and credentials.
- Request bodies.
- Complete query strings.
- Exception messages and stack traces.

Early denial and completion audit writes are best-effort. Failure to write an audit record does not automatically fail an otherwise valid business operation, but the audit-write failure is logged through a structured event without secret content.

Domain modules remain responsible for their own business audit events. HTTP audit does not replace transaction or domain auditing.

### 5.11 Public endpoint posture

This decision permits explicitly marked safe public reads, such as basic health status.

Unauthenticated state-changing endpoints remain disabled.

Business controllers remain deferred until each endpoint has explicit context, permission, validation, redaction, idempotency, audit, and abuse-control decisions.

## 6. Consequences

### Positive

- Transport, browser, tenant, permission, response, and audit controls are applied consistently.
- Foundation Modules remain independent of HTTP and NestJS.
- The application fails closed when route metadata is incomplete.
- Proxy trust is bound to network identity rather than deployment hop count.
- Rate limits work across multiple application instances.
- Raw rate-limit key material is not persisted.
- State-changing requests require authenticated context and CSRF integrity.
- Public errors do not disclose internal implementation details.
- Successful state changes are audited after the operation completes.

### Negative

- Production deployment now requires explicit proxy-network and secret configuration.
- PostgreSQL receives additional rate-limit writes.
- Fixed-window limiting is less sophisticated than edge or risk-based controls.
- `SameSite=Lax` session transport assumes a same-site web architecture for the initial browser client.
- Audit writes are not transactionally coupled to domain writes.
- Public Authentication mutations require a later, explicitly reviewed exception to the default public-mutation denial.
- Multipart uploads and streaming bodies require a separate boundary.

## 7. Implementation Rules

- Never expose the production API over plain HTTP.
- Never trust forwarded protocol or client-address headers from unconfigured networks.
- Never use hop-count proxy trust in production.
- Never trust a client-supplied request identifier as the server audit identifier.
- Never accept client-supplied user, person, organization, role, status, or permission authority.
- Always run the early boundary before body parsing and routing.
- Always reject ambiguous request framing.
- Always derive organization identity through Trusted Request Context.
- Always require exact allowed origins for state-changing browser requests.
- Always bind CSRF tokens to the authenticated session.
- Never store plain rate-limit keys.
- Never return internal error details or stack traces.
- Never log cookies, passwords, session tokens, CSRF tokens, request bodies, or query strings.
- Never place permission metadata on public or account-context routes.
- Always audit completed authenticated state-changing requests after handler success.
- Foundation Modules must not depend on the HTTP Security Boundary.

## 8. Deferred Decisions

- Public Authentication endpoints.
- Identity verification and invitation endpoints.
- Password reset and account recovery endpoints.
- Bearer tokens and native-client transport.
- Service-account and machine transport.
- Trusted platform-operator HTTP context.
- Refresh-token families and token rotation.
- Edge and risk-based rate limiting.
- Device, network, reputation, and behavior scoring.
- Multipart and file-upload security boundary.
- Streaming request and response security.
- Transactional audit outbox.
- Distributed tracing and external correlation identifiers.

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
- ADR 0017: Build the Authentication Service Foundation.
- ADR 0018: Build the Trusted Request Context Foundation.

## 10. Approval

This decision is accepted as the implementation baseline for secure browser HTTP entry into NEWAX Core.
