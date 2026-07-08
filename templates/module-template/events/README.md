# Events

## Purpose

The `events/` folder defines module events and event contracts.

## What Belongs Inside

- Event names and descriptions.
- Event payload documentation.
- Producer and consumer notes.
- Compatibility and versioning guidance.
- Event testing expectations.

## What Should Never Be Placed Inside

- Hidden cross-module behavior.
- Undocumented payload fields that consumers depend on.
- Business workflows that should be explicit services.
- Client-specific event variants that modify reusable core events directly.

## Best Practices

- Treat events as contracts.
- Name events after meaningful facts, not implementation steps.
- Document payload shape and ownership.
- Keep event consumers resilient to compatible additions.
- Record breaking event changes in `CHANGELOG.md` and update `VERSION`.
