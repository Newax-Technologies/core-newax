# NEWAX People Intake Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

People Intake provides a controlled staging and verification workflow for proposed people, official identifiers, and person-to-person relationships before any information is applied to the canonical People Registry.

The first supported experience is family data entry and verification. The module remains generic enough to support future employee, student, patient, customer, and other identity-intake workflows without duplicating canonical identity infrastructure.

## Locked boundaries

- Draft intake records are not canonical people.
- Draft identifiers are not canonical person identifiers.
- Draft relationships are not canonical person relationships.
- Creating, editing, submitting, approving, or rejecting an intake does not mutate `core_people`, `core_person_identifiers`, or `core_person_relationships`.
- Applying an approved intake to the canonical People Registry is a separate future capability.
- Every intake belongs to one Tenant and one Organization operating context.
- The creator of an intake cannot approve or reject their own submission.
- Sensitive identifier values are masked in list and queue projections.
- Real client or family data must never be committed as fixtures or seeds.

## Planned first vertical slice

- Draft family intake creation and editing.
- Proposed-person and proposed-relationship validation.
- Submission for independent review.
- Verification queue listing.
- Approval and rejection with reviewer, timestamp, and notes.
- Organization-context API endpoints with explicit permissions.
- Internal Next.js data-entry and verification dashboard.
- PostgreSQL integrity and concurrency tests.

## Planned permissions

```text
people_intake.view
people_intake.create
people_intake.update
people_intake.submit
people_intake.review
```

## Dependencies

- Tenants
- Organizations
- People
- Users
- Request Context
- HTTP Security
- Audit

## Database ownership

Planned staging tables:

```text
core_people_intakes
core_people_intake_people
core_people_intake_relationships
```

## Known limitation

This initial module document starts the controlled implementation branch. No runtime behavior, schema, endpoint, or dashboard is complete until the exact branch head passes migrations, formatting, lint, type-checking, tests, production builds, and review.
