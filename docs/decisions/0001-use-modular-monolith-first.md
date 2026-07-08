# ADR 0001: Use Modular Monolith First

## Purpose

Document why NEWAX Core will begin as a modular monolith instead of microservices.

This ADR aligns NEWAX Core with its role as a reusable business infrastructure foundation that prioritizes ownership, reliability, modularity, scalability, and long-term maintainability without unnecessary operational complexity.

## 1. Decision Title

ADR 0001: Use Modular Monolith First

## 2. Status

Accepted

## 3. Date

2026-07-09

## 4. Context

NEWAX Core is being established as the private engineering foundation for reusable business infrastructure modules.

The repository is currently focused on architecture, standards, templates, decision records, and future reusable modules. It is not yet implementing production business logic.

NEWAX Core must support future foundation modules, platform services, business modules, and client solutions while remaining maintainable by a small engineering team.

The architecture must provide strong module boundaries without forcing the team into distributed-system complexity before the product, module ownership, and operational scale justify it.

## 5. Problem

NEWAX needs an architecture that supports long-term reuse, client solutions, and business infrastructure while still being practical for early development.

Starting with microservices too early would increase deployment, infrastructure, observability, testing, and integration complexity before there is enough evidence that the system needs independently deployable services.

At the same time, NEWAX Core must avoid becoming a messy monolith where unrelated concerns are mixed together and module ownership becomes unclear.

## 6. Decision

NEWAX Core will start as a modular monolith with strict module boundaries.

The system will begin as a single deployable architecture, but modules must remain independent, documented, and governed by clear ownership rules.

Modular monolith does not mean messy monolith.

## 7. Reasoning

This decision supports NEWAX Core's goal of building reliable business infrastructure without unnecessary complexity.

Key reasons:

- Faster initial development.
- Lower deployment complexity.
- Easier debugging.
- Lower infrastructure cost.
- Better fit for a small engineering team.
- Easier coordination across reusable foundation, platform, and business modules.
- Easier to extract proven reusable modules later.
- Better support for establishing standards, templates, permission rules, and module ownership before distributed deployment.

A modular monolith gives NEWAX control early while preserving the option to evolve later.

## 8. Alternatives Considered

### Start With Microservices

This would create independent deployable services from the beginning.

It was not selected because it would introduce distributed-system complexity before NEWAX has proven module boundaries, stable service ownership, or operational scale requirements.

### Build A Traditional Monolith Without Strong Module Boundaries

This would be simpler in the short term but would risk unclear ownership, hidden coupling, inconsistent permissions, and difficult future extraction.

It was not selected because NEWAX Core must become reusable business infrastructure, not a one-off application.

### Use Separate Repositories For Every Module Immediately

This could enforce separation, but it would slow early development and increase coordination overhead before module interfaces are mature.

It was not selected because NEWAX needs to define reusable module standards and contracts first.

## 9. Why Not Microservices At The Beginning

Microservices are not the right starting point for NEWAX Core.

They introduce:

- More deployment complexity.
- More infrastructure cost.
- More complex local development.
- More difficult debugging.
- Network failure handling between services.
- Distributed tracing and observability needs.
- Cross-service data consistency challenges.
- More complex permission and tenancy enforcement.
- Higher testing and integration overhead.

NEWAX Core needs clear ownership and reliable reusable modules before it needs independently deployable services.

Microservices may be introduced later only when operational scale, team structure, or performance requirements justify them.

## 10. Benefits Of Modular Monolith For NEWAX Core

A modular monolith gives NEWAX Core the following benefits:

- A single deployable system during early development.
- Strong internal module boundaries.
- Easier module discovery and documentation.
- Faster iteration on standards and templates.
- Lower operational burden.
- Consistent permission and tenancy enforcement.
- Easier shared testing across modules.
- Lower cost while the platform is still maturing.
- A practical path to later service extraction when module behavior is proven.

This approach supports NEWAX Core as a reusable business infrastructure foundation without over-engineering the first version.

## 11. Module Boundary Rules

Each module must remain independent.

Rules:

- Modules should communicate through APIs, services, or events.
- Modules must not reach into another module's internal implementation details.
- Business modules may depend on foundation and platform services.
- Foundation modules must never depend on business modules.
- Client solutions may compose foundation, platform, and business modules.
- Client customizations must not modify reusable core modules directly.
- Cross-module dependencies must be documented.
- Circular dependencies are not allowed.
- Module ownership must be clear before a module becomes reusable.

These rules protect NEWAX Core from becoming a messy monolith.

## 12. Future Microservice Extraction Criteria

A module may become a separate service later if:

- It has independent scaling needs.
- It has heavy processing requirements.
- It requires separate deployment cycles.
- It has different infrastructure requirements.
- It causes performance bottlenecks in the main system.
- A dedicated engineering team owns it.

Additional extraction considerations may include security isolation, compliance requirements, availability requirements, or external integration load.

Extraction should happen only after the module boundary, ownership model, contracts, permissions, data ownership, and operational needs are proven.

## 13. Consequences

Positive consequences:

- Faster early delivery.
- Simpler deployment and operations.
- Easier debugging and local development.
- Lower infrastructure cost.
- Stronger consistency while architecture standards are still maturing.
- Better ability to define reusable module contracts before service extraction.

Tradeoffs:

- The system requires discipline to preserve module boundaries.
- Poorly governed modules could create hidden coupling.
- Scaling will initially happen at the application level rather than per service.
- Future extraction may require planned migration work.

The tradeoffs are acceptable because NEWAX Core is in foundation-building mode.

## 14. Impact On NEWAX Core

NEWAX Core will organize reusable capabilities as modules inside a modular monolith.

This affects:

- Module standards.
- Folder templates.
- Dependency rules.
- Permission architecture.
- Database ownership rules.
- Event communication rules.
- Testing expectations.
- Versioning and changelog discipline.
- Future architecture decisions.

Every reusable module must be designed as if it may eventually need to stand alone, even while it starts inside the monolith.

## 15. Impact On Client Systems

Client systems will be composed from reusable NEWAX Core modules rather than directly modifying core internals.

Client customizations must not modify reusable core modules directly.

Client-specific needs should be handled through:

- Configuration.
- Feature flags.
- Extension hooks.
- Client-specific wrappers.
- Client-specific pages or components outside reusable core modules.
- Approved adapters or integration contracts.

This keeps client systems upgradeable as NEWAX Core evolves.

## 16. Security Considerations

A modular monolith still requires strong security boundaries.

Security expectations:

- Permissions must be enforced in APIs and services, not only UI code.
- Foundation identity and permission modules must remain protected from business-module dependencies.
- Audit-sensitive operations should be documented and testable.
- Client customizations must not bypass reusable core security rules.
- Module boundaries must not be used to hide unsafe access patterns.

Security rules should be part of each reusable module's contract.

## 17. Scalability Considerations

The modular monolith starts with application-level deployment and scaling.

This is acceptable while NEWAX Core is still defining reusable infrastructure and module boundaries.

Scalability strategy:

- Keep modules cohesive.
- Track performance bottlenecks with evidence.
- Avoid premature infrastructure complexity.
- Use clear contracts to prepare for future extraction.
- Extract services only when operational needs justify it.

The architecture should scale through clarity first and distribution later.

## 18. Maintenance Considerations

This decision improves maintainability if module discipline is enforced.

Maintenance expectations:

- Module documentation must stay current.
- Dependencies must remain explicit.
- Permission and event contracts must be tested.
- Database ownership must be clear.
- Versioning and changelogs must document reusable module changes.
- ADRs should be created for major architectural changes.

A modular monolith requires active governance. Without governance, it can become a messy monolith.

## 19. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 20. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, or Security ownership is assigned.
