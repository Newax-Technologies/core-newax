# ADR 0011: Define Technology Stack and Implementation Baseline

## 1. Decision Title

Define the initial technology stack and repository implementation baseline for NEWAX Core.

## 2. Status

Accepted

## 3. Date

2026-07-10

## 4. Context

NEWAX Core now has an established architecture direction, Central Identity and Organization Registry, module boundaries, engineering standards, Architecture Decision Records, Module Registry, and approval controls.

The repository is ready to move from documentation-only planning into controlled implementation.

A technology stack is required that supports:

- A modular monolith first.
- Clear Foundation, Platform Service, Business Domain, and Client Solution layers.
- Enterprise-grade web applications and APIs.
- Organization-scoped multi-tenancy.
- Permission-based authorization.
- Relational business data and reporting.
- Reusable modules and controlled client extensions.
- Long-term ownership and self-hosting options.
- Predictable testing, deployment, maintenance, and upgrades.
- A practical development model for a growing NEWAX engineering team.

The stack must reduce operational complexity rather than introduce infrastructure merely because the tools are fashionable.

## 5. Problem

Without an accepted implementation baseline, NEWAX Core risks:

- Inconsistent languages and frameworks across modules.
- Duplicate build and deployment approaches.
- Architecture rules that cannot be enforced consistently.
- Client systems built on incompatible technical foundations.
- Uncontrolled dependency selection.
- Premature microservices, queues, databases, and infrastructure.
- Vendor lock-in that weakens long-term ownership.
- Delayed implementation because every module reopens the same technology decisions.

NEWAX needs one clear starting stack that is capable enough for mission-critical systems without becoming unnecessarily complicated.

## 6. Decision

NEWAX Core will use the following initial implementation baseline.

### 6.1 Primary Language

Use **TypeScript** as the primary application language for backend services, web applications, shared contracts, validation, tooling, and tests.

Rules:

- TypeScript strict mode is required.
- Avoid untyped `any` except at explicit external boundaries with documented justification.
- Shared types must not become a substitute for runtime validation.
- Public contracts must remain versioned and documented.

### 6.2 Runtime

Use **Node.js 24 LTS** as the initial production runtime baseline.

Rules:

- Production applications must use an Active LTS or Maintenance LTS Node.js release.
- The exact runtime version must be pinned in repository and deployment configuration.
- Runtime upgrades must pass compatibility, security, test, and deployment review.
- End-of-life Node.js releases must not be used in production.

### 6.3 Repository and Package Management

Use a **pnpm workspace monorepo**.

Initial baseline:

- pnpm 11 major line.
- One root lockfile.
- Workspace dependencies declared with the `workspace:` protocol.
- Exact package-manager version pinned through the repository package-manager configuration.

Do not introduce Turborepo, Nx, Rush, or another monorepo orchestration layer initially.

Add additional orchestration only when measurable build, caching, dependency-graph, or release-management complexity justifies it.

### 6.4 Repository Application Structure

The implementation baseline will add:

```text
apps/
  api/
  web/

packages/
  core/
  auth/
  organizations/
  users/
  roles/
  permissions/
  dashboard/
  notifications/
  files/
  reports/
  audit/
  <future-modules>/
```

Responsibilities:

- `apps/api/` is the deployable backend application.
- `apps/web/` is the deployable web application.
- `packages/` contains reusable NEWAX modules, contracts, and approved shared capabilities.
- Client-specific extensions must remain outside reusable core packages.

The deployable applications compose modules. They do not own business-domain rules that belong inside modules.

### 6.5 Backend Framework

Use **NestJS 11** for the initial backend application and module composition.

Use the standard NestJS HTTP platform initially unless a measured requirement justifies a different adapter.

NestJS will provide:

- Application composition.
- Dependency injection.
- Controllers and API boundaries.
- Guards for authentication and permission enforcement.
- Pipes for validation.
- Interceptors and exception handling.
- Module lifecycle management.
- OpenAPI integration.
- Testable service boundaries.

Rules:

- NestJS modules must reflect NEWAX module boundaries rather than replace them.
- Controllers remain thin.
- Business rules belong in module services and domain logic.
- NestJS decorators and dependency injection must not create hidden cross-module dependencies.
- Lower architecture layers must not import higher layers.

### 6.6 Web Framework

Use **Next.js 16 with the App Router** for the initial web application.

React versions will follow the supported Next.js compatibility requirements and will be pinned in the lockfile.

Next.js will provide:

- Web application routing.
- Server and client component composition.
- Layouts and navigation.
- Authentication-aware application shells.
- Admin, staff, teacher, student, and client portals.
- Public and authenticated web experiences.
- Self-hostable production builds.

Rules:

- The web application consumes approved backend APIs and contracts.
- Core business logic must not exist only inside Next.js pages, components, route handlers, or server actions.
- Next.js route handlers may support web-specific concerns but must not become the primary NEWAX Core backend.
- Permission enforcement must occur in the trusted backend even when the web interface hides an action.

### 6.7 API Style

Use **RESTful JSON APIs** as the default application interface.

Use NestJS OpenAPI tooling to generate and maintain API documentation.

Rules:

- Follow the NEWAX API Design Standard.
- Use explicit authentication, permission, tenant, validation, pagination, error, and audit behavior.
- API contracts must not expose internal database structures directly.
- GraphQL is not part of the initial baseline.
- GraphQL may be introduced later only through a separate architecture review when a concrete client or product need justifies it.

### 6.8 Primary Database

Use **PostgreSQL 18** as the initial primary relational database baseline.

Deployments must use the current supported minor release within the selected PostgreSQL major version.

PostgreSQL will store:

- Central Registry data.
- Tenant-scoped operational data.
- Module-owned relational data.
- Permission and membership relationships.
- Audit records.
- Transactional business workflows.
- Reporting source data and approved read models.

Rules:

- Use one primary relational database initially.
- Use shared schemas and explicit table prefixes according to module and domain ownership.
- Enforce organization scope through approved application and database access patterns.
- Do not create a separate database for every module initially.
- Do not introduce MongoDB or another primary operational database without an ADR.
- Major PostgreSQL upgrades require migration, compatibility, backup, rollback, and deployment planning.

### 6.9 Database Access and Migrations

Use **Prisma ORM 7** and **Prisma Migrate** as the initial database access and migration baseline.

Prisma will provide:

- Type-safe database access.
- Declarative schema definitions.
- Migration history.
- Generated application client types.
- Consistent local and CI database workflows.

Rules:

- Prisma models must follow the NEWAX Data Model Naming Standard.
- Database ownership remains module-based even if Prisma schema files are composed centrally.
- Migrations must be reviewed and committed.
- Production migrations must be applied through controlled deployment workflows.
- Destructive changes require explicit migration and rollback review.
- Raw SQL is allowed for advanced PostgreSQL features, reporting, performance, or data operations when clearly documented and tested.
- Prisma must not prevent NEWAX from using legitimate PostgreSQL capabilities.

### 6.10 Validation and Contracts

Use runtime validation at every external boundary.

Initial rules:

- NestJS request validation must use explicit data-transfer objects and validation rules.
- Environment variables must be validated during application startup.
- Event payloads and external integration inputs must be validated.
- TypeScript types alone are not sufficient for untrusted runtime data.
- Shared API contract packages may be created when they reduce duplication without coupling consumers to internal module implementation.

A specific validation library may be selected during repository bootstrap and pinned after compatibility testing.

### 6.11 Authentication and Sessions

Authentication will be implemented through the dedicated Authentication and Users Foundation Modules in accordance with ADR 0010.

Baseline rules:

- Browser authentication must use secure, HTTP-only cookie-based session handling.
- Authentication secrets and session material must not be stored in browser local storage.
- Passwords must use an approved modern password-hashing algorithm.
- Session expiration, revocation, login-attempt controls, password reset, and audit behavior must be explicit.
- Multi-factor authentication, OTP, and external identity providers remain supported future extensions.
- Authorization remains permission-based and organization-aware.

Detailed authentication persistence and session design may be refined in a dedicated implementation ADR before production release.

### 6.12 Module Events

Use **in-process module events** inside the modular monolith for suitable cross-module communication.

Rules:

- Events represent completed business or system facts.
- Event contracts must be documented.
- Events must not hide direct dependencies or unclear ownership.
- Use direct service calls when synchronous behavior and dependency direction are clearer.
- Use a transactional outbox when an event must survive process failure or be delivered externally.
- Do not introduce Kafka, RabbitMQ, NATS, or another message broker initially.
- Broker adoption requires a separate architecture review based on measured operational need.

### 6.13 Cache and Background Work

Redis is not required for the initial baseline.

Begin with:

- PostgreSQL-backed state.
- Application-level caching only where safe and measured.
- Database-backed scheduling or controlled in-process scheduling for simple jobs.
- Transactional outbox patterns for durable asynchronous work where needed.

Introduce Redis, a queue system, or distributed locks only when a documented workload requires them.

### 6.14 File Storage

Use an **S3-compatible object-storage interface** for uploaded and generated files.

Rules:

- The Files Module owns storage contracts and access rules.
- Provider-specific behavior must remain behind an adapter.
- Local development may use a local S3-compatible service.
- Production may use an approved cloud or self-hosted S3-compatible provider.
- Sensitive files must not be publicly accessible by default.
- File metadata, tenant ownership, permissions, retention, and audit behavior remain in NEWAX-controlled application data.

This preserves provider flexibility and long-term ownership.

### 6.15 Testing

Use the following initial testing baseline:

- **Vitest 4** for unit and module-level integration tests.
- NestJS testing utilities for backend module tests.
- HTTP integration testing for API behavior.
- **Playwright** for browser end-to-end testing.
- Real PostgreSQL test databases for migration, tenant-isolation, and persistence-sensitive tests.

Rules:

- Follow the NEWAX Testing Standard.
- Do not rely entirely on mocked database tests for tenant, migration, permission, or reporting behavior.
- Permission and tenant-isolation tests are mandatory for protected organization-scoped modules.
- Critical workflows require regression coverage.

### 6.16 Code Quality

Use:

- ESLint for static analysis.
- Prettier for formatting.
- TypeScript strict checks.
- Repository-wide import and dependency-boundary rules.
- Automated validation in CI.

Rules:

- Formatting and linting must be deterministic.
- Generated code should be excluded or handled explicitly.
- Warnings that affect correctness, security, or architecture boundaries must not be ignored indefinitely.

### 6.17 Local Development

Use Docker Compose for local supporting services.

The initial local environment should provide:

- PostgreSQL.
- Optional local S3-compatible storage when file work begins.
- API application.
- Web application.

Developers may run Node.js applications directly while using containers for supporting services.

Local development must not require Kubernetes.

### 6.18 Deployment

Use Docker-compatible container images for deployable applications.

Initial deployment units:

- Web application container.
- API application container.
- PostgreSQL service or approved managed PostgreSQL provider.
- S3-compatible object storage or approved provider.

Rules:

- Containers must be reproducible.
- Production dependencies must be pinned.
- Images must not contain repository secrets.
- Database migrations must be a controlled deployment step.
- Health and readiness endpoints are required.
- Kubernetes is not part of the initial baseline.
- Kubernetes may be considered later when operational scale or deployment requirements justify it.

### 6.19 Continuous Integration

Use **GitHub Actions** as the initial CI platform.

CI should validate:

- Dependency installation from the lockfile.
- Type checking.
- Linting.
- Formatting.
- Unit tests.
- Integration tests.
- API tests.
- Registry validation when implemented.
- Production builds.
- Container builds where applicable.
- Migration safety checks where practical.

Production deployment automation will be defined after the deployment platform is selected.

### 6.20 Observability

The initial applications must provide:

- Structured logs.
- Request and correlation identifiers.
- Health and readiness endpoints.
- Error reporting boundaries.
- Security-relevant audit events.
- OpenTelemetry-compatible instrumentation where practical.

A specific hosted monitoring provider is not mandated by this ADR.

Provider selection must preserve exportability and avoid embedding core business logic into monitoring vendors.

### 6.21 Dependency Policy

Dependencies must be:

- Necessary.
- Actively maintained.
- Compatible with the accepted runtime.
- Security-reviewed according to risk.
- Pinned through the lockfile.
- Replaceable when they sit at infrastructure boundaries.

Avoid installing multiple libraries for the same responsibility without a documented reason.

Major framework and database upgrades require compatibility review and may require a new ADR or an update to this decision.

## 7. Initial Version Baseline

The initial implementation should begin from these major versions:

| Technology | Initial major baseline |
| --- | --- |
| Node.js | 24 LTS |
| pnpm | 11 |
| NestJS | 11 |
| Next.js | 16 |
| PostgreSQL | 18 |
| Prisma ORM | 7 |
| Vitest | 4 |
| Playwright | Current stable 1.x release at bootstrap |

Rules:

- Pin exact versions during repository bootstrap.
- Commit the lockfile.
- Record runtime and database versions in deployment documentation.
- Use current supported patch or minor releases.
- Do not upgrade major versions automatically.
- Reassess the baseline at least annually or before a major implementation phase.

## 8. Reasoning

### One Primary Language

TypeScript allows NEWAX to use one primary language across web, backend, contracts, validation, tests, and tooling.

This reduces context switching and supports a smaller engineering team without forcing every capability into one framework.

### Explicit Backend Architecture

NestJS provides a structured backend application model that aligns with modules, services, dependency injection, guards, validation, testing, and OpenAPI documentation.

Using a separate backend protects business logic from becoming tied to the web framework.

### Enterprise Web Capability

Next.js provides a capable React application framework for public pages, portals, dashboards, administration, and authenticated operational interfaces.

It remains a web-delivery layer rather than the owner of reusable business rules.

### Relational Operational Data

NEWAX systems require strong relationships among people, organizations, memberships, users, roles, permissions, courses, enrollments, payments, results, audit records, and future domain data.

PostgreSQL provides a durable relational foundation for transactions, constraints, reporting, and operational ownership.

### Controlled Data Access

Prisma improves type safety, schema visibility, migrations, and developer consistency while preserving raw SQL as an approved escape path for advanced PostgreSQL use.

### Operational Simplicity

The baseline avoids mandatory microservices, Kubernetes, Redis, message brokers, multiple operational databases, and separate deployment platforms before they are justified.

This aligns with the NEWAX objective of removing operational complexity.

### Ownership and Portability

Node.js, TypeScript, NestJS, Next.js, PostgreSQL, Prisma, Docker-compatible containers, and S3-compatible storage can be deployed across multiple providers and self-hosted environments.

The architecture keeps provider-specific behavior behind adapters.

## 9. Alternatives Considered

### Next.js as the Entire Application Backend

Not selected as the primary architecture.

Next.js route handlers and server actions are useful for web-specific behavior, but making the web framework the sole backend would weaken module boundaries and tie business infrastructure too closely to one presentation layer.

### Microservices From the Start

Rejected under ADR 0001.

The initial product does not yet justify distributed deployment, network failure modes, broker operations, service discovery, distributed tracing, or independent service ownership.

### Java or .NET as the Primary Backend

Both are credible enterprise choices.

They were not selected for the initial baseline because a TypeScript stack provides one primary language across frontend and backend, supports faster initial team development, and remains sufficient for the expected workloads.

This decision may be revisited for a specialized future service when a concrete requirement justifies another runtime.

### Python as the Primary Application Stack

Not selected as the main web and business application baseline.

Python remains appropriate for specialized automation, AI, analytics, or data-processing services when required, but it should not create a second primary application architecture without a documented boundary.

### MongoDB as the Primary Database

Not selected.

NEWAX Core has strongly relational identity, organization, permission, membership, payment, enrollment, result, and audit models. PostgreSQL provides clearer integrity and reporting foundations for these requirements.

### Firebase, Supabase, or Another Backend Platform as the Core

Not selected as the controlling application foundation.

Approved managed services may be used through adapters, but core identity, business rules, permissions, tenant boundaries, and operational ownership must remain controlled by NEWAX.

### GraphQL as the Default API

Deferred.

REST with OpenAPI is simpler for the first implementation, operational support, integration, permission review, and client documentation.

### Redis as a Mandatory Baseline

Rejected initially.

Redis should be introduced only for measured caching, queue, rate, session, or distributed-coordination requirements.

### Message Broker as a Mandatory Baseline

Rejected initially.

In-process events and a transactional outbox can satisfy early modular-monolith requirements without creating separate broker operations.

### Kubernetes as the Initial Deployment Platform

Rejected initially.

Containerized applications do not require Kubernetes by default. The additional operational surface is not justified until scale, isolation, or deployment complexity requires it.

### Turborepo or Nx From the Start

Deferred.

pnpm workspaces are sufficient for the initial repository. Additional orchestration should be introduced only when build graph, caching, or release complexity becomes measurable.

## 10. Consequences

### Positive Consequences

- One primary language across most application development.
- Clear separation between web delivery and business backend.
- Strong alignment with modular monolith architecture.
- Relational data integrity and reporting capability.
- Controlled migrations and type-safe data access.
- Practical local development.
- Portable, containerized deployment.
- Reduced initial operational complexity.
- Clear defaults for future modules.
- Easier recruitment and onboarding around a coherent stack.

### Negative Consequences

- The team must maintain separate web and API applications.
- JavaScript ecosystem dependencies require active security and upgrade management.
- Prisma may require raw SQL for advanced database behavior.
- Shared TypeScript contracts can create coupling if ownership is unclear.
- A monorepo requires disciplined dependency boundaries.
- Delaying Redis, brokers, or Kubernetes means they may require later migration when justified.

### Accepted Tradeoff

NEWAX accepts moderate application-layer structure in exchange for lower operational complexity, clearer ownership, and a safer path to scale.

## 11. Impact On NEWAX Core

This decision establishes the implementation baseline for:

- Repository bootstrap.
- Application folders.
- Package management.
- Backend and frontend composition.
- Database schema and migrations.
- API implementation.
- Testing infrastructure.
- Local development.
- CI.
- Container builds.
- Future module implementation.

It does not activate any module in the Module Registry.

Modules remain `planned` or `draft` until their implementation, documentation, tests, security review, and approval are complete.

## 12. Impact On Client Systems

Client systems will benefit from:

- Consistent APIs and web applications.
- Predictable module composition.
- Controlled deployment records.
- PostgreSQL-backed operational data.
- Provider-flexible containers and object storage.
- Separate client configuration and extension layers.
- Exact module and application versions.

Client deployments may use managed infrastructure providers, but the application architecture must preserve NEWAX and client control over business rules, data contracts, and upgrade paths.

## 13. Security Considerations

- Use supported runtime, database, and framework releases.
- Pin exact production dependencies.
- Enforce TypeScript strict mode and runtime validation.
- Protect browser sessions with secure HTTP-only cookies.
- Keep secrets outside source control.
- Enforce permissions and tenant boundaries in the backend.
- Review Prisma migrations before production application.
- Protect files through private object-storage access and signed or authorized delivery.
- Produce structured logs without exposing secrets or unnecessary personal data.
- Audit sensitive identity, permission, tenant, export, payment, and administrative actions.
- Apply dependency and container security checks in CI where practical.

## 14. Scalability Considerations

The modular monolith can scale vertically and horizontally as stateless web and API application instances.

PostgreSQL remains the transactional source of truth.

Future scale options include:

- Read replicas.
- Connection pooling.
- Approved caching.
- Background workers.
- Redis or queue infrastructure.
- Search infrastructure.
- Reporting replicas or warehouses.
- Selective service extraction.

Each addition must respond to measured operational requirements and preserve module ownership.

## 15. Maintenance Considerations

- Review dependency support and security regularly.
- Keep Node.js on supported LTS releases.
- Keep PostgreSQL on supported major and current minor releases.
- Pin exact versions and commit the pnpm lockfile.
- Upgrade framework majors deliberately.
- Maintain migration history.
- Keep module documentation, versions, and changelogs aligned.
- Avoid unnecessary duplicate libraries.
- Reassess this ADR when major stack assumptions change.

## 16. Implementation Sequence

The first implementation phase should proceed in this order:

1. Create root package and pnpm workspace configuration.
2. Pin Node.js and pnpm versions.
3. Create `apps/api` with NestJS.
4. Create `apps/web` with Next.js App Router.
5. Add PostgreSQL local development configuration.
6. Add Prisma schema and migration baseline.
7. Add shared TypeScript, linting, and formatting configuration.
8. Add Vitest and Playwright foundations.
9. Add GitHub Actions validation.
10. Add Docker-compatible builds and local Docker Compose support.
11. Implement the first Foundation Module only after its module documentation and boundaries are approved for `draft` implementation.

The first recommended implementation module is `people`, followed by `organizations`, `memberships`, `users`, `authentication`, `roles`, and `permissions` according to dependency requirements.

## 17. Related Documents

- `docs/architecture/core-architecture.md`
- `docs/architecture/central-registry-architecture.md`
- `docs/standards/module-standard.md`
- `docs/standards/module-registry-standard.md`
- `docs/standards/environment-standard.md`
- `docs/standards/security-baseline-standard.md`
- `docs/standards/data-model-naming-standard.md`
- `docs/standards/api-design-standard.md`
- `docs/standards/testing-standard.md`
- `docs/standards/documentation-standard.md`
- `docs/standards/module-approval-checklist.md`
- `docs/decisions/0001-use-modular-monolith-first.md`
- `docs/decisions/0002-use-permission-based-access-control.md`
- `docs/decisions/0003-design-for-multi-tenancy.md`
- `docs/decisions/0004-separate-client-customizations-from-core.md`
- `docs/decisions/0005-use-event-driven-module-communication.md`
- `docs/decisions/0006-use-controlled-updates-and-versioning.md`
- `docs/decisions/0008-use-central-identity-and-organization-registry.md`
- `docs/decisions/0009-define-module-registry-and-dependency-rules.md`
- `docs/decisions/0010-define-authentication-and-user-identity-strategy.md`
- `registry/module-registry.json`

## 18. Approved By

- NEWAX Leadership
- NEWAX Product
- NEWAX Engineering
- NEWAX Architecture

Security review is required before the first production deployment.