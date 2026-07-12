# Changelog

All notable changes to the NEWAX Access Control module are documented here.

## 0.1.0 - 2026-07-11

### Added

- Unified permission, role, role-template, role-permission, membership-role, and evaluation contracts.
- Organization-scoped role administration.
- Global role-template creation and transactional instantiation.
- Permission registration with stable code derivation.
- Allow and deny role-permission effects.
- Membership-role assignment, validity windows, revocation, and listing.
- Effective permission evaluation with deny precedence.
- PostgreSQL and Prisma repository adapter.
- NestJS composition, unit tests, documentation, and ADR 0015.

### Security

- Authorization checks explicit permission codes rather than role names.
- Organization roles and assignments are tenant-isolated.
- Templates cannot be assigned directly to memberships.
- System roles are immutable through organization administration.
- Suspended and ended memberships receive no effective permissions.
- Revoked, expired, archived-role, and archived-permission grants are ignored.
- Public HTTP controllers remain disabled until trusted authentication and membership context exist.

### Architecture

- Consolidates the previously planned Roles and Permissions modules into one Access Control bounded context.
- Removes the unnecessary Users dependency from permission evaluation.
- Uses memberships as the organization-scoped authorization anchor.

### Database

- Uses existing `core_permissions`, `core_roles`, `core_role_permissions`, and `core_membership_roles` tables.
- No domain transaction tables are modified.
