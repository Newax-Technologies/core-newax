# Tests

## Purpose

The `tests/` folder contains tests that verify the module's reusable behavior and contracts.

## What Belongs Inside

- API tests.
- Service tests.
- Permission tests.
- Configuration tests.
- Event contract tests.
- Database or migration tests when applicable.
- Client extension behavior tests when applicable.

## What Should Never Be Placed Inside

- Untested fixtures that hide behavior assumptions.
- Production data.
- Tests for unrelated modules.
- Client-specific tests that should live in a client extension area.
- Tests that require undocumented external state.

## Best Practices

- Test public behavior before internal details.
- Cover permission-sensitive paths.
- Verify compatibility for reusable contracts.
- Keep tests readable and close to the module's documented behavior.
- Do not approve a reusable module without meaningful tests or an explicit testing plan.
