# NEWAX Web

The NEWAX web application is the Next.js presentation layer for reusable NEWAX business infrastructure.

It provides the shared application shell, routing, metadata, visual foundation, and user-facing composition for approved platform and domain capabilities. Business rules belong in their owning packages and APIs rather than inside pages or presentation components.

## Requirements

- Node.js `24.18.0`
- pnpm `11.11.0`

Use the versions pinned in the repository before installing dependencies.

## Install

Run from the repository root:

```bash
pnpm install
```

## Run locally

Start the web application from the repository root:

```bash
pnpm --filter @newax/web dev
```

The default Next.js development server is available at:

```text
http://localhost:3000
```

The API also defaults to port `3000`, so local full-stack development will require an explicit port assignment for one application until shared development orchestration is added.

Example:

```bash
pnpm --filter @newax/web dev -- --port 3001
```

## Commands

Run commands from the repository root with `pnpm --filter @newax/web <command>`.

| Command | Purpose |
| --- | --- |
| `build` | Create the production Next.js build |
| `dev` | Start the development server |
| `start` | Run the production server after a build |
| `lint` | Check web source with ESLint |
| `lint:fix` | Apply safe ESLint fixes |
| `typecheck` | Type-check the application without emitting files |

## Current structure

```text
apps/web/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── next-env.d.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Rendering model

The application uses the Next.js App Router.

Pages and layouts should remain server components unless browser-only state, effects, or event handling require a client boundary. Client components should be introduced deliberately and kept as narrow as practical.

## Visual foundation

`src/app/globals.css` currently provides the initial NEWAX visual system:

- Calm enterprise typography and spacing.
- Responsive layouts for desktop and mobile.
- Shared color, radius, shadow, and content-width tokens.
- Accessible focus, selection, and reduced-motion behavior.
- Presentation aligned with NEWAX as the Business Infrastructure Company.

Future reusable design primitives should move into governed shared packages when repetition justifies the boundary. The global stylesheet should not become a storage room for unrelated client overrides.

## Deployment

`next.config.ts` enables standalone output so the application can be packaged for Docker-compatible and conventional Node.js deployments without requiring the complete monorepo at runtime.

A production deployment must run `pnpm --filter @newax/web build` before `pnpm --filter @newax/web start`.

## Application boundary

The web application may:

- Compose approved user-facing modules.
- Define routes, layouts, metadata, and navigation.
- Render operational workflows and business information.
- Apply shared presentation and accessibility standards.
- Call approved application APIs and adapters.

It should not:

- Reimplement domain rules owned by backend or shared packages.
- Hardcode tenant-specific behavior into reusable core screens.
- Depend directly on unrelated modules merely for convenience.
- expose secrets or private server configuration to browser code.
- Turn NEWAX into a collection of disconnected client websites.

Client-specific presentation should be delivered through governed configuration, themes, extension points, or deployment-level composition. The reusable core must remain reliable, upgradeable, and recognizably NEWAX.
