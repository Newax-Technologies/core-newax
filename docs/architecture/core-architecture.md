# NEWAX Core Architecture

## Purpose

This document explains the architectural direction of NEWAX Core as the private foundation for reusable business infrastructure modules.

NEWAX Core is intended to give NEWAX long-term ownership, control, reliability, modularity, scalability, and maintainability across future products and client solutions.

This document is for internal NEWAX engineering use. It does not define implementation code.

## 1. What NEWAX Core Is

NEWAX Core is the private engineering foundation for reusable NEWAX business infrastructure.

It is the shared technical base where NEWAX defines reusable modules, platform services, architectural standards, permission models, documentation practices, and long-term module boundaries.

NEWAX Core exists to support future products and client solutions without rebuilding the same foundations repeatedly.

It should provide:

- Reusable foundation modules.
- Shared platform services.
- Business module boundaries.
- Client solution composition rules.
- Common security, permission, documentation, versioning, and testing expectations.
- A controlled path for future scale without premature distributed-system complexity.

## 2. What NEWAX Core Is Not

NEWAX Core is not:

- A single client project.
- A place for client-specific customizations to directly modify reusable modules.
- A collection of unrelated utilities.
- A dumping ground for experiments.
- A microservices platform from day one.
- A replacement for product ownership or domain clarity.
- A production implementation shortcut that bypasses standards, tests, or documentation.

A module belongs in NEWAX Core only when it is reusable, documented, owned, testable, and aligned with the architecture direction.

## 3. Architecture Philosophy

NEWAX Core follows a practical architecture philosophy:

- Start simple, but with strong boundaries.
- Favor ownership and clarity over novelty.
- Keep reusable modules client-neutral.
- Document contracts before relying on them.
- Make permissions, configuration, events, and data ownership explicit.
- Build for long-term maintainability before broad scale.
- Introduce operational complexity only when there is evidence that it is needed.

The architecture should help engineers move quickly without allowing the system to become unclear, fragile, or difficult to upgrade.

## 4. Why Modular Monolith First

NEWAX Core starts as a modular monolith.

A modular monolith gives NEWAX a single deployable system with strong internal module boundaries. This allows the team to develop, test, and reason about the platform without the operational overhead of distributed services.

Reasons to start this way:

- Faster early development.
- Easier debugging and local development.
- Stronger consistency for shared domain rules.
- Lower infrastructure and deployment complexity.
- Easier coordination across foundation, platform, and business modules.
- A cleaner path to extract services later when operational scale justifies it.

The goal is not to avoid services forever. The goal is to avoid premature services before module ownership and operational needs are clear.

## 5. Why Not Microservices At The Beginning

NEWAX Core should not begin as a microservices architecture.

Microservices add meaningful complexity:

- Distributed transactions.
- Network failures.
- Service discovery.
- Independent deployment coordination.
- Observability requirements across services.
- Higher testing and integration burden.
- More complex permission and data consistency models.

At the beginning, NEWAX needs control, reliability, and clear module boundaries more than distributed deployment. Microservices may become appropriate later for selected modules, but only when scale, ownership, performance, reliability, or compliance requirements justify the move.

## 6. Core Layers

NEWAX Core is organized around four conceptual layers.

| Layer   | Name              | Purpose                                                                                          |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| Layer 1 | Foundation        | Core identity, people, organization, user, role, and permission capabilities.                    |
| Layer 2 | Platform Services | Shared operational services reused across business modules and client solutions.                 |
| Layer 3 | Business Modules  | Domain-specific reusable capabilities for industries or business verticals.                      |
| Layer 4 | Client Solutions  | Client-facing composed solutions built from reusable foundation, platform, and business modules. |

Layering exists to protect ownership and prevent higher-level client or business concerns from leaking into lower-level reusable foundations.

## 7. Foundation Layer

Layer 1: Foundation includes:

- Authentication.
- People.
- Organizations.
- Users.
- Roles.
- Permissions.

The foundation layer provides the base identity and access model for NEWAX Core.

Foundation modules must be highly stable, well documented, security-focused, and client-neutral. They are allowed to serve all higher layers, but they must not depend on business modules or client solutions.

Foundation modules must never depend on business modules.

## 8. Platform Services Layer

Layer 2: Platform Services includes:

- Dashboard.
- Workflow.
- Notifications.
- Documents.
- Reports.
- Files.
- Search.
- Audit Logs.
- Integrations.

Platform services provide reusable operational capabilities that business modules and client solutions can use.

These services should be generic enough to support multiple domains, but specific enough to provide real value. They may depend on foundation modules for identity, permissions, organization scope, and audit context.

Platform services should not contain client-specific business rules.

## 9. Business Modules Layer

Layer 3: Business Modules includes:

- Education.
- Healthcare.
- Legal.
- Real Estate.
- Retail.
- Hospitality.
- Finance.
- CRM.

Business modules represent reusable domain capability for industries or verticals.

Business modules may depend on foundation and platform services. For example, an Education module may rely on users, organizations, permissions, files, notifications, reports, and audit logs.

Business modules must not directly modify foundation or platform internals. They must use approved APIs, services, events, or documented contracts.

## 10. Client Solutions Layer

Layer 4: Client Solutions includes:

- LMS.
- School Management System.
- Clinic System.
- Legal Case System.
- CRM Portal.
- Operations Dashboard.

Client solutions compose reusable modules into client-facing products or deployments.

A client solution may combine foundation modules, platform services, and business modules. It may add client-specific configuration, pages, workflows, branding, integrations, and approved extension behavior.

Client customizations must not modify reusable core modules directly.

## 11. Module Dependency Rules

Module dependencies must follow the layered architecture.

Rules:

- Foundation modules may depend only on other foundation modules when necessary and approved.
- Foundation modules must never depend on platform services, business modules, or client solutions.
- Platform services may depend on foundation modules.
- Platform services should not depend on business modules unless a specific architecture decision approves it.
- Business modules may depend on foundation and platform services.
- Business modules must not depend on client solutions.
- Client solutions may depend on foundation, platform, and business modules.
- Cross-module dependencies must be explicit, documented, and tested.
- Circular dependencies are not allowed.

Dependencies should point downward toward more foundational capabilities, not upward toward client-specific or domain-specific behavior.

## 12. API Communication Rules

APIs are module contracts.

Rules:

- APIs must expose deliberate capabilities, not internal implementation details.
- APIs must validate permissions for protected operations.
- APIs must route business operations through the appropriate service layer.
- APIs must not directly mutate another module's owned data.
- Public or cross-module API changes must update documentation, tests, changelogs, and versioning where applicable.
- Client-specific API behavior must be implemented through approved extension points, not direct modifications to reusable core APIs.

API communication should make ownership clearer, not blur module boundaries.

## 13. Event Communication Rules

Events allow modules to communicate facts without creating tight coupling.

Rules:

- Events should describe meaningful business or system facts.
- Event payloads must be documented.
- Event producers and consumers must be clear.
- Events must not be used to hide unclear ownership boundaries.
- Consumers must not rely on undocumented payload fields.
- Breaking event changes must update versioning, changelogs, and documentation.
- Event usage must be tested when it affects reusable behavior.

Events are for coordination, not for bypassing module contracts.

## 14. Database Ownership Rules

Data ownership must follow module boundaries.

Rules:

- Each module owns its data model and schema decisions.
- A module must not directly modify another module's owned data.
- Cross-module data access must happen through approved services, APIs, events, or documented read models.
- Shared tables should be avoided unless ownership and access rules are explicit.
- Schema changes must include migration, compatibility, testing, and changelog notes when applicable.
- Client-specific fields must not be added to reusable core schemas without an approved extension strategy.

Database ownership is a core part of module independence and long-term maintainability.

## 15. Permission Architecture

Permissions are foundational to NEWAX Core.

Permission architecture should provide:

- Explicit actions.
- Clear role and permission relationships.
- Organization-aware access control.
- Auditability for protected actions.
- Consistent enforcement across APIs, services, pages, and workflows.
- Safe client-specific extension points.

Permission rules must be documented in the module that owns the protected capability.

Permission behavior must not live only in UI code. APIs and services must enforce permission rules for protected operations.

## 16. Multi-Tenancy Direction

NEWAX Core should be designed with multi-tenancy in mind from the beginning.

Initial direction:

- Organizations are the primary tenant boundary.
- Users may belong to one or more organizations when product requirements justify it.
- Roles and permissions should be organization-aware.
- Data access should be scoped by organization or approved tenant boundary.
- Audit logs should preserve actor, organization, action, and target context.
- Client-specific behavior should be configuration-driven or extension-based, not hard-coded into reusable modules.

The exact tenancy model may evolve, but modules should avoid assumptions that prevent safe multi-tenant use later.

## 17. Client Customization Rules

Client customization must be controlled and isolated.

Client customizations must not modify reusable core modules directly.

Allowed customization paths include:

- Configuration.
- Feature flags.
- Extension hooks.
- Client-specific wrapper modules.
- Client-specific pages or components outside reusable core modules.
- Client-specific integrations through documented contracts.
- Approved adapters.

Rules:

- Reusable core modules must remain client-neutral.
- Client customizations must not weaken security, permissions, auditability, or data ownership.
- Reusable behavior should be promoted into core only after Engineering review.
- Client-specific requirements must be documented with rationale and scope.

## 18. Upgrade And Versioning Direction

NEWAX Core modules should be versioned and upgraded intentionally.

Direction:

- Each reusable module should maintain its own `VERSION` and `CHANGELOG.md`.
- Breaking changes must be clearly identified.
- Upgrades should document affected APIs, events, permissions, schemas, configuration, and client extension points.
- Modules should avoid hidden behavior changes.
- Client solutions should be able to understand what changed before adopting an updated reusable module.

Versioning exists to protect long-term reuse and client stability.

## 19. Security Principles

Security must be built into NEWAX Core from the foundation layer upward.

Principles:

- Secure by default.
- Least privilege access.
- Explicit permission checks.
- Organization-aware access boundaries.
- Auditable protected actions.
- No secrets committed to the repository.
- Clear ownership for sensitive data.
- Client customizations must not bypass core security rules.
- Security-impacting changes must be documented, reviewed, and tested.

Security is not a later add-on. It is part of the architecture contract.

## 20. Scalability Principles

NEWAX Core should scale through clarity first and distribution later.

Principles:

- Keep modules cohesive and independently understandable.
- Optimize clear ownership before service extraction.
- Use contracts to protect module boundaries.
- Add observability around important workflows.
- Identify bottlenecks with evidence before adding infrastructure complexity.
- Extract services only when operational scale, reliability, performance, security, or ownership requires it.

Scalability means the system can grow without becoming unmanageable.

## 21. Future Evolution Path

NEWAX Core starts as a modular monolith and may evolve only when operational scale justifies it.

Potential future evolution may include:

- Extracting selected platform services into independent deployable services.
- Creating dedicated data stores for high-scale modules.
- Introducing asynchronous processing for heavy workflows.
- Separating client solution deployment concerns from reusable module development.
- Adding stronger module contract testing and compatibility tooling.
- Creating service boundaries for modules with independent reliability or compliance requirements.

Future evolution must preserve the core architecture principles: ownership, control, reliability, modularity, scalability, and long-term maintainability.
