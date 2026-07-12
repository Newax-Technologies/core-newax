# NEWAX Memberships Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

The Memberships module connects one central person record to one organization context without duplicating either identity.

A person may hold multiple memberships across different organizations and may hold different membership types within the same organization. Memberships provide the organization-scoped foundation required by future Users, Roles, Permissions, LMS, HR, CRM, Legal, Healthcare, Finance, Real Estate, and other NEWAX domains.

## Owned concepts and data

The module owns:

- Membership lifecycle records.
- Organization-scoped membership status.
- Membership type, reference number, job title, and effective dates.
- Membership permission definitions.
- Membership lifecycle events.
- Duplicate-sensitive membership creation.

Database ownership:

- `core_memberships`
- `core_membership_roles`

This first service slice implements lifecycle operations for `core_memberships`. Role assignment operations for `core_membership_roles` remain deferred until the Access Control module defines role and permission behaviour.

The module does not own people, organizations, users, authentication credentials, role definitions, permissions, contacts, addresses, domain profiles, or business transactions.

## Public module API

The package exports:

- `MembershipsService`
- `MembershipsRepository`
- `MembershipReferenceDirectory`
- `MembershipEventPublisher`
- Membership request, response, persistence, and event contracts
- `MEMBERSHIP_PERMISSIONS`
- `MembershipModuleError`

Primary operations:

```text
create
getById
list
update
remove
```

`remove` ends a membership and preserves its record. It does not delete identity or history.

## Organization context

Every protected operation requires a selected `organizationId` in `MembershipRequestContext`.

The service never accepts an organization identifier from the create payload. The selected organization context determines the tenant boundary, preventing callers from smuggling a different organization into an otherwise valid request.

Records belonging to another organization are returned as not found rather than revealing cross-organization existence.

## Permissions

```text
memberships.view
memberships.create
memberships.update
memberships.remove
```

Roles may bundle these permissions later. The Memberships module never authorizes actions through job titles or hardcoded role names.

## Membership rules

- Only active people may receive new memberships.
- Membership changes require an active organization.
- Membership type is normalized to a lowercase machine-readable code.
- Start dates are stored as date-only values and cannot be in the future.
- A person cannot have two active or suspended memberships of the same type in the same organization.
- Ended memberships cannot be edited.
- Ending a membership preserves its record and assigns an end date.
- Membership type and organization are immutable after creation.
- Job title is descriptive data, not an authorization role.

The PostgreSQL adapter serializes competing creations for the same organization, person, and membership type with a transaction-scoped advisory lock before checking for an existing active or suspended membership.

## Dependencies

The module depends conceptually on:

- People `>=0.1.0`
- Organizations `>=0.1.0`

Cross-module reference checks use the documented `MembershipReferenceDirectory` contract. The application adapter performs read-only lookups and does not mutate People or Organizations data.

## Events

```text
membership.created
membership.updated
membership.removed
```

Events include the actor user, organization, membership, person, occurrence time, and resulting membership record.

The module is also expected to respond eventually to:

```text
person.archived
organization.archived
```

Those consumers remain deferred until the shared Events capability and archival orchestration rules are implemented.

## HTTP exposure

This slice does not expose public HTTP endpoints.

Controllers remain deferred until authentication, trusted organization selection, permission evaluation, audit actor resolution, and tenant-safe request middleware exist.

## Testing

Unit tests cover:

- Permission rejection.
- Input normalization.
- Suspended-organization rejection.
- Duplicate membership conflict handling.
- Cross-organization record isolation.
- Non-destructive membership removal and event publication.

Repository CI validates PostgreSQL migrations, formatting, linting, strict TypeScript, tests, and production builds.

## Client customization

Client-specific membership labels and domain profiles belong in configuration or domain modules.

Examples such as student, lecturer, employee, patient, lawyer, tenant, vendor, or customer may be represented as membership types when they describe a person-to-organization relationship. Their domain-specific fields must remain in the relevant domain tables.

## Known limitations

- Public REST endpoints are not enabled.
- Role assignments are not yet exposed.
- Membership scope below the organization level is deferred.
- Archive-event consumers are not yet implemented.
- Durable audit and event persistence remain deferred.
- Scheduled future memberships are not supported in this first slice.

## Related decisions

- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0012: Implement the Central Registry Data Foundation.
- ADR 0013: Build the People Registry Service Foundation.
- ADR 0014: Build the Memberships Registry Service Foundation.
