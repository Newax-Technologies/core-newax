# ADR 0004: Separate Client Customizations from Core Modules

## Purpose

Document why NEWAX Core modules must remain reusable and why client-specific customizations must be implemented separately from the reusable core.

This ADR protects NEWAX Core as a reusable business infrastructure foundation by keeping core modules stable, upgradeable, and client-neutral while still allowing client-specific behavior through approved extension mechanisms.

## 1. Decision Title

ADR 0004: Separate Client Customizations from Core Modules

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being established as the private foundation for reusable business infrastructure modules and future client solutions.

NEWAX-powered systems will serve different clients, industries, and operational needs over time. Some client systems may require custom workflows, custom fields, custom approvals, custom reports, branding, integrations, or business-specific rules.

If every client requirement is added directly into reusable core modules, NEWAX Core will become harder to maintain, harder to upgrade, and less reliable as a shared platform foundation.

## 5. Problem

Client-specific requirements are expected, but they must not damage the reusability of NEWAX Core modules.

Directly modifying reusable modules for one client can create:

- Forked behavior across clients.
- Upgrade conflicts.
- Hidden client dependencies inside core modules.
- Increased regression risk.
- Poor ownership boundaries.
- Difficult testing and documentation.
- Slower future module reuse.
- Loss of control over the platform foundation.

NEWAX Core needs clear rules for where client customizations belong and how reusable modules should expose safe extension points.

## 6. Decision

NEWAX Core modules must not be directly modified for client-specific requirements.

Client-specific behavior must be handled through:

- Configuration.
- Events.
- Extension modules.
- Client-specific adapters.
- Approved override points.

Reusable core modules must remain stable. Client-specific changes must live outside the reusable core.

Core changes should only be made when the improvement benefits the reusable NEWAX platform, not only one client.

## 7. Reasoning

NEWAX Core exists to provide reusable, reliable, and maintainable business infrastructure.

Separating client customizations from core modules gives NEWAX:

- Better upgrade safety.
- Clearer ownership boundaries.
- More predictable module behavior.
- Better reuse across industries and clients.
- Lower regression risk.
- Cleaner testing and documentation.
- Stronger long-term control over the platform foundation.
- More scalable delivery for multiple client solutions.

This decision allows NEWAX to serve unique client requirements without turning reusable modules into client-specific codebases.

## 8. Alternatives Considered

### Modify Core Modules For Each Client

This is fast for isolated short-term delivery, but it creates long-term maintenance risk and makes future upgrades harder.

It was not selected because NEWAX Core is intended to remain reusable across client systems.

### Fork Core Modules Per Client

This can isolate client behavior, but it creates duplicated modules, fragmented fixes, inconsistent behavior, and high maintenance cost.

It was not selected because forks weaken the shared NEWAX platform foundation.

### Reject Client Customizations

This would protect core modules, but it would make NEWAX client systems too rigid for real business needs.

It was not selected because client flexibility is necessary. The correct approach is controlled extension, not uncontrolled core modification.

## 9. What Core Modules Are

Core modules are reusable NEWAX modules designed to support multiple client systems and business domains.

Examples may include:

- Authentication.
- Organizations.
- Users.
- Roles.
- Permissions.
- Dashboard.
- Notifications.
- Files.
- Reports.
- Audit.
- Future reusable business modules.

Core modules should provide stable capabilities, documented APIs, documented configuration, documented events, and predictable permission behavior.

A core module should be reusable without containing private assumptions about one client.

## 10. What Client Customizations Are

Client customizations are changes or additions needed for a specific client, organization, deployment, workflow, integration, brand, or business rule.

Examples may include:

- Client-specific approval flows.
- Custom fee policies.
- Client-specific reports.
- Custom dashboard widgets.
- Client-specific notification wording.
- Integration adapters for a client's tools.
- Custom branding or configuration.
- Client-specific import or export behavior.

Client customizations should be isolated, documented, testable, and upgrade-safe.

## 11. Core Module Protection Rules

Reusable core modules must be protected from client-specific edits.

Rules:

- Direct editing of reusable core module internals for one client is not allowed.
- Core modules must remain client-neutral unless a requirement is approved as reusable platform behavior.
- Core modules should expose configuration where reasonable.
- Core modules should emit events for important actions.
- Core modules should expose approved APIs or services for extension.
- Core module behavior must be documented before it becomes reusable.
- Core changes should require review when they affect module boundaries, permissions, events, data ownership, or upgrade compatibility.

Core module protection is an ownership and maintainability rule, not a delivery preference.

## 12. Client Extension Rules

Client-specific behavior must live outside reusable core modules.

Rules:

- Client extensions may depend on approved core module APIs, events, configuration, or extension points.
- Client extensions must not depend on undocumented internals of a core module.
- Client extensions must document their purpose, owner, affected client, and dependency on core modules.
- Client extensions should include tests for the client-specific behavior they introduce.
- Client extensions must not block future updates to the reusable core module.
- Client extensions must respect core permission, tenant, audit, and security rules.

Client extensions should be treated as first-class client system assets, not hidden patches.

## 13. Configuration-First Customization

Configuration is the preferred customization method when the requirement is predictable, safe, and reusable.

Customization priority:

1. Use configuration first.
2. Use events second.
3. Use extension modules third.
4. Modify core only if the requirement should become part of the reusable platform.

Configuration is appropriate for:

- Feature toggles.
- Default values.
- Display settings.
- Workflow options.
- Notification preferences.
- Report visibility.
- Tenant-specific settings.

Configuration must remain documented, validated, and secure.

## 14. Event-Based Customization

Events allow client-specific behavior to react to important core module actions without modifying the core module directly.

Rules:

- A module should emit events for important business actions when extension is expected.
- Events should be named clearly and documented.
- Event payloads should include only necessary and safe data.
- Client-specific extensions may listen to events and perform additional behavior.
- Events must not expose private data or bypass permission and tenant boundaries.
- Event behavior must be testable and observable where appropriate.

Events are a controlled extension mechanism, not a substitute for clear module ownership.

## 15. Extension-Based Customization

Extension modules are the preferred approach when configuration and events are not enough.

Extension modules may provide:

- Client-specific workflows.
- Client-specific adapters.
- Client-specific reports.
- Client-specific UI additions.
- Client-specific integrations.
- Client-specific automation.

Extension modules must use approved APIs, services, events, permissions, and configuration. They must not modify or rely on private internals of reusable core modules.

## 16. What Must Never Happen

The following practices are not allowed:

- Editing a reusable core module directly for one client requirement.
- Hardcoding client names inside reusable core modules.
- Adding client-specific business rules to a reusable module without architecture approval.
- Creating hidden conditional logic in core modules for one client.
- Bypassing permission checks through client customization.
- Bypassing tenant boundaries through client customization.
- Depending on undocumented internal files, services, or data structures.
- Making customizations that prevent future core upgrades.
- Leaving client customizations undocumented.

Bad:

```text
Editing the core Fees module directly for ABC Institute.
```

Good:

```text
Keeping Fees module unchanged and adding ABC Institute Fee Extension.
```

Example structure:

```text
packages/
  fees/

client-extensions/
  abc-institute/
    fees-extension/
```

This ADR does not create actual extension modules or production code.

## 17. Upgrade And Versioning Impact

Separating client customizations from core modules protects upgrade paths.

Rules:

- Reusable core modules should be versioned independently where appropriate.
- Client extensions should document the core module versions they depend on.
- Core module changelogs should identify changes that may affect extensions.
- Client customizations must not block future updates.
- Breaking changes to approved extension points should be documented and reviewed.
- Client-specific behavior should be tested against core module upgrades.

Upgrade safety is a key reason for keeping customization outside reusable core modules.

## 18. Security Considerations

Client customizations must not weaken NEWAX Core security.

Security rules:

- Client extensions must respect permission checks.
- Client extensions must respect tenant boundaries.
- Client extensions must not expose sensitive data from core modules.
- Client-specific adapters must protect credentials and integration secrets.
- Security-sensitive customization behavior should be auditable.
- Customizations that affect access, data visibility, payments, reports, or tenant isolation require careful review.
- Direct database access from client extensions should be avoided unless explicitly approved and documented.

Security must remain controlled even when client behavior varies.

## 19. Scalability Considerations

The customization model must scale across many client systems.

Scalability principles:

- Core modules should remain reusable across clients.
- Client extensions should be isolated by client, domain, or deployment.
- Configuration should handle common variation without creating new code.
- Events should support extension without increasing core complexity.
- Extension modules should avoid tight coupling to core internals.
- Customization patterns should be repeatable and documented.

A scalable customization model lets NEWAX support more clients without duplicating the platform foundation.

## 20. Maintenance Considerations

Separating client customizations from core modules improves long-term maintainability.

Maintenance rules:

- Every client customization should be documented.
- Each customization should have a clear owner.
- Customizations should explain why configuration was not sufficient when extensions are used.
- Customizations should identify affected modules, permissions, events, and configuration.
- Customizations should be reviewed during core module upgrades.
- Reusable improvements discovered through client work should be proposed as core enhancements through normal architecture review.

Client-specific work should remain visible and maintainable, not hidden inside reusable modules.

## 21. Impact On NEWAX Core

NEWAX Core must provide stable reusable modules with approved extension mechanisms.

Impact:

- Core modules need documented configuration where variation is expected.
- Core modules should emit documented events for important actions.
- Core modules should define approved APIs and services for extension.
- Core modules must avoid client-specific assumptions.
- Module documentation should explain supported extension points.
- Module changelogs should call out changes that affect extensions.
- Architecture review should decide when a client requirement becomes reusable platform behavior.

This decision strengthens NEWAX Core as a controlled, reusable business infrastructure foundation.

## 22. Impact On Client Systems

Client systems can support unique business requirements without forking or damaging reusable modules.

Impact:

- Client-specific behavior should live in client extensions, configuration, adapters, or approved override points.
- Client systems can upgrade core modules more safely.
- Client ownership of customization becomes clearer.
- Client-specific behavior must be documented and tested.
- Client customizations must respect permissions, tenancy, audit, and security requirements.
- Client-specific roles, workflows, reports, and integrations can evolve without changing reusable core module internals.

This protects both client delivery and long-term platform maintainability.

## 23. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [ADR 0002: Use Permission-Based Access Control](./0002-use-permission-based-access-control.md)
- [ADR 0003: Design for Multi-Tenancy](./0003-design-for-multi-tenancy.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 24. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, or Security ownership is assigned.
