# Database

## Purpose

The `database/` folder is reserved for module-owned persistence contracts and database artifacts when implementation begins.

## What Belongs Inside

- Module schema documentation.
- Migration files when approved.
- Seed data for development or tests when approved.
- Data ownership notes.
- Retention, audit, and compatibility guidance.

## What Should Never Be Placed Inside

- Another module's data model.
- Direct modifications to another module's owned tables.
- Client-specific schema changes inside reusable core tables without approval.
- Business logic that belongs in `services/`.
- Secrets or production data.

## Best Practices

- Document owned data clearly.
- Keep migrations reversible or document why they are not.
- Coordinate cross-module data access through contracts.
- Update tests and changelogs for schema changes.
- Treat database ownership as part of the module boundary.
