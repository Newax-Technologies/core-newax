# ADR 0027: Stage Certificate Imports and Link Evidence Files

- Status: Proposed
- Date: 2026-07-16
- Decision owners: NEWAX Core Architecture
- Depends on: ADR 0025, ADR 0026, and PR #47

## Context

Family data may arrive from certificates such as CRCs, family registration certificates, birth certificates, marriage certificates, court orders, or guardianship documents. The People Intake workflow can stage structured family data, while the File Metadata Registry can identify a binary object that a trusted storage component has already stored. The platform still needs a governed way to attach evidence to an intake, stage extracted certificate data, review the extraction independently, and deliberately apply an accepted extraction to an editable intake draft.

Storing document bytes inside People Intake would duplicate the File capability. Copying extracted data directly into canonical People records would bypass the existing intake and independent review controls. Treating an OCR result as verified truth would also confuse machine confidence with evidence, a recurring human achievement now available to software.

## Decision

NEWAX will add evidence and certificate-import records owned by the People Intake module.

### Evidence attachment

An evidence record will:

- belong to one Tenant and Organization;
- link one People Intake record to one active `CoreFile` in the same Tenant and Organization;
- classify the document type and evidence role;
- preserve who attached it and when;
- avoid copying storage provider, storage key, checksum, or binary bytes;
- be immutable after the intake is submitted.

Allowed evidence media types will initially be PDF, PNG, and JPEG. File metadata size and status will be checked before attachment. Actual upload, malware scanning, storage-provider integration, and signed download URLs remain responsibilities of the File and future Storage boundaries.

### Certificate import staging

A certificate import will:

- belong to one evidence attachment;
- store a versioned structured extraction payload separately from the People Intake payload;
- record extractor identity or extractor code, extraction version, confidence basis points, and extraction time;
- move through `pending`, `extracted`, `accepted`, or `rejected` states;
- require a reviewer other than the extraction actor for acceptance or rejection;
- record review time, decision, and notes;
- never create canonical People or relationships directly.

An accepted extraction may be copied into the linked intake only through an explicit apply operation while that intake remains an editable draft. The normal People Intake validator and optimistic version check will still govern the resulting draft.

## Permissions

- `people_intake.evidence.view`
- `people_intake.evidence.attach`
- `people_intake.certificate_import.extract`
- `people_intake.certificate_import.review`
- `people_intake.certificate_import.apply`

Permissions are evaluated by code, never role name.

## Privacy and security

- Evidence summaries expose file name, media type, size, document type, and workflow status but never storage credentials or provider keys.
- Structured extraction payloads are sensitive and use `Cache-Control: no-store`.
- Tenant and Organization scope comes only from Trusted Request Context.
- No raw CNIC, CRC, passport, or certificate value is written to logs or events.
- No real certificate data is committed or seeded.

## Verification required before acceptance

- Unit tests for permissions, file eligibility, lifecycle, four-eye review, optimistic versions, and explicit apply behavior.
- PostgreSQL tests for composite Tenant/Organization ownership, immutable submitted evidence, state consistency, and reviewer separation.
- HTTP input and metadata tests.
- Complete repository formatting, lint, type-check, tests, builds, migrations, and database-registry generation against the exact final commit.
