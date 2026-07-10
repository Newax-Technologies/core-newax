# NEWAX API

The NEWAX API is the NestJS application layer for reusable NEWAX business infrastructure.

It is the composition root for approved platform and domain modules. Business rules should remain inside their owning packages rather than accumulating in the application bootstrap.

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

The API reads its network settings from the process environment.

```bash
HOST=0.0.0.0 PORT=3000 pnpm --filter @newax/api dev
```

The default values are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Network interface used by the HTTP server |
| `PORT` | `3000` | HTTP port used by the API |
| `NODE_ENV` | Not assigned by the application | Runtime environment supplied by the deployment |

`apps/api/.env.example` documents the current environment contract. The application does not yet load `.env` files automatically, so copying the example file alone will not configure the process.

## Endpoint

### Health

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "service": "newax-api",
  "timestamp": "2026-07-10T00:00:00.000Z",
  "uptimeSeconds": 123
}
```

Health responses are marked with `Cache-Control: no-store` so operational checks do not receive stale results.

## Commands

Run commands from the repository root with `pnpm --filter @newax/api <command>`.

| Command | Purpose |
| --- | --- |
| `build` | Compile the NestJS application |
| `dev` | Start the API in watch mode |
| `start` | Run the compiled application |
| `start:debug` | Start in debug watch mode |
| `test` | Run the Vitest test suite once |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests and generate coverage reports |
| `typecheck` | Type-check application source and tests |
| `typecheck:src` | Type-check production source only |
| `typecheck:test` | Type-check test source only |

## Current structure

```text
apps/api/
├── src/
│   ├── health/
│   │   ├── health.controller.spec.ts
│   │   └── health.controller.ts
│   ├── app.module.spec.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.spec.json
└── vitest.config.ts
```

## Application boundary

The API application may:

- Bootstrap NestJS.
- Register approved modules.
- Apply transport-level configuration.
- Expose operational endpoints.
- Coordinate application composition.

It should not become the permanent home for domain rules, tenant-specific customizations, or direct dependencies between unrelated modules. Those concerns belong in governed packages, configuration, events, extensions, or adapters.
