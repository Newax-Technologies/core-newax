# API

## Purpose

The `api/` folder defines the module's public application-facing or module-facing API surface.

## What Belongs Inside

- Route handlers or endpoint definitions when implementation begins.
- Request and response contract documentation.
- API validation rules.
- API permission requirements.
- API integration notes for other modules.

## What Should Never Be Placed Inside

- Core business rules that belong in `services/`.
- Database access logic that belongs in `database/` or an approved data access layer.
- UI components or page code.
- Client-specific forks of reusable API behavior.
- Secrets or environment-specific values.

## Best Practices

- Keep API contracts explicit and documented.
- Route protected actions through permission checks.
- Delegate business orchestration to services.
- Avoid leaking internal storage details through API responses.
- Document breaking API changes in `CHANGELOG.md` and update `VERSION`.
