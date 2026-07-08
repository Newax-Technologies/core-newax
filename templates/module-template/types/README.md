# Types

## Purpose

The `types/` folder defines shared module types, schemas, interfaces, and contract shapes when implementation begins.

## What Belongs Inside

- Public module types.
- Internal module types when they need a shared home.
- API contract types.
- Event payload types.
- Configuration and permission type definitions.

## What Should Never Be Placed Inside

- Runtime business logic.
- UI components.
- Database migrations.
- Client-specific type forks inside reusable core contracts.
- Unused generic types with no clear owner.

## Best Practices

- Keep public types stable and documented.
- Separate internal-only types from exported contracts.
- Update `CHANGELOG.md` for contract-impacting type changes.
- Avoid broad catch-all types that weaken module boundaries.
- Keep client-specific type extensions outside reusable core contracts unless approved.
