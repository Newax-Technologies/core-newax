# ADR 0006: Use Controlled Updates and Versioning

## Purpose

Document how NEWAX Core modules should be versioned, upgraded, and maintained across different client systems without forcing unsafe automatic updates.

This ADR protects NEWAX Core as a reusable business infrastructure foundation by defining controlled update, versioning, rollback, changelog, audit, and client compatibility expectations.

## 1. Decision Title

ADR 0006: Use Controlled Updates and Versioning

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being built as the private foundation for reusable modules, platform services, business modules, and future client solutions.

As NEWAX Core grows, reusable modules may be installed across different client systems. Those client systems may have different business workflows, customization needs, deployment schedules, security requirements, support plans, and risk tolerance.

NEWAX must maintain a master version of reusable modules while allowing each client installation to use approved module versions that have been reviewed, tested, and deployed safely.

## 5. Problem

If every client system automatically receives every latest module update, NEWAX may introduce instability, break client-specific workflows, overwrite customizations, or deploy changes before they are tested in the client context.

Uncontrolled updates can create:

- Unexpected behavior changes.
- Broken client customizations.
- Permission or tenant boundary regressions.
- Failed deployments.
- Difficult rollback.
- Confusing support scenarios.
- Unclear ownership of installed versions.
- Poor auditability of update history.

NEWAX Core needs a controlled versioning and update approach that protects stability while still allowing improvements and security fixes to reach client systems.

## 6. Decision

NEWAX Core will use controlled updates and explicit versioning.

Client systems must not automatically receive every latest module update without approval, testing, and compatibility checks.

Rules:

- NEWAX maintains the master version of reusable modules.
- Each client installation may run different approved module versions.
- Client systems should track which module versions are installed.
- Updates must be reviewed before installation.
- Security updates may be prioritized but still require controlled deployment.
- Major updates must never be forced automatically.
- Client customizations must not be overwritten during updates.
- Every module must maintain a `VERSION` file.
- Every module must maintain a `CHANGELOG.md` file.
- Every update must be traceable.

This ADR does not create an update service, version manager, deployment automation, or implementation code.

## 7. Reasoning

NEWAX Core must balance reuse with client stability.

Controlled updates give NEWAX:

- Safer client deployments.
- Clearer support boundaries.
- Better auditability.
- More predictable upgrades.
- Stronger security update handling.
- Protection for client-specific customizations.
- Better compatibility management across modules.
- Reduced risk when reusable modules evolve.
- Long-term maintainability for many client systems.

Versioning allows NEWAX to improve core modules without forcing every client to move at the same time.

## 8. Alternatives Considered

### Automatic Updates For All Clients

Every client system could automatically receive the latest module versions as soon as they are released.

This was not selected because client systems may require review, testing, scheduling, compatibility checks, and customization protection before updates are installed.

### Manual Updates Without Version Standards

Updates could be applied manually without consistent versioning, changelogs, or installed version tracking.

This was not selected because it would make support, rollback, auditing, and compatibility management difficult.

### Separate Forks Per Client

Each client could maintain a separate fork of reusable modules.

This was not selected because forks increase maintenance cost, fragment fixes, and weaken NEWAX Core as a shared reusable foundation.

### Freeze Modules After First Client Installation

Modules could be treated as fixed after installation and rarely updated.

This was not selected because reusable modules must continue to receive improvements, fixes, and security updates over time.

## 9. Why Not Automatic Updates By Default

Automatic updates by default are not appropriate for NEWAX Core because client systems may differ in requirements, risk tolerance, and customization paths.

Automatic updates can be unsafe when:

- A client has custom extensions that depend on specific behavior.
- A module update changes permissions, events, APIs, database behavior, or configuration.
- A client operates in a regulated or sensitive environment.
- A deployment must happen during an approved maintenance window.
- A change requires migration or user training.
- A support plan requires client approval before changes.

Security updates may be prioritized, but they still require controlled deployment. Major updates must never be forced automatically.

Controlled updates protect client systems from surprise behavior changes.

## 10. Module Versioning Rules

Every reusable NEWAX Core module must have an explicit version.

Versioning convention:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
```

Rules:

- Use semantic versioning.
- Every module must maintain a `VERSION` file.
- Every module must maintain a `CHANGELOG.md` file.
- Version changes must reflect the nature of the change.
- Version changes must be traceable to reviewed updates.
- Module documentation should identify compatibility expectations.
- Module owners must document upgrade notes for risky changes.

Semantic version rules:

- `PATCH` updates fix bugs or security issues without changing expected behavior.
- `MINOR` updates add compatible improvements.
- `MAJOR` updates may include breaking changes and require careful migration.

Versioning is part of module quality, not an optional release detail.

## 11. Package Versioning Rules

Where modules depend on each other closely, NEWAX may version packages instead of only individual modules.

Package versioning may be appropriate when a group of modules is released, tested, and upgraded together.

Example:

```text
Education Package v5.1.0
- Students
- Teachers
- Courses
- Attendance
- Exams
```

Rules:

- Package versions must document included module versions.
- Package changelogs must identify module-level changes.
- Package updates must preserve compatibility expectations.
- Package releases must define upgrade and rollback expectations.
- Client systems must be able to identify which package version is installed.

Package versioning should reduce operational complexity, not hide module-level changes.

## 12. Client Installation Version Tracking

Each client installation should track the installed versions of NEWAX Core modules and packages.

Tracking should include:

- Client name or tenant context where appropriate.
- Installed module versions.
- Installed package versions, if used.
- Installation date.
- Update date.
- Update category.
- Approval status.
- Applied migrations, if any exist in the future.
- Related changelog or release notes.
- Rollback status or rollback notes when applicable.

Example version state:

```text
NEWAX Master Library:
Authentication v2.4.0
Dashboard v3.1.0
Students v2.7.0
Payments v1.9.0

Client A:
Authentication v2.3.0
Dashboard v3.0.0
Students v2.6.0
Payments v1.8.0

Client B:
Authentication v2.4.0
Dashboard v3.1.0
Students v2.7.0
Payments v1.9.0
```

Different client installations may run different approved versions when business, support, compatibility, or deployment timing requires it.

## 13. Update Categories

NEWAX Core updates must be categorized so Product, Engineering, Security, and client stakeholders understand the risk and urgency.

Update categories:

1. Security Update
2. Bug Fix
3. Improvement
4. Major Feature
5. Breaking Change

Category guidance:

- Security updates address vulnerabilities, access control issues, sensitive data handling, tenant isolation, or other security risks.
- Bug fixes correct unintended behavior.
- Improvements add compatible enhancements without changing expected behavior.
- Major features introduce significant new capability.
- Breaking changes require migration, compatibility review, or client approval before installation.

Each update should have a clear category before it is released to client systems.

## 14. Compatibility Rules

Compatibility must be assessed before updates are installed in client systems.

Rules:

- `PATCH` updates should be backward compatible.
- `MINOR` updates should be backward compatible unless explicitly documented.
- `MAJOR` updates may introduce breaking changes and require migration planning.
- Module API changes must identify compatibility impact.
- Event payload or event naming changes must identify compatibility impact.
- Permission changes must identify security and access impact.
- Database changes must identify migration and rollback impact when implementation begins.
- Client extensions must be checked against core module changes.
- Package updates must document compatibility between included modules.

Compatibility should be reviewed before deployment, not discovered after deployment.

## 15. Upgrade Approval Process

Updates must be reviewed before installation into client systems.

Approval process should consider:

- Update category.
- Module or package version change.
- Changelog review.
- Compatibility impact.
- Security impact.
- Tenant or data impact.
- Permission impact.
- Client customization impact.
- Testing results.
- Rollback plan.
- Deployment timing.
- Required client approval, if applicable.

Major updates, breaking changes, security-sensitive changes, permission changes, and tenant-impacting changes require stronger review.

Approval should be documented before client deployment.

## 16. Rollback Requirements

Every meaningful update should have a rollback plan appropriate to its risk.

Rollback requirements:

- Identify whether rollback is possible.
- Document rollback steps where appropriate.
- Document whether data migrations are reversible when implementation begins.
- Preserve previous approved versions when practical.
- Ensure client customizations are not overwritten.
- Log rollback actions.
- Document the reason for rollback.
- Review failed updates before retrying.

Rollback plans are especially important for major updates, security-sensitive changes, database changes, permission changes, and client-impacting workflows.

## 17. Changelog Requirements

Every reusable module must maintain a `CHANGELOG.md` file.

Changelog entries should include:

- Version number.
- Release date.
- Update category.
- Summary of changes.
- Security notes, if applicable.
- Breaking changes, if applicable.
- Migration notes, if applicable.
- Compatibility notes.
- Known risks or limitations.
- Related ADRs, standards, or issues when useful.

Changelogs must be practical and useful for upgrade review, not only a list of commits.

Every update must be traceable.

## 18. Security Update Handling

Security updates require priority handling while still using controlled deployment.

Rules:

- Security updates should be triaged quickly.
- Security impact should be documented.
- Affected modules and client systems should be identified.
- Deployment urgency should be assessed.
- Compatibility and rollback considerations should still be reviewed.
- Security updates may use an accelerated approval process when risk is high.
- Security updates must be logged and traceable.
- Security-sensitive changes should be reviewed by appropriate Engineering, Security, or leadership stakeholders.

Security updates may move faster than normal updates, but they should not become uncontrolled or invisible changes.

## 19. Support Plan Considerations

Client support plans may influence update timing, approval, communication, and maintenance responsibilities.

Considerations:

- Some clients may receive updates on scheduled maintenance windows.
- Some clients may require approval before non-security updates.
- Some clients may require extended support for older module versions.
- Some clients may require dedicated enterprise deployments.
- Some clients may require stronger audit records for updates.
- Support plans should define responsibility for testing client-specific customizations.

Support plan differences must not lead to hidden forks of reusable core modules.

## 20. Client Customization Impact

Client customizations must be protected during updates.

Rules:

- Client customizations must not be overwritten during updates.
- Client extensions must be checked against module and package changes.
- Core updates should not require direct edits to client extensions unless the change is documented.
- Breaking changes to approved extension points must be documented.
- Event, API, permission, configuration, and database changes must identify client extension impact.
- Client-specific behavior should remain outside reusable core modules.
- Customizations should have tests where they affect important workflows.

This aligns with ADR 0004: Separate Client Customizations from Core Modules.

## 21. Audit And Logging Requirements

Updates must be traceable across NEWAX Core and client systems.

Audit and logging should record:

- What module or package was updated.
- Previous version.
- New version.
- Update category.
- Date and time.
- Approver.
- Operator or deployment actor.
- Client system or tenant context where applicable.
- Compatibility checks performed.
- Tests performed.
- Rollback plan.
- Rollback action, if used.
- Security impact, if applicable.

Audit records are important for support, security, compliance, and long-term platform control.

## 22. Impact On NEWAX Core

NEWAX Core must treat versioning and update control as part of module quality.

Impact:

- Every reusable module must include a `VERSION` file.
- Every reusable module must include a `CHANGELOG.md` file.
- Module documentation should identify upgrade and compatibility expectations.
- Module changes should be categorized.
- Module owners must consider client installations before releasing updates.
- Breaking changes should be rare, documented, and reviewed.
- Future tooling may track versions and update history.

This decision improves stability, auditability, maintainability, and client trust.

## 23. Impact On Client Systems

Client systems can run approved module versions appropriate to their needs.

Impact:

- Client systems do not automatically receive every latest update.
- Client systems should track installed module and package versions.
- Client systems can schedule updates based on approval, testing, support plans, and business timing.
- Client customizations remain protected during upgrades.
- Client systems may receive security updates faster through a controlled process.
- Client systems must support traceable update history.

This gives clients stability and control while still benefiting from NEWAX Core improvements.

## 24. Future NEWAX Update Service

NEWAX may later build an Update Service to support controlled module and package updates.

A future NEWAX Update Service may:

- Check installed module versions.
- Compare available updates.
- Show update categories.
- Run compatibility checks.
- Run tests before installation.
- Schedule approved updates.
- Support rollback.
- Log update history.

The Update Service should support controlled deployment, not forced automatic updates.

This ADR does not create the Update Service.

## 25. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [ADR 0002: Use Permission-Based Access Control](./0002-use-permission-based-access-control.md)
- [ADR 0003: Design for Multi-Tenancy](./0003-design-for-multi-tenancy.md)
- [ADR 0004: Separate Client Customizations from Core Modules](./0004-separate-client-customizations-from-core.md)
- [ADR 0005: Use Event-Driven Module Communication](./0005-use-event-driven-module-communication.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 26. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, Security, Support, or leadership ownership is assigned.
