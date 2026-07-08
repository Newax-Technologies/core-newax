# Docs

## Purpose

The `docs/` folder contains module-specific documentation beyond the root README.

## What Belongs Inside

- Architecture notes.
- Integration guides.
- Contract documentation.
- Operational notes.
- Decision records specific to the module.
- Extension and customization guidance.

## What Should Never Be Placed Inside

- Production implementation code.
- Outdated design notes that contradict current module behavior.
- Client-specific instructions that should live in a client extension area.
- Secrets or private operational credentials.

## Best Practices

- Keep documentation close to the module it describes.
- Update documentation with every meaningful contract or behavior change.
- Link to related standards and decisions.
- Write for future engineers who need to reuse or safely modify the module.
- Document limitations and approval status clearly.
