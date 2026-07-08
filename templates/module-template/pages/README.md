# Pages

## Purpose

The `pages/` folder is reserved for module-owned page-level views or route-level UI when implementation begins.

## What Belongs Inside

- Module page definitions.
- Page composition using module components.
- Page-level access requirements.
- Page documentation for routing and user workflows.

## What Should Never Be Placed Inside

- Core business logic.
- Database access logic.
- Shared reusable components that belong in `components/`.
- Global application shell code.
- Client-specific page overrides that modify reusable core pages directly.

## Best Practices

- Keep pages thin and composed from services, stores, and components.
- Document required permissions for protected pages.
- Keep workflow-specific logic outside page files when it belongs in services.
- Support client variation through approved extension points.
- Test critical page behavior when it affects module reuse.
