# NEWAX People Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

The People module maintains one stable identity record for each real person used across NEWAX business infrastructure.

A person may later participate in multiple organizations, hold multiple memberships, and have a login account, but those concerns remain outside this module. Domain modules such as LMS, HR, Healthcare, Legal, CRM, and Finance reference the shared person through `person_id` instead of duplicating identity data.

## Owned concepts and data

The module owns:

- Human identity records.
- Person lifecycle status.
- Person identifiers such as national identifiers, passports, and professional registration numbers.
- Identity validation and duplicate-sensitive identifier assignment.
- People permission definitions.
- Person lifecycle and identifier events.

Database ownership:

- `core_people`
- `core_person_identifiers`

The module does not own users, authentication, memberships, roles, contacts, addresses, student profiles, employee profiles, patient profiles, or business transactions.

## Public module API

The package exports:

- `PeopleService`
- `PeopleRepository`
- `PersonEventPublisher`
- Person request, response, persistence, and event contracts
- `PEOPLE_PERMISSIONS`
- `PeopleModuleError`

Primary operations:

```text
create
getById
list
update
archive
addIdentifier
listIdentifiers
verifyIdentifier
```

## Permissions

Protected operations require explicit permissions:

```text
people.view
people.create
people.update
people.archive
people.identifiers.view
people.identifiers.manage
```

Roles may bundle these permissions, but the module never authorizes actions through role names.

## Identity rules

- First and last names are required.
- Date of birth cannot be in the future.
- Archived people cannot be updated or receive new identifiers.
- Identifier types are normalized to lowercase machine-readable codes.
- Identifier values are stored in canonical uppercase form without spaces or hyphens.
- Country codes use two uppercase letters.
- Identifier validity end dates cannot precede start dates.
- The PostgreSQL adapter serializes competing assignments for the same normalized identifier using a transaction-scoped advisory lock.
- The same identifier cannot be assigned to two people within the same type, issuing-country, and issuing-authority scope.

The module deliberately does not perform probabilistic person matching based on names or dates of birth. Similarity is not identity, despite humanity’s recurring optimism about spreadsheets.

## Events

The module publishes:

```text
person.created
person.updated
person.archived
person.identifier_added
person.identifier_verified
```

Events include the actor user, person identifier, occurrence time, and resulting person or identifier record.

The initial application adapter records events through structured application logging. Durable event delivery and transactional outbox support remain deferred until the shared Events capability is implemented.

## Dependencies

The reusable package has no dependency on another business domain.

The NestJS application adapter depends on:

- The API Database Module.
- Prisma-generated database access.
- PostgreSQL Central Registry tables.

## HTTP exposure

This slice does not expose public HTTP endpoints.

REST controllers remain deferred until authentication, trusted organization context, permission guards, sensitive-identifier response controls, and audit actor resolution can protect them.

## Testing

Unit tests cover:

- Permission rejection.
- Person input normalization.
- Future date-of-birth rejection.
- Identifier normalization.
- Cross-person identifier conflict handling.
- Identifier verification and event publication.

Repository CI validates formatting, linting, strict TypeScript, tests, production builds, Prisma schema validity, and database migrations against PostgreSQL 18.

## Client customization

Client-specific student, employee, doctor, lawyer, customer, supplier, or patient fields must remain in their respective domain profiles.

Client fields must not be added directly to `core_people` unless they are universal identity requirements approved through architecture review.

## Known limitations

- Public REST endpoints are not enabled.
- Contacts and addresses remain separate planned modules.
- Authentication and membership consequences of person archival are not yet automated.
- Probabilistic duplicate-person matching and record merging remain deferred.
- Durable audit and event persistence remain deferred.

## Related decisions

- ADR 0001: Use Modular Monolith First.
- ADR 0002: Use Permission-Based Access Control.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0011: Define Technology Stack and Implementation Baseline.
- ADR 0012: Implement the Central Registry Data Foundation.
