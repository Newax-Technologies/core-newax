# Changelog

All notable changes to the NEWAX Memberships module are documented here.

## 0.1.0 - 2026-07-11

### Added

- Reusable membership service contracts and permission definitions.
- Organization-scoped membership creation, retrieval, listing, update, and removal.
- Read-only People and Organizations reference-directory contract.
- Membership lifecycle events.
- Membership type, text, status, and date normalization.
- Cross-organization record isolation.
- Duplicate-sensitive membership creation.
- Unit tests, documentation, version metadata, Prisma adapter, and NestJS composition.

### Security

- Every operation requires explicit organization context.
- Organization identifiers are not accepted from membership creation payloads.
- Cross-organization membership lookups return not found.
- Protected operations require explicit `memberships.*` permissions.
- Competing duplicate membership creations are serialized in PostgreSQL.
- Public HTTP controllers remain disabled until trusted authentication and tenant context exist.

### Database

- Uses the existing `core_memberships` table.
- Preserves `core_membership_roles` for the later Access Control slice.
- Does not modify People, Organizations, Users, or domain transaction tables.
