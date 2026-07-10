# ADR 0005: Use Event-Driven Module Communication

## Purpose

Document how NEWAX Core modules should communicate through events to reduce coupling, support client-specific customization, and protect reusable core modules.

This ADR aligns NEWAX Core with its role as a reusable business infrastructure foundation by defining when and how modules should publish and listen to events without directly modifying each other's internals.

## 1. Decision Title

ADR 0005: Use Event-Driven Module Communication

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core is being established as the private foundation for reusable modules, platform services, and future client solutions.

As modules grow, they will need to react to important business actions across the system. For example, a notification service may need to send a message when a student is created, or a client extension may need to apply a custom receipt format when a payment is approved.

If modules communicate by directly editing each other's internal data or calling undocumented internals, module boundaries will weaken and reusable core modules will become harder to maintain.

## 5. Problem

NEWAX Core needs module communication that supports coordination without creating tight coupling.

Without clear event rules, modules may:

- Directly modify another module's internal records.
- Depend on private services or internal implementation details.
- Embed client-specific behavior inside reusable core modules.
- Become difficult to test independently.
- Create hidden side effects.
- Make upgrades risky.
- Make audit and security behavior inconsistent.

NEWAX Core needs a practical event communication standard that keeps modules independent while allowing important actions to trigger follow-up behavior.

## 6. Decision

NEWAX Core modules should use events for important business actions where other modules or client extensions may need to react.

Modules may publish events when important actions happen. Other modules or client extensions may listen to those events and perform follow-up behavior through approved APIs and services.

Modules should not directly modify another module's internal data.

Events should not replace simple direct service calls when a direct call is clearer and safer.

This ADR does not create an event bus, actual event handlers, or implementation code. It defines the architecture direction and rules for future module communication.

## 7. Reasoning

Event-driven communication helps NEWAX Core preserve modularity while supporting real business workflows.

This approach gives NEWAX:

- Stronger module independence.
- Lower coupling between reusable modules.
- Safer client-specific customization.
- Better audit and logging opportunities.
- More predictable extension points.
- Cleaner ownership boundaries.
- Easier future extraction of modules or services.
- Better long-term scalability as business workflows grow.

Events allow modules to announce that something important happened without needing to know every system behavior that may follow.

## 8. Alternatives Considered

### Direct Internal Module Calls

One module could directly call another module's internal services or modify its internal data.

This was not selected because it creates tight coupling and weakens module ownership boundaries.

### Centralized Workflow Logic For Everything

A single central workflow layer could coordinate all module behavior.

This was not selected as the default because it can become a bottleneck and concentrate too much business behavior in one place.

### No Cross-Module Communication Standard

Each module could decide its own communication style.

This was not selected because inconsistent communication patterns would make NEWAX Core harder to maintain, test, secure, and extend.

### Events For Every Interaction

Every module interaction could be event-based.

This was not selected because events can add unnecessary complexity when a simple direct service call is clearer, safer, and easier to reason about.

## 9. What Events Are

Events are documented messages that announce that something meaningful has happened inside a module.

Examples:

- A student was created.
- A payment was approved.
- A course was published.
- A user requested a password reset.
- A file was uploaded.
- A report was exported.

Events should describe completed facts, not commands. For example, `payments.approved` describes that a payment has been approved. It does not command another module to send a notification or generate a report.

Events allow modules and client extensions to react without changing the module that published the event.

## 10. Why Events Matter For NEWAX Core

Events matter because NEWAX Core must remain reusable across different clients, industries, and client solutions.

Events help NEWAX:

- Keep modules independent.
- Avoid direct editing of another module's internal data.
- Support client-specific behavior without modifying reusable core modules.
- Add integrations and extensions more safely.
- Preserve upgrade paths for core modules.
- Improve observability of important business actions.
- Support future asynchronous processing where operational scale justifies it.

Events are a controlled extension mechanism for reusable business infrastructure.

## 11. Event Naming Convention

Event names must use a predictable convention:

```text
module.action
```

Recommended rules:

- Use lowercase names.
- Use the module's documented event namespace.
- Prefer the package or module namespace for the first segment.
- Use past-tense action names for completed business facts where possible.
- Use underscores for multi-word actions.
- Avoid client names in reusable core event names.
- Avoid vague names such as `updated`, `changed`, or `done` without a module namespace.

Examples:

```text
students.created
students.updated
students.suspended
payments.submitted
payments.approved
payments.rejected
courses.created
courses.published
courses.archived
users.password_reset_requested
reports.exported
files.uploaded
```

Conceptual module examples may be described as `student.created`, `payment.approved`, or `course.published`, but each production module must choose one documented event namespace and use it consistently.

## 12. Module Event Ownership

The module that publishes an event owns that event.

Ownership responsibilities:

- Define the event name.
- Document when the event is published.
- Document the event payload at a practical level.
- Document security and tenant context expectations.
- Document whether the event is internal, platform-facing, or extension-facing.
- Maintain backward compatibility where reasonable.
- Update changelogs when event behavior changes.

A consuming module or client extension must not redefine another module's event meaning.

## 13. Event Publishing Rules

Modules should publish events for important business actions where other modules, integrations, audit processes, or client extensions may need to react.

Publishing rules:

- Publish events only after the publishing module has completed the relevant action successfully.
- Publish events from the module that owns the business action.
- Keep event payloads minimal and purposeful.
- Include identifiers and context needed for approved listeners to retrieve additional data safely.
- Include tenant or organization context when the event relates to tenant-owned data.
- Do not include secrets, credentials, or unnecessary sensitive data.
- Document all published events in the module documentation.
- Treat security-sensitive events as audit-relevant where appropriate.

Events should be reliable enough for important workflows, but this ADR does not define implementation delivery guarantees yet.

## 14. Event Listening Rules

Modules and client extensions may listen to events when they need to perform follow-up behavior.

Listening rules:

- Listeners must use approved APIs, services, or documented extension points.
- Listeners must not modify another module's internal data directly.
- Listeners must respect permissions, tenant boundaries, and security rules.
- Listeners should be idempotent where repeated processing is possible.
- Listener side effects should be documented when they affect business behavior.
- Listeners should fail safely and avoid breaking the publishing module's core workflow unless explicitly required.
- Listeners should not assume undocumented event payload fields.

Event listeners extend behavior; they do not take ownership of the publishing module's business rules.

## 15. Client Customization Through Events

Events are a primary mechanism for client-specific customization.

Client extensions may listen to documented events and apply client-specific behavior without modifying reusable core modules.

Examples:

```text
payment.approved -> apply custom ABC Institute receipt format
student.created -> assign ABC Institute onboarding checklist
course.published -> notify a client-specific external learning portal
```

Rules:

- Client-specific event listeners must live outside reusable core modules.
- Client-specific listeners must be documented.
- Client-specific listeners must not weaken core permissions, tenant isolation, or audit requirements.
- Client-specific behavior must not require direct edits to reusable core module internals.
- Client customizations must not block future core module updates.

This aligns with ADR 0004: Separate Client Customizations from Core Modules.

## 16. Audit And Logging Considerations

Events can improve auditability, but they are not a replacement for audit logs.

Audit and logging rules:

- Security-sensitive events must be logged where appropriate.
- Event publication and listener failures should be observable for important workflows.
- Events affecting access, payments, reports, tenant data, integrations, or sensitive records should have clear audit expectations.
- Audit logs should preserve actor, tenant, timestamp, action, and relevant resource context where appropriate.
- Client-specific event listeners should log security-sensitive actions they perform.
- Event logs should avoid storing unnecessary sensitive payload data.

Audit requirements must be defined by the module or platform service responsible for the security-sensitive behavior.

## 17. Security Considerations

Events must not create security bypasses.

Security rules:

- Events must not expose secrets, credentials, or unnecessary sensitive data.
- Events must preserve tenant or organization context where required.
- Listeners must enforce permissions before performing protected actions.
- Event consumers must not trust event data beyond documented guarantees.
- Cross-tenant event handling must be explicitly prevented unless approved and audited.
- Client-specific listeners must not bypass core access control.
- Events related to authentication, permissions, payments, audit, or sensitive data require careful review.

Security-sensitive events must be logged where appropriate.

## 18. Scalability Considerations

Event-driven communication supports long-term scalability, but NEWAX Core should start practical.

Scalability principles:

- Start with a simple event approach suitable for a modular monolith.
- Avoid introducing distributed messaging infrastructure before operational scale justifies it.
- Keep event names and payloads stable so future event bus or queue systems can be introduced later.
- Design listeners so heavy processing can move to background jobs or separate services in the future.
- Monitor high-volume events when modules begin processing production workloads.
- Consider asynchronous processing only when reliability, performance, or scale requirements justify it.

Events should help NEWAX evolve without forcing premature infrastructure complexity.

## 19. Maintenance Considerations

Event-driven communication requires documentation and discipline.

Maintenance rules:

- Each module must document the events it publishes.
- Important listeners should be documented in the owning module, integration, or client extension.
- Event payload changes should be treated as compatibility-sensitive changes.
- Breaking event changes should be reflected in module changelogs.
- Tests should cover important event publication and listener behavior when implementation begins.
- Unused or deprecated events should be documented before removal.
- Event naming should remain consistent across modules.

Events should make behavior easier to extend and observe, not harder to understand.

## 20. Impact On NEWAX Core

NEWAX Core modules must support event-driven communication where it strengthens module independence and extension safety.

Impact:

- Modules should document published events.
- Modules should avoid direct modification of another module's internal data.
- Platform services such as notifications, audit, reports, workflow, and integrations may listen to events.
- Module standards should include event documentation expectations.
- Reusable modules should expose events for important actions where extension is likely.
- Security-sensitive event behavior should be reviewed and logged where appropriate.
- Future implementation may introduce an event bus only when the architecture is ready.

This decision improves modularity, maintainability, auditability, and future scalability.

## 21. Impact On Client Systems

Client systems can use events to add custom behavior without changing reusable core modules.

Impact:

- Client extensions may listen to core events.
- Client-specific workflows can be added outside reusable modules.
- Client-specific integrations can react to approved events.
- Client-specific behavior remains easier to document, test, and upgrade.
- Client systems must respect tenant, permission, and audit requirements when listening to events.
- Client extensions should not rely on undocumented event payloads or internal module behavior.

Events give client systems flexibility while preserving NEWAX Core as a reusable platform foundation.

## 22. Related Documents

- [NEWAX Core Architecture](../architecture/core-architecture.md)
- [NEWAX Module Standard](../standards/module-standard.md)
- [ADR 0001: Use Modular Monolith First](./0001-use-modular-monolith-first.md)
- [ADR 0002: Use Permission-Based Access Control](./0002-use-permission-based-access-control.md)
- [ADR 0003: Design for Multi-Tenancy](./0003-design-for-multi-tenancy.md)
- [ADR 0004: Separate Client Customizations from Core Modules](./0004-separate-client-customizations-from-core.md)
- [Architecture Decision Record Template](./ADR-TEMPLATE.md)
- [Reusable Module Template](../../templates/module-template/README.md)

## 23. Approved By

Initial architecture direction approved for NEWAX Core foundation planning.

Approvers should be updated as formal Product, Engineering, Architecture, or Security ownership is assigned.

## Communication Examples

Student module publishes:

```text
student.created
student.updated
student.suspended
```

Payment module publishes:

```text
payment.submitted
payment.approved
payment.rejected
```

Course module publishes:

```text
course.created
course.published
course.archived
```

Notification module listens:

```text
student.created -> send welcome email
payment.approved -> notify student
course.published -> notify enrolled students
```

Client extension listens:

```text
payment.approved -> apply custom ABC Institute receipt format
```

Bad:

```text
Directly editing the Notifications module inside the Student module.
```

Good:

```text
Student module emits student.created.
Notification module listens and sends the message.
```
