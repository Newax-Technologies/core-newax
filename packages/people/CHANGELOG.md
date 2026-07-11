# Changelog

All notable changes to the NEWAX People module are documented here.

## 0.1.0 - 2026-07-11

### Added

- Reusable people service contracts and permission definitions.
- Person creation, retrieval, listing, update, and archive operations.
- Person identifier creation, listing, and verification operations.
- Input normalization and date validation.
- Duplicate-sensitive identifier assignment contracts.
- Person lifecycle and identifier events.
- Repository and event-publisher ports.
- Unit tests for core service behaviour.
- Prisma application adapter and NestJS module composition.

### Security

- Protected operations require explicit `people.*` permissions.
- Identifier viewing and management use separate permissions.
- Competing identifier assignments are serialized in PostgreSQL before duplicate checks.
- Public HTTP controllers remain disabled until trusted authentication and permission context exist.

### Database

- Uses the existing `core_people` and `core_person_identifiers` Central Registry tables.
- Does not modify domain profile or transaction tables.
