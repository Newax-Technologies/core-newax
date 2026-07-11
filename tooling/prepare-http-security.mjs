import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

const schemaPath = 'apps/api/prisma/schema.prisma';
let schema = readFileSync(schemaPath, 'utf8');

if (!schema.includes('model CoreHttpRateLimitBucket')) {
  const marker = 'model CoreAuditLog {';
  if (!schema.includes(marker)) {
    throw new Error('CoreAuditLog schema marker was not found.');
  }
  const model = `model CoreHttpRateLimitBucket {
  keyHash      String   @id @map("key_hash") @db.Char(64)
  requestCount Int      @default(0) @map("request_count")
  resetAt      DateTime @map("reset_at") @db.Timestamptz(6)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([resetAt])
  @@map("core_http_rate_limit_buckets")
}

`;
  schema = schema.replace(marker, `${model}${marker}`);
  writeFileSync(schemaPath, schema);
}

const migrationDirectory =
  'apps/api/prisma/migrations/20260712210000_add_http_security_rate_limits';
const migrationPath = `${migrationDirectory}/migration.sql`;
if (!existsSync(migrationPath)) {
  mkdirSync(migrationDirectory, { recursive: true });
  writeFileSync(
    migrationPath,
    `-- CreateTable
CREATE TABLE "core_http_rate_limit_buckets" (
    "key_hash" CHAR(64) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_http_rate_limit_buckets_pkey" PRIMARY KEY ("key_hash")
);

-- CreateIndex
CREATE INDEX "core_http_rate_limit_buckets_reset_at_idx" ON "core_http_rate_limit_buckets"("reset_at");
`,
  );
}

const registryPath = 'registry/module-registry.json';
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
registry.registry_version = '0.1.8';
registry.last_updated = '2026-07-12';

const httpSecurity = {
  module_name: 'HTTP Security Boundary',
  module_key: 'http-security',
  module_layer: 'platform_service',
  module_version: '0.1.0',
  module_status: 'draft',
  module_owner: 'NEWAX Engineering',
  description:
    'Protects HTTPS entry through proxy trust, request framing, origin and CSRF controls, distributed throttling, trusted context enforcement, response controls, and security auditing.',
  dependencies: [
    { module_key: 'request-context', version: '>=0.1.0' },
  ],
  required_permissions: [],
  exposed_events: [],
  consumed_events: [],
  configuration_options: [
    'allowed_origins',
    'csrf_secret',
    'https_requirement',
    'trusted_proxy_cidrs',
    'body_limit_bytes',
    'rate_limit_policy',
    'hsts_policy',
  ],
  database_ownership: ['core_http_rate_limit_buckets'],
  tenant_scope: 'public_account_and_organization_http_boundary',
  documentation_path: 'packages/http-security/README.md',
  changelog_path: 'packages/http-security/CHANGELOG.md',
  compatibility_notes:
    'Production clients use HTTPS. Foundation modules remain transport-independent, and client-supplied identity, tenant, role, and permission values are never accepted as authority.',
};

const existingModuleIndex = registry.modules.findIndex(
  (moduleDefinition) => moduleDefinition.module_key === 'http-security',
);
if (existingModuleIndex >= 0) {
  registry.modules[existingModuleIndex] = httpSecurity;
} else {
  const requestContextIndex = registry.modules.findIndex(
    (moduleDefinition) => moduleDefinition.module_key === 'request-context',
  );
  if (requestContextIndex < 0) {
    throw new Error('Trusted Request Context registry entry was not found.');
  }
  registry.modules.splice(requestContextIndex + 1, 0, httpSecurity);
}
writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const indexPath = 'docs/decisions/README.md';
let index = readFileSync(indexPath, 'utf8');
if (!index.includes('0019-build-http-security-boundary.md')) {
  const lines = index.split('\n');
  const adr18Index = lines.findIndex((line) =>
    line.includes('0018-build-trusted-request-context-foundation.md'),
  );
  if (adr18Index < 0) {
    throw new Error('ADR 0018 index row was not found.');
  }
  lines.splice(
    adr18Index + 1,
    0,
    '| [ADR 0019](0019-build-http-security-boundary.md)                        | Accepted | Establish secure HTTPS entry, browser protections, distributed throttling, trusted context enforcement, response controls, and HTTP auditing.   |',
  );
  index = lines.join('\n');
}
index = index.replace(
  'rather than eighteen independent opinions',
  'rather than nineteen independent opinions',
);
if (!index.includes('ADR 0019 establishes secure HTTPS entry')) {
  index = index.replace(
    '- ADR 0018 defines trusted account and organization execution context without accepting client-declared authority.',
    '- ADR 0018 defines trusted account and organization execution context without accepting client-declared authority.\n- ADR 0019 establishes secure HTTPS entry, browser request integrity, distributed throttling, permission enforcement, response controls, and HTTP security auditing.',
  );
}
index = index.replace(
  '0019-define-repository-bootstrap-and-boundary-enforcement.md',
  '0020-define-repository-bootstrap-and-boundary-enforcement.md',
);
writeFileSync(indexPath, index);
