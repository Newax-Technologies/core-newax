# NEWAX Reusable Module Template

This directory is the official template every future reusable NEWAX Core module must follow.

It is documentation and structure only. It must not contain production business logic.

## What A NEWAX Module Is

A NEWAX module is a reusable, documented, independently understandable unit of product or platform capability inside NEWAX Core.

A module must have:

- A clear responsibility.
- Explicit ownership boundaries.
- Documented APIs, services, events, permissions, configuration, and data expectations.
- Tests that verify its reusable behavior.
- A version and changelog that communicate change impact.
- A safe extension model for client-specific needs.

## Required Structure

Every reusable module must follow this folder structure:

```text
module-name/
|-- api/
|-- components/
|-- config/
|-- database/
|-- docs/
|-- events/
|-- pages/
|-- permissions/
|-- services/
|-- stores/
|-- tests/
|-- types/
|-- CHANGELOG.md
|-- README.md
`-- VERSION
```

Folders may remain empty during early planning, but every folder must have a documented purpose before the module is approved as reusable.

## Required Documentation

Each module must include:

- `README.md` with the module purpose, boundaries, ownership, usage guidance, dependencies, extension points, and approval status.
- `CHANGELOG.md` with release history and change impact.
- `VERSION` with the current module version.
- Folder-level README files explaining what belongs in each area.
- Supporting documentation under `docs/` for contracts, decisions, integration notes, and operational guidance.

Documentation must change in the same commit as behavior, contract, permission, event, configuration, database, or version changes.

## Versioning

Each reusable module has its own version, even when modules are maintained in the same repository.

Versioning rules:

- Start unreleased or early reusable modules at `0.1.0`.
- Update `VERSION` when reusable behavior, contracts, permissions, schemas, events, or configuration changes.
- Record every meaningful change in `CHANGELOG.md`.
- Mark breaking changes clearly.
- Do not treat an undocumented change as reusable.

## Testing Expectations

Each reusable module must define and maintain tests for its public behavior.

Expected coverage includes:

- API behavior.
- Service behavior.
- Permission enforcement.
- Configuration behavior.
- Event contracts.
- Database contracts, migrations, or schema rules when applicable.
- Client extension points.

A module is not reusable until its critical behavior can be verified.

## Configuration Philosophy

Configuration should make modules adaptable without changing reusable core behavior.

Configuration must be:

- Explicit.
- Documented.
- Safe by default.
- Client-neutral in the reusable module.
- Kept separate from secrets.
- Covered by tests when it changes behavior.

Client-specific values belong in client configuration or extension layers, not in reusable module internals.

## Event Philosophy

Events should describe meaningful facts that other modules may react to.

Events must be:

- Named clearly.
- Module-scoped where appropriate.
- Documented with payload expectations.
- Stable enough for consumers.
- Versioned or migrated when contracts change.

Events must not be used to hide unclear ownership boundaries or undocumented coupling.

## Permission Philosophy

Permissions are part of the module contract.

Permission rules must be:

- Explicit.
- Documented.
- Enforced consistently across APIs and services.
- Tested before reuse.
- Updated in the changelog when changed.

Client-specific permission behavior must use approved configuration or extension mechanisms. Client customizations must not modify the reusable core module directly.

## How To Use This Template

When creating a new reusable module:

1. Copy this template into the new module folder.
2. Rename the module folder using NEWAX naming conventions.
3. Replace placeholder documentation with module-specific details.
4. Keep unused folders documented until they are intentionally removed or approved as unused.
5. Complete the module approval checklist before marking the module reusable.
