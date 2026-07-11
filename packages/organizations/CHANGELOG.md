# Changelog

All notable changes to the NEWAX Organizations module are documented here.

## 0.1.0 - 2026-07-11

### Added

- Reusable organization service contracts and permission definitions.
- Organization creation, retrieval, listing, update, and archive operations.
- Parent validation and hierarchy cycle prevention.
- Active-child archive protection.
- Organization lifecycle events.
- Repository and event-publisher ports.
- Unit tests for core service behavior.
- Prisma application adapter and NestJS module composition.

### Security

- Protected operations require explicit `organizations.*` permissions.
- No public HTTP controller is exposed before trusted authentication and permission context exist.

### Database

- Uses the existing `core_organizations` Central Registry table.
- Uses parent hierarchy data owned by the Organization foundation.
