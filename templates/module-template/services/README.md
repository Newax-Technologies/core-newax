# Services

## Purpose

The `services/` folder contains module use cases, orchestration, and application-level behavior when implementation begins.

## What Belongs Inside

- Use case services.
- Business workflow orchestration.
- Coordination between validation, permissions, persistence, and events.
- Public service contracts used by APIs or other approved module entry points.

## What Should Never Be Placed Inside

- UI components.
- Page routing.
- Direct edits to another module's owned data.
- Client-specific forks of reusable service behavior.
- Low-level framework code that belongs in infrastructure-specific areas.

## Best Practices

- Keep services focused on meaningful module operations.
- Make dependencies explicit.
- Route cross-module behavior through approved contracts.
- Keep services testable without UI concerns.
- Document service behavior that other modules may rely on.
