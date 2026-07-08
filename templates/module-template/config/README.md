# Config

## Purpose

The `config/` folder defines module configuration contracts, defaults, and configuration documentation.

## What Belongs Inside

- Configuration schemas or documented option lists.
- Safe defaults.
- Environment-specific configuration guidance.
- Feature flag references.
- Client extension configuration contracts.

## What Should Never Be Placed Inside

- Secrets, credentials, tokens, or private keys.
- Hard-coded client-specific behavior.
- Business logic.
- Runtime data.
- Undocumented flags or hidden behavior switches.

## Best Practices

- Make every configuration option explicit and documented.
- Use safe defaults.
- Keep reusable module defaults client-neutral.
- Test configuration that changes behavior.
- Record behavior-changing configuration updates in `CHANGELOG.md`.
