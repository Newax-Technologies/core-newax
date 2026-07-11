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

## Environment setup

Create a local environment file from the committed template:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Do not commit `.env.local` or place secrets in variables exposed to browser code.

The template documents these settings:

| Variable                  | Default   | Purpose                                                     |
| ------------------------- | --------- | ----------------------------------------------------------- |
| `HOSTNAME`                | `0.0.0.0` | Network interface used by the deployed web server           |
| `PORT`                    | `3001`    | Web server port, separated from the API default of `3000`   |
| `SEARCH_INDEXING_ENABLED` | `false`   | Controls whether public search-engine crawling is permitted |

For local development, pass the binding values directly to the Next.js command so they are available when the server starts:

```bash
pnpm --filter @newax/web dev -- --hostname 0.0.0.0 --port 3001
```

## Run locally

Start the web application from the repository root:

```bash
pnpm --filter @newax/web dev -- --hostname 0.0.0.0 --port 3001
```

The application is then available at:

```text
http://localhost:3001
```

The API defaults to port `3000`, so this separation allows both applications to run locally without competing for the same port.

## Search indexing policy

Search indexing is disabled unless `SEARCH_INDEXING_ENABLED` is exactly `true`.

Keep indexing disabled for:

- Local development.
- Automated tests.
- Preview deployments.
- Staging environments.
- Private operational deployments.
- Tenant deployments that have not received explicit publication approval.

Enable indexing only for an approved public production deployment.

Even when indexing is enabled, `robots.ts` continues to disallow administrative, API, application, authentication, dashboard, and internal route families.

Robots rules are crawler instructions, not a security control. Private routes and data must still be protected through authentication, authorization, tenant isolation, and server-side access enforcement.

## Commands

Run commands from the repository root with `pnpm --filter @newax/web <command>`.

| Command     | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `build`     | Create the production Next.js build               |
| `dev`       | Start the development server                      |
| `start`     | Run the production server after a build           |
| `lint`      | Check web source with ESLint                      |
| `lint:fix`  | Apply safe ESLint fixes                           |
| `typecheck` | Type-check the application without emitting files |

## Current structure

```text
apps/web/
├── src/
│   └── app/
│       ├── error.tsx
│       ├── global-error.tsx
│       ├── globals.css
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── not-found.tsx
│       ├── page.tsx
│       └── robots.ts
├── .env.example
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

Deployment configuration must provide an explicit hostname, port, and indexing decision. Search indexing must remain disabled unless the deployment is intentionally public and has passed publication review.

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
- Expose secrets or private server configuration to browser code.
- Turn NEWAX into a collection of disconnected client websites.

Client-specific presentation should be delivered through governed configuration, themes, extension points, or deployment-level composition. The reusable core must remain reliable, upgradeable, and recognizably NEWAX.
