# Changelog

All notable changes to the NEWAX Users module are documented here.

## 0.1.0 - 2026-07-11

### Added

- Person-linked global user account lifecycle.
- Organization-scoped creation and visibility checks.
- Platform-context suspension, disabling, enabling, and archival.
- Email, username, and phone login identity normalization.
- Atomic account and primary identity creation.
- Identity addition, primary selection, and protected removal.
- Authentication integration gateway for identity resolution, activation, lock state, and successful-login metadata.
- PostgreSQL and Prisma repository adapter.
- NestJS composition, tests, documentation, and ADR 0016.

### Security

- User creation requires an active person, organization, and membership.
- Organization administrators cannot suspend a global account from tenant context.
- Cross-organization account visibility is concealed.
- Raw login identity values are excluded from application event logs.
- The final login identity cannot be removed.
- Credentials, password hashes, sessions, and verification flows remain outside this module.

### Database

- Uses existing `core_users` and `core_user_identities` tables.
- Does not modify membership, access-control, authentication, or domain transaction tables.
