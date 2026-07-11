# NEWAX Package Standard

## Purpose

Define how NEWAX will group reusable modules into packages that can be sold, deployed, upgraded, and supported as coherent client solutions.

This standard is for internal NEWAX engineering use. It aligns with ADR 0006: Use Controlled Updates and Versioning, ADR 0007: Define LMS Centralized Database and Data Ownership Rules, ADR 0009: Define Module Registry and Dependency Rules, and the NEWAX Client Deployment Manifest Standard.

This document defines a standard and example template only. It does not create production module code, actual package implementations, database migrations, or deployment automation.

## 1. What A NEWAX Package Is

A NEWAX package is a curated group of reusable modules that together form a deployable business capability, product edition, or client solution.

Packages help NEWAX turn reusable engineering modules into clear offerings that can be sold, deployed, upgraded, and supported consistently.

Examples:

- LMS Foundation Package.
- LMS Growth Package.
- LMS Enterprise Package.
- CRM Foundation Package.
- Legal Operations Package.
- Clinic Operations Package.
- Finance Operations Package.

A package should make the scope of a client solution clear. It should define which modules are included, which modules are optional, which modules are excluded, what dependencies are required, which deployment models are compatible, and what support expectations apply.

A package does not replace module ownership. Each module remains responsible for its own documentation, versioning, permissions, events, database ownership, testing, and changelog.

## 2. What A NEWAX Package Is Not

A NEWAX package is not:

- A random folder of modules.
- A public marketplace bundle.
- A client-specific customization.
- A replacement for module documentation.
- A replacement for the Module Registry.
- A replacement for a Client Deployment Manifest.
- A reason to install unnecessary modules.
- A shortcut around security review, compatibility review, or controlled updates.
- A place to hide client-specific behavior inside reusable core modules.

A package is a controlled composition of modules. It must not blur module boundaries or hide what is installed for a client.

## 3. Why NEWAX Needs Packages

NEWAX Core is designed to support reusable modules across multiple business domains. Packages give NEWAX a practical way to group those modules into understandable offerings.

Packages help NEWAX:

- Sell clear product editions.
- Deploy coherent client solutions.
- Avoid custom one-off bundles for every client.
- Track which modules belong together.
- Define upgrade expectations at the package level.
- Support compatibility checks before client updates.
- Prepare support teams for what a client system includes.
- Keep client deployment manifests easier to understand.
- Prevent unnecessary modules from being installed by default.

Packages create a bridge between product packaging and engineering architecture while preserving module-level ownership.

## 4. Package Types

NEWAX may define different package types as the platform grows.

Common package types include:

- Foundation packages: Baseline packages for a business domain or product edition.
- Growth packages: Expanded packages with additional operational capabilities.
- Enterprise packages: Advanced packages for larger clients with stronger support, reporting, integration, or deployment needs.
- Domain operations packages: Packages focused on a specific business vertical such as Legal, Clinic, Finance, CRM, or LMS.
- Platform add-on packages: Packages that add shared platform services such as notifications, documents, workflow, dashboard, or integrations.
- Client solution packages: Packages composed for a named solution edition.

Package types must be documented clearly. A package type should help Product, Engineering, Sales, Support, and Operations understand what the package is meant to provide.

## 5. Required Package Metadata

Every package should include:

| Field                        | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `package_name`               | Human-readable package name.                                     |
| `package_key`                | Stable machine-friendly package identifier.                      |
| `package_version`            | Current package version.                                         |
| `package_status`             | Package lifecycle status.                                        |
| `package_layer`              | Package classification or layer.                                 |
| `description`                | Short explanation of the package purpose.                        |
| `included_modules`           | Modules included by default.                                     |
| `required_dependencies`      | Required packages, modules, standards, or platform capabilities. |
| `optional_modules`           | Modules approved as optional additions.                          |
| `excluded_modules`           | Modules not included in the package.                             |
| `compatible_database_models` | Supported database deployment models.                            |
| `compatible_client_types`    | Client types or deployment contexts the package supports.        |
| `support_level`              | Default support expectation for the package.                     |
| `documentation_path`         | Path to package documentation.                                   |
| `changelog_path`             | Path to the package changelog.                                   |
| `approval_status`            | Review or approval state for the package.                        |

Package status values:

```text
planned
draft
active
deprecated
replaced
archived
```

Package metadata must be consistent with the Module Registry and client deployment manifests.

## 6. Package Naming Rules

Package names must be clear, business-facing, and stable.

Rules:

- Use clear business names.
- Use lowercase hyphen-separated package keys.
- Include the domain or solution where helpful, such as `lms`, `crm`, `legal`, `clinic`, or `finance`.
- Include the edition or capability level where helpful, such as `foundation`, `growth`, `enterprise`, or `operations`.
- Avoid vague or internal-only names.
- Avoid client-specific names for reusable packages.

Good:

```text
lms-foundation-package
lms-growth-package
lms-enterprise-package
crm-foundation-package
legal-operations-package
```

Bad:

```text
basic
random-lms
all-modules
client-package
misc
```

Package names should help NEWAX sell and deploy clear editions without needing private explanation.

## 7. Package Versioning Rules

Packages must use semantic versioning.

Format:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
```

Rules:

- Every package must have a version.
- Every package must have a changelog.
- `PATCH` updates fix package-level issues without changing included module behavior.
- `MINOR` updates may add compatible modules or improvements.
- `MAJOR` updates may change package structure, dependencies, included modules, excluded modules, or compatibility.
- Package versions must not hide module versions.
- Client deployment manifests must still list exact installed module versions.
- Package upgrades must respect ADR 0006 controlled updates and versioning.

A package version describes the package composition. It does not replace the version of each installed module.

## 8. Included Modules

Included modules are the modules installed by default when the package is selected.

Rules:

- Every package must list exact included modules.
- Included modules must exist in the Module Registry or be explicitly marked as planned.
- Included modules must define exact module versions when used in a client deployment manifest.
- Included modules must be necessary for the package purpose.
- Packages must not include unnecessary modules by default.
- Included module ownership remains with each module owner.
- Security-sensitive included modules must be clearly identified during deployment planning.

For package documentation, included modules may be listed by module key and expected version range. For client deployment manifests, exact installed module versions are required.

## 9. Required Dependencies

Required dependencies are modules, packages, standards, platform capabilities, or architecture assumptions that must exist for the package to work safely.

Rules:

- Every package must declare required dependencies.
- Required dependencies must be traceable.
- Required module dependencies must align with the Module Registry.
- Dependency direction must respect layer rules.
- Missing dependencies block production deployment.
- Package documentation must explain dependency assumptions clearly.
- Required dependencies must not include client-specific customizations.

Examples:

```text
lms-foundation-package requires:
- central identity and organization registry
- permission-based access control
- controlled updates and versioning
- client deployment manifest tracking
```

Dependencies make package deployment predictable and supportable.

## 10. Optional Modules

Optional modules are approved additions that can extend a package for a client or edition without changing the package foundation.

Rules:

- Optional modules must be declared clearly.
- Optional modules must not be installed silently.
- Optional modules must declare their dependencies.
- Optional modules must be listed in the client deployment manifest when installed.
- Optional modules may affect pricing, support, security review, or update planning.
- Optional modules must not create hidden dependencies for core package modules.

Example optional modules for LMS Foundation Package:

```text
notifications
documents
files
dashboard
workflow
```

Optional modules help NEWAX extend packages without turning every foundation package into an overloaded bundle.

## 11. Excluded Modules

Excluded modules are modules or capabilities that are intentionally not part of the package.

Rules:

- Every package should define important excluded modules or capabilities.
- Exclusions must be clear to Product, Sales, Engineering, Support, and Operations.
- Excluded modules must not be assumed available in client systems.
- Excluded modules require separate approval, pricing, support, and manifest tracking when added.
- Exclusions should prevent scope confusion during sales, delivery, and support.

Example excluded modules for LMS Foundation Package:

```text
ai-analytics
whatsapp-integration
payment-gateway
parent-portal
mobile-app
advanced-attendance
certificates
```

Exclusions protect deployment clarity and prevent accidental overcommitment.

## 12. Package Compatibility Rules

Packages must define compatibility requirements.

Rules:

- Compatible database models must be declared.
- Compatible client types must be declared.
- Required module versions or version ranges must be documented.
- Package compatibility must align with module compatibility notes.
- Package compatibility must be checked before production upgrades.
- Client extensions must be reviewed before package upgrades.
- Database model and tenant scope must be considered before deployment or upgrade.

Compatible database model values may include:

```text
centralized_shared_database
dedicated_client_database
hybrid_database
on_premise
private_enterprise_deployment
```

Compatibility rules help NEWAX avoid selling or deploying a package into an environment it does not safely support.

## 13. Package Upgrade Rules

Package upgrades must be controlled.

Rules:

- Package upgrades must respect ADR 0006 controlled updates and versioning.
- Production package upgrades require review before installation.
- Major package upgrades require compatibility review and migration planning.
- Security updates may be prioritized but still require controlled deployment.
- Package upgrades must not overwrite client-specific extensions.
- Package upgrades must update the client deployment manifest.
- Rollback planning should be considered for production upgrades.
- Changelog entries must explain package-level changes.

A package upgrade may include module upgrades, optional module additions, dependency changes, or compatibility changes. Each must be visible.

## 14. Package Support Rules

Packages must define support expectations.

Rules:

- Every package must define a default support level.
- Support expectations must align with client support plans.
- Security-sensitive packages may require stronger support review.
- Enterprise packages may require stricter upgrade planning, monitoring, reporting, or deployment controls.
- Support teams must be able to identify installed package and module versions through the client deployment manifest.
- Unsupported customizations must not be presented as supported package capabilities.

Support readiness depends on package clarity, module visibility, and accurate deployment manifests.

## 15. Client Customization Rules

Client-specific customizations must not be hidden inside packages.

Rules:

- Client-specific customizations must live outside reusable core modules.
- Client-specific customizations must be documented as client extensions.
- Client extensions must be listed in the client deployment manifest.
- Packages must not include client-specific code by default.
- Packages may define approved extension points, configuration options, and event-based customization paths.
- Core package changes should only be made when the improvement benefits the reusable NEWAX platform.
- Client-specific behavior must not block package upgrades.

Customization priority:

```text
1. Use configuration first.
2. Use events second.
3. Use extension modules third.
4. Modify reusable core modules only when the requirement should become part of the platform.
```

This protects package reusability and long-term maintainability.

## 16. Package Documentation Requirements

Every package must have practical documentation.

Package documentation should include:

- Package purpose.
- Package type.
- Package metadata.
- Included modules.
- Required dependencies.
- Optional modules.
- Excluded modules.
- Compatible database models.
- Compatible client types.
- Support expectations.
- Upgrade guidance.
- Client customization guidance.
- Changelog path.
- Approval status.

Rules:

- Package documentation must not replace module documentation.
- Package documentation must link to module documentation where practical.
- Package changelogs must record package-level changes.
- Package documentation must be updated when package composition changes.
- Package documentation must be clear enough for Product, Engineering, Sales, Support, and Operations.

Documentation is required before a package can be treated as active.

## 17. Package Approval Checklist

Before a package becomes active, confirm:

- Package purpose is clear.
- Package type is clear.
- Package name and key follow naming rules.
- Package version is defined.
- Package status is assigned.
- Included modules are listed.
- Included modules are necessary for the package purpose.
- Required dependencies are documented.
- Optional modules are documented.
- Excluded modules are documented.
- Compatible database models are documented.
- Compatible client types are documented.
- Support level is defined.
- Documentation path is defined.
- Changelog path is defined.
- Package upgrade rules are understood.
- Client customization rules are documented.
- Security-sensitive modules are identified.
- Package metadata aligns with the Module Registry.
- Client deployment manifest requirements are understood.
- Approval status is recorded.

A package should not become `active` until the relevant checklist items are satisfied.

## 18. What Must Never Happen

The following practices are not allowed:

- Do not create packages as random folders of modules.
- Do not use packages to hide client-specific customizations.
- Do not treat packages as a public marketplace.
- Do not use packages as a replacement for module documentation.
- Do not use packages as a replacement for the Module Registry.
- Do not use packages as a replacement for client deployment manifests.
- Do not install unnecessary modules by default.
- Do not hide module versions behind a package version.
- Do not perform package upgrades without controlled review.
- Do not ignore database model compatibility.
- Do not ignore client extension compatibility.
- Do not sell a package as including excluded capabilities.
- Do not allow packages to weaken module ownership boundaries.
- Do not create production package implementations from this standard alone.

Packages exist to improve ownership, control, deployment clarity, upgrade safety, support readiness, and long-term maintainability.

## Example Package: LMS Foundation Package v1.0.0

This example is illustrative. The structured example template lives at `templates/package/package.example.json`.

Included modules:

```text
- authentication
- people
- organizations
- users
- roles
- permissions
- audit
- reports
- lms-students
- lms-teachers
- lms-courses
- lms-lectures
- lms-tests
- lms-payments
```

Optional modules:

```text
- notifications
- documents
- files
- dashboard
- workflow
```

Excluded modules:

```text
- ai-analytics
- whatsapp-integration
- payment-gateway
- parent-portal
- mobile-app
- advanced-attendance
- certificates
```

The LMS Foundation Package should provide a clear baseline LMS solution while leaving advanced capabilities, integrations, and client-specific behavior outside the foundation package unless explicitly approved and documented.
