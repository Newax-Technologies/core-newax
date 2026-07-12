# Changelog

All notable changes to the NEWAX Trusted Request Context module are documented here.

## 0.1.0 - 2026-07-12

### Added

- Authenticated account-context resolution.
- Organization-context resolution through an explicitly selected membership.
- Membership ownership, status, and organization-status validation.
- Effective permission evaluation with tenant-boundary integrity checks.
- Immutable permission sets.
- Permission authorization helpers and existing module-context conversion.
- Request identifier generation and request-local context storage ports.
- Node `AsyncLocalStorage` adapter with concurrent-request isolation tests.
- Authentication, Memberships, Access Control, Prisma, and NestJS integration.
- Documentation, tests, Module Registry entry, and ADR 0018.

### Security

- User, person, organization, and permission authority are never accepted from request payloads.
- Organization identity is derived from the validated membership.
- Cross-person, missing, suspended, ended, and inactive membership selections use one concealed failure.
- Permission results must match the validated membership and organization boundary.
- User sessions cannot create platform context.
- Missing request-local context fails closed.

### Database

- No tables or migrations are added.
