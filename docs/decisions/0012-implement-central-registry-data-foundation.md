# ADR 0012: Implement the Central Registry Data Foundation

## 1. Decision Title

Implement the first executable Central Registry data foundation for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-11

## 4. Context

NEWAX Core has accepted architecture for a modular monolith, organization-scoped multi-tenancy, permission-based authorization, a Central Identity and Organization Registry, and a PostgreSQL and Prisma implementation baseline.

The repository now needs an executable persistence model that future LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Connected Infrastructure, and other domains can reference without making any business domain the center of the platform.

The implementation must also incorporate the final separation decisions approved for the registry:

- People are separate from login accounts.
- Authentication identities, credentials, and sessions are separate.
- Memberships connect people to organizations.
- Permissions authorize actions and roles group permissions.
- Contact methods and addresses are separate reusable concepts.
- Individually identifiable non-human objects have their own registry.
- Files store metadata for content held through object storage.
- Audit logs and external references remain foundation concerns.
- Business transactions remain outside the Central Registry and are owned by their domains.

## 5. Decision

NEWAX Core will implement the first Central Registry persistence model in Prisma and PostgreSQL using `core_` table names.

The first implementation slice includes:

```text
core_organizations
core_organization_relationships

core_people
core_person_identifiers

core_users
core_user_identities
core_user_credentials
core_user_sessions

core_memberships

core_roles
core_permissions
core_role_permissions
core_membership_roles

core_contact_methods
core_person_contact_methods
core_organization_contact_methods

core_addresses
core_person_addresses
core_organization_addresses

core_object_types
core_objects
core_object_assignments
core_object_addresses

core_files
core_audit_logs
core_external_references
```

### 5.1 Tenant Boundary

`core_organizations` remains the initial business-facing tenant boundary in accordance with ADR 0003 and ADR 0008.

A separate `core_tenants` table will not be introduced until NEWAX has a concrete requirement for one tenant to contain multiple independently governed organizations or another architecture decision justifies the additional abstraction.

The model must preserve stable identifiers and clear organization ownership so a future tenant split remains possible.

### 5.2 Identity and Authentication

`core_people` represents real human identity.

`core_users` represents login access and must reference one person.

Authentication identities, credential hashes, and sessions are stored separately so login methods and security controls can evolve without changing person records.

A person may exist without a user account.

### 5.3 Membership and Authorization

`core_memberships` connects a person to an organization.

Authorization is permission-driven and role-managed:

```text
person
  -> user
  -> organization membership
  -> assigned role
  -> permission
  -> access decision
```

Business logic must check explicit permission codes, not role names.

Roles are responsibility bundles. Permissions remain the source of truth for allowed actions.

### 5.4 Contacts and Addresses

Contact methods and addresses are independent records connected to people and organizations through explicit relationship tables.

This supports multiple, purpose-specific, primary, historical, and verified contact or location records without adding numbered columns such as `email_2` or `address_3`.

### 5.5 Object Registry

`core_objects` stores the shared identity of individually identifiable non-human entities such as equipment, vehicles, rooms, buildings, devices, sensors, and property units.

Object-specific business attributes remain owned by domain extension tables.

Objects may be assigned through organization memberships and may be linked to addresses.

Products, inventory quantities, documents, and transactions must not be collapsed into the object registry merely because they are nouns.

### 5.6 Files

`core_files` stores file metadata, organization ownership, storage location references, checksums, and creator context.

Binary content remains behind the S3-compatible Files Module contract defined by ADR 0011.

Files and business documents remain separate concepts.

### 5.7 Audit and External References

`core_audit_logs` is append-oriented and records actor, organization, action, target, outcome, sensitivity, request, correlation, and change context.

Audit logs are not business transactions and must not replace domain event or workflow history.

`core_external_references` maps NEWAX-controlled records to external systems without making external identifiers the primary identity of registry records.

### 5.8 Transaction Separation

The Central Registry will not contain a universal business transaction table.

Each domain owns its transactions, for example:

```text
lms_enrollments
lms_exam_attempts
finance_payments
finance_invoices
inventory_stock_movements
healthcare_appointments
hr_payroll_runs
```

Transactions reference Central Registry identifiers where required, but the Central Registry does not depend on transaction tables.

Operational finance records and accounting ledger entries remain separate.

## 6. Consequences

### Positive

- Future domains share stable people, organization, user, membership, object, and access identifiers.
- Authentication can evolve without redesigning human identity.
- Permission-based authorization remains configurable by organization.
- Contact and location data can support multiple owners and histories.
- Connected Infrastructure gains a reusable object foundation.
- Domain transactions remain independently scalable and maintainable.
- Audit context is available across future systems.
- The LMS remains the first connected domain rather than the platform center.

### Negative

- The initial schema contains more relationships than a project-specific database.
- Queries must join through memberships, roles, and relationship tables.
- Application services must enforce organization scope consistently.
- Some cross-record rules, such as one active primary contact or one active assignment, require application validation or later database constraints.
- Schema changes require disciplined migrations and compatibility review.

## 7. Implementation Rules

- Use UUID primary keys.
- Use lowercase `snake_case` database names through Prisma mappings.
- Use `core_` only for shared foundation records.
- Use organization ownership on tenant-scoped records.
- Use soft lifecycle fields where records must remain traceable.
- Never store plaintext credentials or session tokens.
- Store only hashes for password-like credentials and session tokens.
- Keep completed business transactions outside the registry.
- Do not add domain-specific fields to `core_people`, `core_organizations`, or `core_objects`.
- Add migrations only after Prisma schema validation and review.
- Add permission and tenant-isolation tests before protected APIs are released.

## 8. Deferred Decisions

The following remain outside this first persistence slice:

- Separate tenant records.
- Permission scopes and direct permission overrides.
- Service accounts and API tokens.
- Multi-factor authentication persistence.
- Object endpoints and telemetry.
- Business document workflows.
- Domain transaction schemas.
- Financial ledger schemas.
- Analytics stores and search indexes.
- Record matching and merge workflows.

These must be added only through approved module work or a later architecture decision when their requirements are concrete.

## 9. Related Decisions and Standards

- ADR 0001: Use Modular Monolith First.
- ADR 0002: Use Permission-Based Access Control.
- ADR 0003: Design for Multi-Tenancy.
- ADR 0005: Use Event-Driven Module Communication.
- ADR 0007: Define LMS Centralized Database and Data Ownership.
- ADR 0008: Use Central Identity and Organization Registry.
- ADR 0009: Define Module Registry and Dependency Rules.
- ADR 0010: Define Authentication and User Identity Strategy.
- ADR 0011: Define Technology Stack and Implementation Baseline.
- NEWAX Central Identity and Organization Registry Architecture.
- NEWAX Data Model Naming Standard.

## 10. Approval

This decision is accepted as the implementation baseline for the first Central Registry persistence slice.

Future changes that alter tenant ownership, identity separation, permission authority, transaction ownership, or core-domain dependency direction require architecture review.
