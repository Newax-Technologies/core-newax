import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const schemaPath = 'apps/api/prisma/schema.prisma';
let schema = readFileSync(schemaPath, 'utf8');

if (!schema.includes('authenticationAttempts   CoreAuthenticationAttempt[]')) {
  const userRelations =
    '  credentials              CoreUserCredential[]\n  sessions                 CoreUserSession[]';
  if (!schema.includes(userRelations)) {
    throw new Error('CoreUser credential and session relations were not found.');
  }
  schema = schema.replace(
    userRelations,
    `${userRelations}\n  authenticationAttempts   CoreAuthenticationAttempt[]`,
  );
}

if (!schema.includes('@@unique([userId, credentialType])')) {
  const credentialIndex =
    '  @@index([userId, credentialType, status])\n  @@map("core_user_credentials")';
  if (!schema.includes(credentialIndex)) {
    throw new Error('CoreUserCredential index was not found.');
  }
  schema = schema.replace(
    credentialIndex,
    '  @@unique([userId, credentialType])\n  @@index([userId, credentialType, status])\n  @@map("core_user_credentials")',
  );
}

if (!schema.includes('model CoreAuthenticationAttempt')) {
  const membershipMarker = 'model CoreMembership {';
  if (!schema.includes(membershipMarker)) {
    throw new Error('CoreMembership model marker was not found.');
  }
  const attemptModel = `model CoreAuthenticationAttempt {
  id                  String   @id @default(uuid()) @db.Uuid
  userId              String?  @map("user_id") @db.Uuid
  identityFingerprint String   @map("identity_fingerprint") @db.Char(64)
  outcome             String   @db.VarChar(64)
  ipAddress           String?  @map("ip_address") @db.VarChar(64)
  userAgent           String?  @map("user_agent") @db.Text
  occurredAt          DateTime @default(now()) @map("occurred_at") @db.Timestamptz(6)

  user CoreUser? @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: Cascade)

  @@index([userId, occurredAt])
  @@index([identityFingerprint, occurredAt])
  @@index([outcome, occurredAt])
  @@map("core_authentication_attempts")
}

`;
  schema = schema.replace(membershipMarker, `${attemptModel}${membershipMarker}`);
}
writeFileSync(schemaPath, schema);

const migrationDirectory =
  'apps/api/prisma/migrations/20260711193000_add_authentication_foundation';
const migrationPath = `${migrationDirectory}/migration.sql`;
if (!existsSync(migrationPath)) {
  mkdirSync(migrationDirectory, { recursive: true });
  writeFileSync(
    migrationPath,
    `-- CreateTable
CREATE TABLE "core_authentication_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "identity_fingerprint" CHAR(64) NOT NULL,
    "outcome" VARCHAR(64) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_authentication_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "core_user_credentials_user_id_credential_type_key" ON "core_user_credentials"("user_id", "credential_type");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_user_id_occurred_at_idx" ON "core_authentication_attempts"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_identity_fingerprint_occurred_at_idx" ON "core_authentication_attempts"("identity_fingerprint", "occurred_at");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_outcome_occurred_at_idx" ON "core_authentication_attempts"("outcome", "occurred_at");

-- AddForeignKey
ALTER TABLE "core_authentication_attempts" ADD CONSTRAINT "core_authentication_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
`,
  );
}

const registryPath = 'registry/module-registry.json';
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const auth = registry.modules.find(
  (moduleDefinition) => moduleDefinition.module_key === 'authentication',
);
if (!auth) {
  throw new Error('Authentication registry entry was not found.');
}
registry.registry_version = '0.1.6';
registry.last_updated = '2026-07-11';
auth.module_status = 'draft';
auth.description =
  'Proves login identity, protects password credentials, records failed attempts, and issues revocable account sessions.';
auth.dependencies = [{ module_key: 'users', version: '>=0.1.0' }];
auth.required_permissions = [
  'authentication.sessions.view',
  'authentication.sessions.revoke',
  'authentication.policies.manage',
];
auth.exposed_events = [
  'authentication.password_enrolled',
  'authentication.password_changed',
  'authentication.login_succeeded',
  'authentication.login_failed',
  'authentication.account_locked',
  'authentication.session_created',
  'authentication.session_revoked',
];
auth.consumed_events = [];
auth.configuration_options = [
  'password_length_policy',
  'session_expiration_minutes',
  'failed_attempt_window_minutes',
  'maximum_failed_attempts',
  'account_lock_minutes',
  'session_touch_interval_minutes',
  'token_pepper',
];
auth.database_ownership = [
  'core_user_credentials',
  'core_user_sessions',
  'core_authentication_attempts',
];
auth.tenant_scope = 'global_account_authentication';
auth.documentation_path = 'packages/auth/README.md';
auth.changelog_path = 'packages/auth/CHANGELOG.md';
auth.compatibility_notes =
  'Authentication proves user identity only. Organization access still requires an active membership and evaluated permissions.';
writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const indexPath = 'docs/decisions/README.md';
let index = readFileSync(indexPath, 'utf8');
if (!index.includes('0017-build-authentication-service-foundation.md')) {
  const lines = index.split('\n');
  const adr16Index = lines.findIndex((line) =>
    line.includes('0016-build-users-registry-service-foundation.md'),
  );
  if (adr16Index < 0) {
    throw new Error('ADR 0016 index row was not found.');
  }
  lines.splice(
    adr16Index + 1,
    0,
    '| [ADR 0017](0017-build-authentication-service-foundation.md)            | Accepted | Build credential verification, failed-attempt protection, and revocable sessions without merging Authentication into Users.                    |',
  );
  index = lines.join('\n');
}
index = index.replace(
  'rather than sixteen independent opinions',
  'rather than seventeen independent opinions',
);
if (!index.includes('ADR 0017 defines password verification')) {
  index = index.replace(
    '- ADR 0016 defines global user accounts, organization-scoped creation, and platform-scoped account lifecycle rules.',
    '- ADR 0016 defines global user accounts, organization-scoped creation, and platform-scoped account lifecycle rules.\n- ADR 0017 defines password verification, failed-attempt protection, and secure account sessions.',
  );
}
index = index.replace(
  '0017-define-repository-bootstrap-and-boundary-enforcement.md',
  '0018-define-repository-bootstrap-and-boundary-enforcement.md',
);
writeFileSync(indexPath, index);
