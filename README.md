# NEWAX Core

## The private foundation for NEWAX business infrastructure

NEWAX Core is the internal architecture, governance, module, and engineering foundation used to build the systems modern organizations depend on.

NEWAX is **The Business Infrastructure Company**. This repository supports that position by establishing a reusable foundation for Enterprise Software, Intelligent Automation, and Connected Infrastructure without reducing NEWAX to another collection of disconnected client projects.

The objective is straightforward:

> Build infrastructure once, own it, improve it deliberately, and reuse it safely.

## Repository Status

NEWAX Core is currently in **architecture and governance foundation mode**.

The repository contains:

- Core architecture documentation
- Central Identity and Organization Registry architecture
- Accepted Architecture Decision Records
- Engineering standards
- Reusable module templates
- Package and deployment templates
- A draft operational Module Registry
- Module approval and review controls

The repository does **not yet contain approved production module implementations**.

All modules in the operational registry remain `planned` unless an approved change records otherwise. A registry entry identifies intended infrastructure. It does not magically transform a directory into production software, despite the historic optimism of project trackers everywhere.

## What NEWAX Core Is

NEWAX Core is the private reusable engineering foundation behind future NEWAX systems.

It is intended to provide:

- A central identity and organization foundation
- Reusable business infrastructure modules
- Clear data and responsibility ownership
- Permission-based access control
- Organization-scoped tenant boundaries
- Stable APIs, services, events, and contracts
- Controlled client customization
- Consistent security, testing, documentation, and versioning
- Traceable packages and client deployments
- A dependable path from architecture to implementation

NEWAX Core is not a single client application. Client solutions are assembled from approved modules, packages, configuration, and separately documented extensions.

## Core Business Principle

Organizations should own the infrastructure that powers their operations.

NEWAX Core supports this by helping NEWAX build systems that provide:

- Simplicity
- Reliability
- Visibility
- Operational efficiency
- Control
- Confidence
- Long-term ownership

Technology is not the outcome. Better operations are the outcome.

## Architecture Direction

NEWAX Core uses a **modular monolith first** approach.

The system should begin with one deployable application boundary while preserving strong internal module boundaries.

This provides:

- Simpler deployment
- Lower operational overhead
- Faster product development
- Clearer cross-module reasoning
- Consistent security and tenant enforcement
- A controlled path to future service extraction

Independent services may be extracted later when real evidence justifies them, such as independent scaling, stronger security isolation, separate operational ownership, or independent deployment requirements.

Architecture details:

- [Core Architecture](docs/architecture/core-architecture.md)
- [Architecture Index](docs/architecture/README.md)

## Architecture Layers

NEWAX Core is organized into four layers:

```text
Layer 4: Client Solutions
Layer 3: Business Domain Modules
Layer 2: Platform Service Modules
Layer 1: Foundation Modules
```

Dependencies move downward toward more stable layers.

### Layer 1: Foundation Modules

Shared identity, organization, user, access, and control capabilities.

Examples:

- People
- Organizations
- Memberships
- Users
- Authentication
- Roles
- Permissions
- Contacts

Foundation Modules must remain independent from LMS, CRM, Legal, Healthcare, Finance, and other business domains.

### Layer 2: Platform Service Modules

Shared operational services used across multiple domains.

Examples:

- Audit
- Files
- Notifications
- Dashboard
- Reports
- Workflow
- Search
- Integrations

### Layer 3: Business Domain Modules

Reusable capabilities for specific operational domains.

Initial LMS examples:

- LMS Students
- LMS Teachers
- LMS Courses
- LMS Lectures
- LMS Enrollments
- LMS Tests
- LMS Test Results
- LMS Payments

Future domains may include CRM, Legal, Healthcare, Finance, HR, Real Estate, Retail, Hospitality, and Connected Infrastructure.

### Layer 4: Client Solutions

Approved compositions of Foundation, Platform Service, and Business Domain Modules.

Client-specific configuration and extensions remain visible and separate from reusable core modules.

## Central Identity and Organization Registry

The Central Registry is the shared identity and organization foundation for future NEWAX systems.

It separates:

- A **person**, who is a real human being
- A **user**, which is a login account linked to a person
- An **organization**, which provides client and tenant context
- A **membership**, which connects a person to an organization
- A **role**, which groups permissions
- A **permission**, which authorizes an explicit action
- A **contact**, which records approved communication channels
- An **audit record**, which records important system activity

Business domains reference these shared records through identifiers such as:

```text
person_id
organization_id
user_id
membership_id
```

The LMS is one connected domain. It is not the center of the platform.

Future domains must not depend on LMS tables to identify people, users, organizations, roles, or permissions.

Read:

- [Central Registry Architecture](docs/architecture/central-registry-architecture.md)
- [ADR 0008: Central Identity and Organization Registry](docs/decisions/0008-use-central-identity-and-organization-registry.md)
- [ADR 0010: Authentication and User Identity Strategy](docs/decisions/0010-define-authentication-and-user-identity-strategy.md)

## Permission-Based Access

NEWAX Core uses explicit permission-based authorization.

Examples:

```text
students.view
students.create
payments.approve
reports.export
```

Roles group permissions for administrative convenience. Business logic must not authorize actions using hardcoded role names.

Authentication, person identity, user accounts, memberships, roles, and permissions remain separate concepts.

## Multi-Tenancy

NEWAX Core is designed for organization-scoped multi-tenancy.

Tenant-aware modules must enforce organization boundaries across:

- APIs
- Services
- Database queries
- Reports
- Exports
- Files
- Dashboards
- Events
- Administrative access

Cross-organization and NEWAX super-admin access must be explicit, permission-controlled, and auditable.

## Repository Structure

```text
docs/
  architecture/       System-level architecture documentation
  decisions/          Architecture Decision Records
  standards/          Engineering and governance standards

registry/
  module-registry.json
  README.md

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

scripts/               Future repository and validation automation

templates/
  module-template/
  module-registry/
  client-deployment-manifest/
  package/
  environment/
  security/
  data-model/
  api/
  testing/
  documentation/
  approval/

examples/
  lms/                  Future example solution composition
```

Some registry paths point to planned module locations that do not yet exist. Those paths define the required future structure and must not be mistaken for completed module documentation.

## Documentation

Start with the main documentation index:

- [NEWAX Core Documentation](docs/README.md)

Important sections:

- [Architecture](docs/architecture/README.md)
- [Architecture Decision Records](docs/decisions/README.md)
- [Engineering Standards](docs/standards/README.md)
- [Module Registry Operating Guide](registry/README.md)

## Accepted Architecture Decisions

The current ADR set covers:

1. Modular monolith first
2. Permission-based access control
3. Multi-tenancy direction
4. Separation of client customization from core
5. Event-driven module communication where appropriate
6. Controlled updates and semantic versioning
7. LMS centralized database ownership
8. Central Identity and Organization Registry
9. Module Registry and dependency rules
10. Authentication and user identity strategy

Review the complete index:

- [Architecture Decision Records](docs/decisions/README.md)

## Engineering Standards

Current standards include:

- Module Standard
- Module Registry Standard
- Client Deployment Manifest Standard
- Package Standard
- Environment Standard
- Security Baseline Standard
- Data Model Naming Standard
- API Design Standard
- Testing Standard
- Documentation Standard
- Module Approval Checklist

Review:

- [Engineering Standards Index](docs/standards/README.md)

## Module Registry

The draft operational registry is located at:

- [Module Registry](registry/module-registry.json)
- [Module Registry Operating Guide](registry/README.md)

The registry tracks:

- Module name and stable key
- Architecture layer
- Version and lifecycle status
- Ownership
- Dependencies
- Permissions
- Exposed and consumed events
- Configuration
- Database ownership
- Tenant scope
- Documentation paths
- Compatibility notes

A registry entry does not prove implementation, testing, security, or approval.

## Module Lifecycle

Modules follow this lifecycle:

```text
planned -> draft -> active -> deprecated -> replaced or archived
```

Only `active` modules may be treated as approved for controlled reuse.

Activation requires:

- Complete module structure
- Complete documentation
- `VERSION`
- `CHANGELOG.md`
- Declared dependencies
- Permission review
- Tenant-isolation review where applicable
- Database ownership review
- API and event review
- Required tests
- Security review
- Product and Engineering approval
- Updated Module Registry metadata

Review:

- [Module Approval Checklist](docs/standards/module-approval-checklist.md)
- [Module Approval Example](templates/approval/module-approval-checklist.example.md)

## Standard Module Structure

A reusable module follows this structure:

```text
module-name/
|-- api/
|-- components/
|-- config/
|-- database/
|-- docs/
|-- events/
|-- pages/
|-- permissions/
|-- services/
|-- stores/
|-- tests/
|-- types/
|-- CHANGELOG.md
|-- README.md
`-- VERSION
```

Folders may be intentionally unused, but the module must document why before approval.

The reusable starting point is located at:

- [Module Template](templates/module-template/README.md)

## Client Customization

Client-specific behavior should use this order of preference:

1. Configuration
2. Approved events and listeners
3. Public module APIs or services
4. Adapters
5. Explicit client extensions

Client customization must not be hidden inside reusable core modules.

Every client deployment should record:

- Installed packages
- Installed modules and exact versions
- Environment
- Database model
- Configuration
- Client extensions
- Support plan
- Update policy

## Contribution Rules

All repository changes should follow these working rules:

- Use feature-based commits, not file-based commits.
- Keep unrelated changes out of the same commit.
- Review applicable ADRs and standards before implementation.
- Update documentation with behavior changes.
- Update tests with behavior changes.
- Update `VERSION` and `CHANGELOG.md` when required.
- Declare all module dependencies.
- Preserve tenant and permission boundaries.
- Keep client-specific behavior separate.
- Update registry or deployment records when applicable.
- Do not commit secrets or real client data.

## Product and Engineering Ownership

### Product owns

- Customer and operational problems
- Business outcomes
- Feature scope and priorities
- User workflows
- Business and compliance policies
- Acceptance criteria

### Engineering owns

- Architecture and technical design
- Module and data ownership
- APIs, services, contracts, and events
- Security, testing, reliability, and maintainability
- Implementation approach
- Technical compatibility and migration planning

### Shared ownership

- Translating business requirements into durable system capabilities
- Assessing delivery and operational risk
- Approving module boundaries
- Reviewing cross-module impact
- Determining release readiness

## Current Gaps

Before production implementation can begin responsibly, the repository still requires:

- Technology stack decision
- Build and dependency tooling decision
- Database and migration tooling decision
- Authentication implementation decision
- API framework decision
- Event implementation decision
- File-storage strategy
- Observability strategy
- Backup and recovery implementation plan
- Deployment and CI/CD design
- Automated Module Registry validation
- Complete documentation for the first modules selected for implementation

The next major architecture step should be the technology stack decision, not another broad governance document. At some point infrastructure must become executable rather than achieving ever more impressive Markdown density.

## Long-Term Objective

NEWAX Core should become the dependable internal foundation from which NEWAX designs, builds, connects, deploys, and supports business-critical systems.

It should help NEWAX:

- Simplify operational complexity
- Connect systems
- Eliminate manual work
- Improve visibility
- Strengthen operations
- Increase long-term control
- Build with confidence

The repository succeeds when NEWAX can build different client systems without rebuilding the same foundations, compromising ownership, or creating infrastructure that only its original author understands.