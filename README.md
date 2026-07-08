# NEWAX Core

NEWAX Core is the private engineering foundation for NEWAX. It is intended to define the durable technical base, module boundaries, architectural direction, and shared engineering standards that will support NEWAX as the product grows.

This repository starts as an internal foundation document. It does not contain production implementation code yet.

## What NEWAX Core Is

NEWAX Core is the central engineering foundation for the NEWAX platform. Over time, it will contain the core product modules, shared domain language, application services, platform conventions, and internal contracts that allow the product to evolve without fragmenting across disconnected systems.

The goal is not to build everything at once. The goal is to create a clear technical home for the most important product capabilities and to establish boundaries that can survive growth.

## Why It Exists

NEWAX Core exists to provide a stable, intentional engineering base before product complexity expands.

It is designed to help the team:

- Keep product logic centralized and understandable.
- Avoid premature fragmentation across many services or repositories.
- Establish consistent module boundaries and ownership rules.
- Make future engineering decisions easier to review, document, and evolve.
- Support long-term product iteration without accumulating avoidable architectural debt.
- Create a shared language between Product and Engineering.

## Long-Term Vision

The long-term vision for NEWAX Core is to become the trusted internal system of record for NEWAX product engineering.

As the platform matures, this repository should support:

- Clear domain modules with explicit ownership.
- Stable internal contracts between modules.
- A predictable path from product requirements to technical implementation.
- Consistent standards for quality, testing, observability, and security.
- A foundation that can later support selective service extraction if operational scale requires it.

NEWAX Core should remain boring in the best possible way: understandable, reliable, maintainable, and difficult to misuse.

## Core Principles

### 1. Product Clarity Before Technical Expansion

Engineering work should be grounded in a clear product need, business purpose, or operational requirement. Technical structure should serve product direction, not race ahead of it.

### 2. Modular Boundaries First

Modules should have clear responsibilities, owned data, and explicit interfaces. Internal boundaries matter even when everything runs inside one deployable system.

### 3. Prefer Simple, Durable Architecture

The first architecture should optimize for correctness, maintainability, and team velocity. Complexity should be introduced only when there is a proven need.

### 4. Domain Logic Belongs In The Core

Important business rules should live in well-defined core modules, not be scattered across UI code, scripts, integrations, or one-off workflows.

### 5. Explicit Contracts Over Implicit Coupling

Modules should communicate through deliberate interfaces, application services, events, or documented contracts. Shared databases or hidden dependencies should be avoided unless intentionally approved.

### 6. Security And Privacy By Default

Access control, data handling, auditability, and privacy requirements should be considered foundational concerns, not late-stage additions.

### 7. Documentation Is Part Of The System

Architectural decisions, module responsibilities, and ownership boundaries should be documented as the system evolves.

## Initial Planned Modules

The following module names are initial planning boundaries. They may evolve as Product and Engineering refine the platform model.

| Module | Purpose |
| --- | --- |
| Identity & Access | Authentication, authorization, roles, permissions, and access policies. |
| Accounts & Organizations | Customer, organization, workspace, team, and membership concepts. |
| Product Core | Central product entities, workflows, and business rules specific to NEWAX. |
| Workflow & Operations | Internal operational flows, approvals, state transitions, and lifecycle management. |
| Data & Reporting | Analytical models, reporting boundaries, metrics, and internal data access patterns. |
| Notifications | Email, in-app, system, and workflow-triggered communication boundaries. |
| Integrations | External systems, third-party APIs, import/export flows, and integration contracts. |
| Administration | Internal admin capabilities, support tooling, audit views, and governance controls. |
| Platform Foundation | Shared technical primitives, configuration, observability, security utilities, and infrastructure conventions. |

## Architecture Direction

NEWAX Core should begin as a modular monolith.

This means the system should start as a single deployable application with strong internal module boundaries. The team should avoid starting with distributed microservices unless there is a clear operational, scaling, security, or ownership reason.

The modular monolith direction gives NEWAX several advantages early on:

- Faster development and simpler deployment.
- Easier local reasoning across product flows.
- Lower operational overhead.
- Stronger consistency for shared domain rules.
- A cleaner path to extract services later if specific modules require independent scaling or ownership.

Service extraction should be treated as a future architectural option, not a starting assumption.

## Standard Module Structure

Each module should follow a consistent internal structure once implementation begins. The structure below is a planning convention, not production code.

```text
modules/
  <module-name>/
    README.md
    domain/
    application/
    infrastructure/
    interface/
    contracts/
    tests/
```

Recommended responsibilities:

| Area | Responsibility |
| --- | --- |
| `README.md` | Module purpose, ownership, boundaries, and key decisions. |
| `domain/` | Core business concepts, rules, invariants, and domain behavior. |
| `application/` | Use cases, orchestration, commands, queries, and application-level workflows. |
| `infrastructure/` | Persistence, external clients, adapters, queues, and framework-specific details. |
| `interface/` | API handlers, controllers, jobs, event consumers, or module entry points. |
| `contracts/` | Internal events, DTOs, schemas, and documented module-facing contracts. |
| `tests/` | Unit, integration, contract, and module-level behavioral tests. |

A module should be understandable from its README before someone reads its implementation.

## Product And Engineering Ownership Boundaries

NEWAX Core should make ownership explicit so Product and Engineering can collaborate without blurring responsibilities.

### Product Owns

- Product vision, customer problems, and outcome priorities.
- Feature scope, sequencing, and acceptance criteria.
- User workflows, product policies, and experience requirements.
- Business rules that come from market, customer, compliance, or operational needs.
- Release priorities and tradeoff decisions when product value is the deciding factor.

### Engineering Owns

- System architecture and technical design.
- Module boundaries, data ownership, and internal contracts.
- Implementation approach, code quality, test strategy, and maintainability standards.
- Security, reliability, observability, and operational readiness.
- Technical debt management and architectural decision records.

### Shared Ownership

- Translating product requirements into durable domain concepts.
- Identifying tradeoffs between delivery speed, correctness, and maintainability.
- Defining success metrics and release readiness signals.
- Reviewing cross-module changes that affect product behavior or system architecture.
- Maintaining a shared language for core NEWAX concepts.

## Working Agreements

- Major module additions should include a short module README before implementation begins.
- Cross-module dependencies should be intentional and documented.
- New business rules should be attached to a clear product rationale.
- Architectural decisions with long-term impact should be captured in an ADR or equivalent decision note.
- Internal contracts should be versioned or migrated deliberately when they affect more than one module.
- Production code should not be added until the initial architecture and module boundaries are agreed.

## Current Status

This repository is in foundation planning mode.

Current focus:

- Establish repository purpose.
- Define initial architecture direction.
- Align Product and Engineering ownership boundaries.
- Prepare for future implementation without introducing production code prematurely.

Next expected step: define the first module-level README files and architecture decision records before implementation begins.
