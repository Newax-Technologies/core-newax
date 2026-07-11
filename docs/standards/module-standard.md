# NEWAX Module Standard

## Purpose

This document defines the mandatory structure, rules, and quality standards for every reusable NEWAX Core module.

A module becomes reusable only when it has clear boundaries, documented behavior, predictable versioning, tests, permission rules, and a safe extension model for client-specific needs.

This standard is for internal NEWAX engineering use. It does not define implementation code.

## 1. What A NEWAX Module Is

A NEWAX module is a reusable, documented, independently understandable unit of product or platform capability inside NEWAX Core.

A module must:

- Own a clear responsibility.
- Define its public API or integration surface.
- Keep internal implementation details private to the module.
- Document its configuration, permissions, events, database ownership, and extension points.
- Be testable in isolation where practical.
- Be safe to reuse across future NEWAX products, clients, or verticals.

A reusable module should be understandable from its `README.md`, `docs/`, `VERSION`, and `CHANGELOG.md` before an engineer reads any future implementation.

## 2. What A Module Is Not

A NEWAX module is not:

- A random folder for related files.
- A dumping ground for shared utilities.
- A client-specific customization area.
- A place for undocumented business rules.
- A dependency that reaches into other modules without a contract.
- A feature branch disguised as reusable architecture.
- A module simply because it has a folder under `packages/`.

A folder becomes a reusable module only after it satisfies this standard and passes the approval checklist.

## 3. Required Module Folder Structure

Every reusable module must follow this structure:

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

Folders may remain empty during planning, but the module must explain which folders are intentionally unused and why before it is approved as reusable.

## 4. Required Files

Each reusable module must include:

| File           | Purpose                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `README.md`    | Explains the module purpose, ownership, boundaries, public surface, setup assumptions, and usage guidance. |
| `CHANGELOG.md` | Tracks user-impacting, integration-impacting, schema-impacting, and permission-impacting changes.          |
| `VERSION`      | Contains the current module version in a simple, documented format.                                        |

The module `README.md` must include:

- Module purpose.
- Owned concepts and data.
- Public APIs or entry points.
- Dependencies on other modules.
- Permission requirements.
- Configuration options.
- Events emitted or consumed.
- Testing expectations.
- Client customization guidance.

## 5. Naming Conventions

Module naming must be consistent and predictable.

Rules:

- Module folders must use lowercase kebab-case, such as `organizations` or `identity-access`.
- File and folder names must be descriptive and avoid abbreviations unless the abbreviation is a NEWAX standard.
- Public names must be stable and clear enough for cross-team use.
- Internal names must not expose client-specific language unless the module is explicitly scoped to an example or client extension layer.
- Database objects, events, permissions, and configuration keys must include the module context when needed to avoid ambiguity.

Avoid names that are too generic, such as `common`, `shared`, `misc`, `helpers`, or `utils`, unless a standard explicitly defines their purpose.

## 6. API Rules

The `api/` folder is reserved for module-facing or application-facing API definitions and handlers.

Rules:

- APIs must expose module capabilities through deliberate contracts.
- APIs must not expose internal storage details.
- APIs must validate permissions before performing protected actions.
- APIs must not bypass the service layer for business operations.
- API request and response shapes must be documented when they are reused outside the module.
- Breaking API changes must update `VERSION`, `CHANGELOG.md`, and relevant documentation.
- Client-specific API differences must be implemented through approved extension points, not by modifying reusable core module behavior directly.

## 7. Service Layer Rules

The `services/` folder is reserved for module use cases, orchestration, and application-level behavior.

Rules:

- Services must express meaningful module operations.
- Services must coordinate validation, permissions, persistence, events, and external module calls through documented boundaries.
- Services must not depend on UI components or page-level behavior.
- Services must not directly mutate another module's owned data.
- Cross-module interactions must use approved APIs, contracts, or events.
- Service behavior must be covered by tests before the module is approved as reusable.

## 8. Database Rules

The `database/` folder is reserved for module-owned persistence documentation, migrations, schemas, seeds, and data access boundaries when implementation begins.

Rules:

- Each module must clearly document the data it owns.
- A module must not directly modify another module's owned tables or records.
- Shared data access must happen through approved services, APIs, events, or documented contracts.
- Schema changes must be documented in `CHANGELOG.md` when they affect consumers, permissions, reports, integrations, or client behavior.
- Database changes must include migration, rollback, and compatibility notes when applicable.
- Client-specific fields must not be added to reusable core tables without an approved extension strategy.

## 9. Permission Rules

The `permissions/` folder is reserved for module permission definitions, access rules, and authorization documentation.

Rules:

- Every protected action must have an explicit permission rule.
- Permission names must be documented and stable.
- APIs and services must enforce permissions consistently.
- Permission checks must not be duplicated in inconsistent ways across UI, API, and service layers.
- Permission-impacting changes must update `README.md`, `CHANGELOG.md`, tests, and approval notes.
- Client-specific permission behavior must use documented configuration or extension points, not direct edits to reusable core permission rules.

## 10. Configuration Rules

The `config/` folder is reserved for module configuration contracts and defaults.

Rules:

- Configuration options must be documented before reuse.
- Defaults must be safe for internal development and future production use.
- Required configuration must be clearly identified.
- Sensitive values must not be committed to the repository.
- Client-specific configuration must be isolated from reusable module code.
- Configuration changes that affect behavior must update `CHANGELOG.md` and tests.

## 11. Event Rules

The `events/` folder is reserved for module event definitions, event contracts, and event documentation.

Rules:

- Events must represent meaningful business or system facts.
- Event names must be stable, descriptive, and module-scoped where appropriate.
- Event payloads must be documented.
- Consumers must not rely on undocumented payload fields.
- Breaking event changes must update `VERSION`, `CHANGELOG.md`, tests, and affected module documentation.
- Events must not be used to hide unclear ownership boundaries.

## 12. Testing Rules

The `tests/` folder is reserved for module tests.

A reusable module must include or plan tests for:

- Public API behavior.
- Service layer behavior.
- Permission enforcement.
- Configuration behavior.
- Database migrations or schema contracts when applicable.
- Event emission and consumption when applicable.
- Client extension points when applicable.

A module must not be approved as reusable if its key behavior cannot be tested or verified.

## 13. Documentation Rules

The `docs/` folder is reserved for module-specific documentation.

Module documentation must cover:

- Purpose and scope.
- Ownership boundaries.
- Public contracts.
- Internal dependencies.
- Permission model.
- Configuration model.
- Events.
- Database ownership.
- Testing approach.
- Known limitations.
- Client customization and extension guidance.

Documentation must be updated in the same change as behavior, contract, permission, configuration, database, or event changes.

## 14. Versioning Rules

Each reusable module must include a `VERSION` file.

Rules:

- The version must change when reusable behavior, contracts, permissions, data structures, events, or configuration change.
- Version changes must be intentional and reflected in `CHANGELOG.md`.
- Breaking changes must be clearly identified before release or reuse.
- Experimental modules must state that they are not yet approved for reuse.
- Versioning applies at the module level even when modules live inside the same repository.

Recommended version format during early NEWAX Core planning:

```text
0.1.0
```

## 15. Changelog Rules

Each reusable module must include `CHANGELOG.md`.

The changelog must record:

- Added capabilities.
- Changed behavior.
- Deprecated behavior.
- Removed behavior.
- Permission changes.
- Database or schema changes.
- Event changes.
- Configuration changes.
- Client-impacting changes.

Changelog entries must be practical and written for engineers who need to understand upgrade impact.

## 16. Module Independence Rules

A reusable module must be able to stand on its own conceptually, even when it depends on platform services or other modules.

Rules:

- Module responsibilities must be explicit.
- Dependencies must be documented.
- Cross-module calls must use approved contracts.
- A module must not reach into another module's internal folders.
- Shared logic must not be copied between modules without a plan to extract or document ownership.
- A module must avoid circular dependencies.
- A module must not require client-specific behavior to function as reusable core.

## 17. Client Customization Rules

Client customizations must not modify the reusable core module directly.

Client-specific behavior must be handled through approved extension mechanisms, such as:

- Configuration.
- Feature flags.
- Extension hooks.
- Module adapters.
- Client-specific wrapper modules.
- Client-specific pages or components outside the reusable core module.
- Documented integration contracts.

Rules:

- Reusable module defaults must remain client-neutral.
- Client-specific changes must not weaken security, permissions, auditability, or data ownership.
- Client-specific changes must be documented with the client context and reason.
- If a customization becomes generally useful, Engineering must review whether it belongs in the reusable core module.
- Direct edits to reusable core behavior for a single client are not allowed without explicit architecture approval.

## 18. Approval Checklist Before A Module Becomes Reusable

Before a module is approved as reusable, Engineering must confirm:

- The module has a clear purpose and owner.
- The module follows the required folder structure.
- `README.md`, `CHANGELOG.md`, and `VERSION` exist.
- Public APIs or entry points are documented.
- Service layer responsibilities are clear.
- Database ownership and migration expectations are documented.
- Permission rules are documented and testable.
- Configuration options and defaults are documented.
- Events are documented, or the module states that it does not emit or consume events.
- Required tests are present or explicitly planned before implementation approval.
- Client customization rules are documented.
- The module does not require direct modification for client-specific behavior.
- Cross-module dependencies are documented and justified.
- Versioning and changelog practices are ready for reuse.
- The module has no undocumented production behavior.

A module that fails this checklist is not reusable yet, even if it already exists under `packages/`.
