# NEWAX Organizations Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

The Organizations module maintains the shared identity and hierarchy of companies, institutions, branches, campuses, departments, subsidiaries, and other organization units used across NEWAX business infrastructure.

It provides the organization boundary that future LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, Connected Infrastructure, and other domains reference through stable `organization_id` values.

## Owned concepts and data

The module owns:

- Organization identity.
- Parent-child organization hierarchy.
- Organization lifecycle status.
- Organization relationship validation.
- Organization permission definitions.
- Organization events.

Database ownership:

- `core_organizations`
- `core_organization_relationships`

The module does not own people, memberships, users, roles, permission assignments, contacts, addresses, objects, files, domain records, or business transactions.

## Public module API

The package exports:

- `OrganizationsService`
- `OrganizationRepository`
- `OrganizationEventPublisher`
- Organization request, response, persistence, and event types
- `ORGANIZATION_PERMISSIONS`
- `OrganizationModuleError`

Primary operations:

```text
create
getById
list
update
archive
```

The service layer validates permissions, required text fields, parent existence, archived-parent rules, hierarchy cycles, and active-child archive restrictions before persistence.

## Permissions

Protected operations require explicit permissions:

```text
organizations.view
organizations.create
organizations.update
organizations.archive
```

Roles may group these permissions, but module behavior must never authorize actions through hardcoded role names.

## Events

The module publishes:

```text
organization.created
organization.updated
organization.archived
```

Each event includes the actor user, organization identifier, occurrence time, and resulting organization record.

The initial application adapter logs these events in process. Durable external delivery or transactional outbox behavior remains deferred until a concrete integration requires it.

## Dependencies

The reusable package has no dependency on LMS or another business domain.

The NestJS application adapter depends on:

- The API database module.
- Prisma-generated database access.
- PostgreSQL Central Registry tables.

The package defines ports so its service rules do not depend directly on NestJS, Prisma, PostgreSQL, or a client-specific deployment.

## Configuration

The first version uses the following built-in behavior:

- Default list page size: `50`
- Maximum list page size: `100`
- Organization status values: `active`, `suspended`, `archived`
- Archived organizations cannot be updated or selected as parents.
- Organizations with active children cannot be archived.

Organization type values remain controlled by the calling solution until a dedicated reference-data capability is approved.

## HTTP exposure

This slice does not expose public HTTP endpoints.

The module is composed into the API application as an application-facing service, but REST controllers are intentionally deferred until authentication, active organization context, permission guards, and audit actor resolution can protect them.

Raw request headers must not be treated as trusted permission evidence merely to make an endpoint appear finished.

## Testing

Unit tests cover:

- Permission rejection.
- Create-input normalization.
- Event publication.
- Hierarchy cycle prevention.
- Active-child archive protection.

The Prisma migration and repository composition are validated through the repository CI pipeline using PostgreSQL 18.

## Client customization

Client-specific organization types, naming, hierarchy conventions, or status displays must be implemented through approved configuration or extension modules.

Client fields must not be added directly to `core_organizations` unless they are broadly reusable foundation requirements approved through architecture review.

## Known limitations

- Public REST endpoints are not yet enabled.
- Authentication and permission-context adapters are not yet implemented.
- Durable event delivery is not yet implemented.
- Organization relationship types beyond the parent hierarchy are persisted but do not yet have service operations.
- Reference-data management for organization types remains deferred.

## Related decisions

- ADR 0001: Use Modular Monolith First.
- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0011: Define Technology Stack and Implementation Baseline.
- ADR 0012: Implement the Central Registry Data Foundation.
