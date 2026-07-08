# Components

## Purpose

The `components/` folder is reserved for reusable UI components owned by the module.

## What Belongs Inside

- Module-specific reusable interface components.
- Component-level documentation or usage notes.
- Presentation pieces that are not full pages.
- Components that can be reused by module pages or approved extension layers.

## What Should Never Be Placed Inside

- Page-level routing or workflow orchestration.
- Business logic that belongs in `services/`.
- Persistent state management that belongs in `stores/`.
- Client-specific UI overrides that modify reusable core components directly.
- Global design system components unless the module explicitly owns them.

## Best Practices

- Keep components focused and composable.
- Document required props, permissions, and data expectations.
- Keep client-specific customization outside reusable core components.
- Prefer configuration or wrapper components for client variation.
- Test important component behavior when it affects module reuse.
