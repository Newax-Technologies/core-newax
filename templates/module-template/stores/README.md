# Stores

## Purpose

The `stores/` folder is reserved for module-owned state management when implementation begins.

## What Belongs Inside

- Client-side or application state stores owned by the module.
- Store contracts and lifecycle documentation.
- Derived state rules.
- State synchronization notes.

## What Should Never Be Placed Inside

- Persistent database models.
- Business rules that belong in `services/`.
- API handlers.
- Global state unrelated to the module.
- Client-specific state changes that modify reusable core behavior directly.

## Best Practices

- Keep stores small and module-scoped.
- Document state ownership and lifecycle.
- Avoid duplicating server-owned business truth.
- Test important state transitions.
- Keep client customization outside reusable core stores unless approved through extension points.
