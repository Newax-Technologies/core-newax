# Permissions

## Purpose

The `permissions/` folder defines the module's access rules and permission contracts.

## What Belongs Inside

- Permission names and descriptions.
- Role or policy mapping notes.
- Protected action documentation.
- Authorization test expectations.
- Client extension guidance for access control.

## What Should Never Be Placed Inside

- Undocumented permission checks.
- UI-only access rules without service or API enforcement.
- Client-specific permission edits inside reusable core rules.
- Business logic unrelated to authorization.

## Best Practices

- Treat permissions as a public module contract.
- Enforce permissions consistently in APIs and services.
- Keep permission names stable and descriptive.
- Test protected actions.
- Update `CHANGELOG.md` and `VERSION` when permission behavior changes.
