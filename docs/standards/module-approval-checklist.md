# NEWAX Module Approval Checklist

## Purpose

This document defines the mandatory review and approval requirements a NEWAX module must satisfy before it can move from `draft` to `active` and be approved for reuse in client systems.

A module is not reusable merely because it exists, compiles, or appears complete in the interface. Reusable status requires clear architecture, documented ownership, tested behavior, permission safety, tenant safety, security review, versioning, and formal approval.

This checklist is for internal NEWAX Product and Engineering use. It does not create production code, module implementations, database migrations, or deployment automation.

## 1. What the Module Approval Checklist Is

The Module Approval Checklist is the quality gate between development and approved reuse.

It verifies that a module:

- Has a clear business purpose.
- Belongs to the correct architectural layer.
- Follows the NEWAX Module Standard.
- Declares dependencies and ownership boundaries.
- Enforces permissions and tenant boundaries.
- Documents its APIs, events, configuration, and data ownership.
- Has appropriate tests and security review.
- Can be versioned, maintained, upgraded, and supported.
- Contains no hidden client-specific behavior.

Passing this checklist does not guarantee that a module is perfect. It establishes the minimum evidence required before NEWAX trusts the module as reusable business infrastructure.

## 2. Why NEWAX Needs Module Approval Rules

NEWAX Core is intended to become a private foundation for mission-critical systems across LMS, CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other domains.

Without formal approval rules, NEWAX risks:

- Reusing incomplete or unstable modules.
- Hidden dependencies between modules.
- Cross-tenant data exposure.
- Hardcoded client behavior inside reusable code.
- Missing permission checks.
- Undocumented APIs and events.
- Unsafe upgrades.
- Modules that only the original developer understands.
- Client systems assembled from components with inconsistent quality.

The approval process protects reliability, ownership, maintainability, and client confidence.

## 3. Module Status Lifecycle

Every registered module must use one of the following statuses:

| Status       | Meaning                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `planned`    | The module is proposed but has not entered implementation.                               |
| `draft`      | The module is being designed, developed, documented, or tested.                          |
| `active`     | The module has passed approval and may be reused in approved client systems.             |
| `deprecated` | The module remains supported temporarily but should not be selected for new deployments. |
| `replaced`   | Another module or major version has replaced this module.                                |
| `archived`   | The module is no longer maintained or approved for deployment.                           |

Status changes must be recorded in the Module Registry and, where relevant, in the module changelog.

## 4. Draft Status Requirements

A module may enter `draft` when:

- Its business purpose is documented.
- Its proposed layer is identified.
- Its expected owner is identified.
- Its dependencies are initially listed.
- Its expected permissions, events, configuration, and data ownership are outlined.
- Its relationship to existing modules has been reviewed.
- It does not duplicate an existing module without an approved reason.

A draft module must not be represented as production-ready or approved for general reuse.

## 5. Active Status Requirements

A module may move to `active` only when all applicable approval sections in this document have passed.

At minimum, the module must:

- Follow the NEWAX Module Standard.
- Have the required folder structure.
- Have a complete `README.md`.
- Have a valid `VERSION` file.
- Have an up-to-date `CHANGELOG.md`.
- Declare its layer, status, owner, dependencies, permissions, events, configuration, data ownership, and tenant scope.
- Pass required tests.
- Pass security and tenant-isolation review where applicable.
- Contain no hidden client-specific customization.
- Have a complete or updated Module Registry entry.
- Receive Product and Engineering approval.

## 6. Architecture Review Checklist

- [ ] The module has one clear business or platform responsibility.
- [ ] The module belongs to the correct layer: Foundation, Platform Service, Business Domain, or Client Solution.
- [ ] The module does not duplicate another module's responsibility without an approved reason.
- [ ] The module has clear public and private boundaries.
- [ ] The module does not create a circular dependency.
- [ ] Every dependency is declared.
- [ ] Lower architectural layers do not depend on higher layers.
- [ ] Foundation modules do not depend on LMS, CRM, Legal, Healthcare, Finance, or other business-domain modules.
- [ ] The module does not make LMS the center of future NEWAX systems.
- [ ] Cross-module communication uses approved APIs, services, contracts, or events.
- [ ] The module can be understood independently from client-specific code.
- [ ] The design supports future maintenance and controlled evolution.

**Architecture review result:** `Pass / Fail / Not Applicable`

**Reviewer notes:**

## 7. Module Structure Checklist

The following folders or documented equivalents must exist where applicable:

- [ ] `api/`
- [ ] `components/`
- [ ] `config/`
- [ ] `database/`
- [ ] `docs/`
- [ ] `events/`
- [ ] `pages/`
- [ ] `permissions/`
- [ ] `services/`
- [ ] `stores/`
- [ ] `tests/`
- [ ] `types/`
- [ ] `README.md`
- [ ] `CHANGELOG.md`
- [ ] `VERSION`

Rules:

- [ ] Intentionally unused folders are documented.
- [ ] Business logic is not placed inside UI components.
- [ ] API handlers do not become the primary business-logic layer.
- [ ] Client-specific code is not stored inside reusable module folders.
- [ ] File and folder names follow NEWAX naming standards.

**Structure review result:** `Pass / Fail / Not Applicable`

## 8. Documentation Checklist

- [ ] The module `README.md` exists.
- [ ] Module name and module key are documented.
- [ ] Module layer and status are documented.
- [ ] Business purpose and scope are documented.
- [ ] Features and exclusions are documented.
- [ ] Dependencies are documented.
- [ ] Required permissions are documented.
- [ ] Exposed events are documented.
- [ ] Consumed events are documented.
- [ ] Configuration options and defaults are documented.
- [ ] Database ownership is documented.
- [ ] Tenant or organization scope is documented.
- [ ] API behavior is documented where applicable.
- [ ] Testing expectations are documented.
- [ ] Security considerations are documented.
- [ ] Maintenance ownership is documented.
- [ ] Client extension guidance is documented where applicable.
- [ ] Documentation matches current behavior.

**Documentation review result:** `Pass / Fail / Not Applicable`

## 9. API Checklist

- [ ] Endpoints follow the NEWAX API Design Standard.
- [ ] Endpoints use clear resource names.
- [ ] Protected endpoints require authentication.
- [ ] Sensitive endpoints require explicit permissions.
- [ ] Request validation is enforced.
- [ ] Response formats are consistent.
- [ ] Errors do not expose internal implementation details.
- [ ] Pagination is used for collections that may grow.
- [ ] Filters, sorting, and search parameters are documented where applicable.
- [ ] Tenant-scoped endpoints enforce organization boundaries.
- [ ] `organization_id` from the client request is not trusted without authorization checks.
- [ ] Sensitive API actions create audit records where required.
- [ ] Breaking API changes are documented and versioned.

**API review result:** `Pass / Fail / Not Applicable`

## 10. Permission Checklist

- [ ] Permissions follow the `module.action` naming convention.
- [ ] Every protected action has an explicit permission requirement.
- [ ] Business logic checks permissions rather than hardcoded role names.
- [ ] Frontend visibility is not treated as the security boundary.
- [ ] APIs and services independently enforce permissions.
- [ ] Sensitive actions require specific permissions rather than broad access.
- [ ] Permission changes are auditable where applicable.
- [ ] Client-specific roles can be created without changing reusable module logic.
- [ ] Permissions are documented in the module README and registry entry.

Examples:

```text
students.view
students.create
students.update
students.delete
payments.approve
reports.export
```

**Permission review result:** `Pass / Fail / Not Applicable`

## 11. Tenant Isolation Checklist

- [ ] Tenant-scoped records include `organization_id` or an approved tenant identifier where required.
- [ ] Queries enforce organization boundaries.
- [ ] APIs enforce organization boundaries.
- [ ] Services enforce organization boundaries.
- [ ] Reports respect organization boundaries.
- [ ] Exports respect organization boundaries.
- [ ] Dashboards respect organization boundaries.
- [ ] Files and attachments respect organization boundaries.
- [ ] Cross-organization access is explicit, permission-controlled, and auditable.
- [ ] NEWAX super-admin access is explicit and auditable.
- [ ] Tenant-isolation tests prove that one organization cannot access another organization's records.

**Tenant isolation review result:** `Pass / Fail / Not Applicable`

## 12. Database Ownership Checklist

- [ ] The module clearly documents the data it owns.
- [ ] Owned tables and migrations are identified.
- [ ] Database names follow the NEWAX Data Model Naming Standard.
- [ ] Tenant-scoped tables include organization ownership where required.
- [ ] `person_id` and `user_id` are used according to the Central Registry model.
- [ ] The module does not directly modify another module's internal tables.
- [ ] Cross-module data access uses approved APIs, services, contracts, read models, or events.
- [ ] Migration and rollback expectations are documented.
- [ ] Schema changes are reflected in the changelog.
- [ ] Sensitive data is minimized where practical.
- [ ] Duplicate person records are avoided when the Central Registry should be used.

**Database ownership review result:** `Pass / Fail / Not Applicable`

## 13. Event Checklist

- [ ] Important business events are identified.
- [ ] Event names follow the `module.action` convention.
- [ ] Published events are documented.
- [ ] Consumed events are documented.
- [ ] Event payload categories are documented.
- [ ] Events do not expose secrets or unnecessary sensitive data.
- [ ] Event consumers do not directly violate another module's ownership boundaries.
- [ ] Security-sensitive events are auditable where required.
- [ ] Event changes are versioned and documented when they affect consumers.
- [ ] Events are not used where a direct service call would be clearer and safer.

**Event review result:** `Pass / Fail / Not Applicable`

## 14. Configuration Checklist

- [ ] Configurable behavior is documented.
- [ ] Default values or default behavior are documented.
- [ ] Required configuration is identified.
- [ ] Environment-specific configuration is documented where applicable.
- [ ] Tenant-specific configuration is documented where applicable.
- [ ] Secrets are not committed to the repository.
- [ ] Configuration cannot bypass permission checks or tenant boundaries.
- [ ] Client-specific behavior uses configuration before custom core code where practical.
- [ ] Configuration changes that affect behavior are reflected in tests and the changelog.

**Configuration review result:** `Pass / Fail / Not Applicable`

## 15. Testing Checklist

- [ ] Core business or platform workflows are tested.
- [ ] Unit tests exist where business rules require them.
- [ ] API behavior is tested where applicable.
- [ ] Validation failures are tested.
- [ ] Authentication requirements are tested.
- [ ] Permission-sensitive workflows are tested.
- [ ] Tenant isolation is tested where applicable.
- [ ] Database relationships and ownership rules are tested where applicable.
- [ ] Event publication and consumption are tested where applicable.
- [ ] Audit-log behavior is tested where applicable.
- [ ] Security-sensitive failures are tested.
- [ ] Regression tests cover important fixed defects where practical.
- [ ] Manual acceptance testing is complete where required.
- [ ] Staging verification is complete before production use where applicable.
- [ ] Required tests pass at the reviewed commit.

**Testing review result:** `Pass / Fail / Not Applicable`

## 16. Security Checklist

- [ ] Authentication requirements are clear.
- [ ] Permissions are enforced at the service or API boundary.
- [ ] Tenant boundaries are enforced.
- [ ] Sensitive actions are logged.
- [ ] Sensitive data is protected and minimized.
- [ ] Passwords, secrets, tokens, and credentials are not exposed.
- [ ] File uploads are validated where applicable.
- [ ] Sensitive files are not publicly accessible by default.
- [ ] Reports and exports require appropriate permissions.
- [ ] Sensitive exports are auditable.
- [ ] NEWAX super-admin access is explicit and logged.
- [ ] Error responses do not expose stack traces, secrets, or internal infrastructure.
- [ ] Security review findings are resolved or formally accepted before activation.

**Security review result:** `Pass / Fail / Not Applicable`

## 17. Versioning Checklist

- [ ] The `VERSION` file exists.
- [ ] The version follows semantic versioning where applicable.
- [ ] The version matches the registry entry.
- [ ] Dependency compatibility is documented.
- [ ] Breaking changes are clearly identified.
- [ ] Upgrade notes exist where required.
- [ ] Migration and rollback expectations are documented where applicable.
- [ ] The module can participate in controlled client updates.

**Versioning review result:** `Pass / Fail / Not Applicable`

## 18. Changelog Checklist

- [ ] `CHANGELOG.md` exists.
- [ ] The initial release or current version is documented.
- [ ] Added behavior is recorded.
- [ ] Changed behavior is recorded.
- [ ] Fixed behavior is recorded.
- [ ] Deprecated behavior is recorded where applicable.
- [ ] Breaking changes are clearly marked.
- [ ] Security-impacting changes are documented appropriately.
- [ ] Schema, permission, API, event, and configuration changes are included when relevant.

**Changelog review result:** `Pass / Fail / Not Applicable`

## 19. Client Customization Checklist

- [ ] Client-specific behavior is not hidden inside the reusable core module.
- [ ] Client extensions are stored and documented separately.
- [ ] Configuration is used before custom code where practical.
- [ ] Events or approved extension points are used where appropriate.
- [ ] Client-specific adapters depend on documented public contracts.
- [ ] Customizations are recorded in the Client Deployment Manifest.
- [ ] Customizations do not silently introduce core dependencies.
- [ ] Customizations do not block controlled upgrades without documented reason.
- [ ] Client-specific permissions and configuration remain tenant-safe.

**Client customization review result:** `Pass / Fail / Not Applicable`

## 20. Module Registry Checklist

- [ ] A Module Registry entry exists or is ready for activation.
- [ ] Module name and module key are correct.
- [ ] Module layer is correct.
- [ ] Module status is ready to change to `active`.
- [ ] Current version is correct.
- [ ] Module owner is identified.
- [ ] Description is accurate.
- [ ] Dependencies are complete.
- [ ] Required permissions are complete.
- [ ] Exposed and consumed events are listed.
- [ ] Configuration options are listed.
- [ ] Database ownership is listed.
- [ ] Tenant scope is listed.
- [ ] Documentation and changelog paths are correct.
- [ ] Compatibility notes are included where required.

**Registry review result:** `Pass / Fail / Not Applicable`

## 21. Final Approval Checklist

A module may move to `active` only when:

- [ ] Product confirms the business purpose and scope.
- [ ] Engineering confirms architecture and technical quality.
- [ ] Security concerns are reviewed.
- [ ] Tenant-isolation concerns are reviewed where applicable.
- [ ] Documentation is complete.
- [ ] Required tests pass.
- [ ] Version and changelog are present.
- [ ] Dependencies are declared.
- [ ] Registry entry is ready or updated.
- [ ] Client-specific behavior is separated from reusable core logic.
- [ ] Known limitations and accepted risks are documented.
- [ ] Approval evidence is linked or recorded.

### Approval Record

| Field                      | Value    |
| -------------------------- | -------- |
| Module name                |          |
| Module key                 |          |
| Version                    |          |
| Layer                      |          |
| Previous status            | `draft`  |
| Approved status            | `active` |
| Product approver           |          |
| Engineering approver       |          |
| Security reviewer          |          |
| Approval date              |          |
| Reviewed commit or release |          |
| Known limitations          |          |
| Accepted risks             |          |
| Related ADRs               |          |
| Registry entry             |          |

## 22. Conditional Approval

Conditional approval may be used only when:

- The unresolved item does not create an unacceptable security, tenant, data-integrity, or client-operational risk.
- The condition is documented.
- An owner is assigned.
- A completion date or review trigger is recorded.
- The module status and deployment scope clearly reflect the limitation.

A module must not receive conditional approval for unresolved authentication, permission, tenant-isolation, sensitive-data, or critical data-integrity failures.

## 23. Reapproval Triggers

An active module must return to review when a change introduces:

- A major version release.
- A breaking API change.
- A new sensitive permission.
- A new tenant or organization boundary.
- A significant database ownership change.
- A new external integration.
- A new file-upload or export capability.
- A new client extension mechanism.
- A material authentication or session change.
- A significant security finding.
- A replacement of a critical dependency.

Minor and patch releases may use a reduced review process when no approval trigger applies, but all changes must still follow controlled versioning and changelog rules.

## 24. What Must Never Happen

The following practices are not allowed:

- Do not mark a module `active` without documentation.
- Do not mark a module `active` without versioning and a changelog.
- Do not mark a module `active` without permission review.
- Do not mark a tenant-scoped module `active` when tenant boundaries are unclear or untested.
- Do not approve modules based only on visual completion.
- Do not approve hidden client-specific behavior as reusable core functionality.
- Do not allow undeclared dependencies.
- Do not allow circular dependencies.
- Do not allow foundation modules to depend on business-domain modules.
- Do not bypass failed tests for convenience.
- Do not ignore security findings because a module appears small.
- Do not approve sensitive exports without permission and audit controls.
- Do not approve invisible NEWAX super-admin access.
- Do not rely on one developer's memory instead of documentation.
- Do not place unregistered modules into production client deployments.

## 25. Final Principle

A NEWAX module becomes reusable only when Product understands why it exists, Engineering can explain how it works, Security can identify how it is protected, and future maintainers can operate and evolve it without depending on undocumented knowledge.

The approval checklist exists to protect NEWAX Core as reliable, reusable business infrastructure rather than a collection of code that happened to work once.
