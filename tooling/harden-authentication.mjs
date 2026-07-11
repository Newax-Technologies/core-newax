import { readFileSync, writeFileSync } from 'node:fs';

function replaceRequired(path, before, after) {
  const source = readFileSync(path, 'utf8');
  if (source.includes(after)) {
    return;
  }
  if (!source.includes(before)) {
    throw new Error(`Expected authentication preparation text was not found in ${path}.`);
  }
  writeFileSync(path, source.replace(before, after));
}

replaceRequired(
  'apps/api/src/config/environment.ts',
  'const DEFAULT_AUTH_PASSWORD_MINIMUM_LENGTH = 12;',
  'const DEFAULT_AUTH_PASSWORD_MINIMUM_LENGTH = 15;',
);
replaceRequired(
  'apps/api/src/config/environment.spec.ts',
  'AUTH_PASSWORD_MINIMUM_LENGTH: 12,',
  'AUTH_PASSWORD_MINIMUM_LENGTH: 15,',
);
replaceRequired(
  'packages/auth/tests/authentication.service.spec.ts',
  '  passwordMinimumLength: 12,',
  '  passwordMinimumLength: 15,',
);
replaceRequired(
  'packages/auth/tests/authentication.service.spec.ts',
  'class FakeSessionTokenService implements SessionTokenService {',
  `class FakePasswordBlocklist {
  readonly blocked = new Set<string>();

  async contains(password: string): Promise<boolean> {
    return this.blocked.has(password);
  }
}

class FakeSessionTokenService implements SessionTokenService {`,
);
replaceRequired(
  'packages/auth/tests/authentication.service.spec.ts',
  '      new FakePasswordHasher(),\n      new FakeSessionTokenService(),',
  '      new FakePasswordHasher(),\n      new FakePasswordBlocklist(),\n      new FakeSessionTokenService(),',
);
replaceRequired(
  'packages/auth/README.md',
  `Default password policy:

\`\`\`text
Minimum length: 12
Maximum length: 128
Requires: letter, number, symbol
\`\`\``,
  `Default password policy:

\`\`\`text
Minimum length: 15 for single-factor password authentication
Maximum length: 128
Unicode passwords are normalized with NFC
No forced character-type composition rules
Whole-password blocklist comparison is required
\`\`\``,
);
replaceRequired(
  'packages/auth/README.md',
  'Password policy is configurable through validated application environment values.',
  'Password length policy is configurable through validated application environment values. The application adapter enforces a baseline blocklist; a production-scale compromised-password corpus remains required before public password endpoints are enabled.',
);
replaceRequired(
  'packages/auth/README.md',
  '- Scrypt password derivation.',
  '- Scrypt password derivation using an OWASP-aligned minimum work-factor profile.',
);
replaceRequired(
  'packages/auth/CHANGELOG.md',
  '- Scrypt password hashing with unique salts and versioned parameters.',
  '- Scrypt password hashing with unique salts, versioned parameters, and an OWASP-aligned minimum work-factor profile.\n- Fifteen-character single-factor minimum, Unicode NFC normalization, no forced composition rules, and whole-password blocklist checks.',
);
replaceRequired(
  'docs/decisions/0017-build-authentication-service-foundation.md',
  '- A policy-compliant password.',
  '- A policy-compliant password that is not present on the configured whole-password blocklist.',
);
replaceRequired(
  'docs/decisions/0017-build-authentication-service-foundation.md',
  `The Node adapter uses scrypt with:

- A unique cryptographically random salt per credential.
- Versioned encoded parameters.
- Constant-time verification.
- A dummy derivation path for missing identities and credentials.
- Automatic rehashing after successful login when parameters change.`,
  `The Node adapter uses scrypt with:

- A unique cryptographically random salt per credential.
- An OWASP-aligned minimum profile of N=2^15, r=8, and p=3.
- Versioned encoded parameters with bounded parser values.
- Constant-time verification.
- A dummy derivation path for missing identities and credentials.
- Automatic rehashing after successful login when parameters change.`,
);
replaceRequired(
  'docs/decisions/0017-build-authentication-service-foundation.md',
  'Plain-text passwords and password hashes must never appear in logs, events, responses, or audit metadata.',
  'Plain-text passwords and password hashes must never appear in logs, events, responses, or audit metadata. Single-factor passwords require at least 15 Unicode code points, accept spaces and Unicode, use NFC normalization, and must not be subject to forced character-type composition rules. New passwords are compared as complete values against a blocklist of common, expected, or compromised passwords.',
);
replaceRequired(
  'docs/decisions/0017-build-authentication-service-foundation.md',
  '- Password authentication remains only one factor.',
  '- Password authentication remains only one factor.\n- The baseline blocklist must be replaced or supplemented with a production-scale compromised-password corpus before public endpoints are enabled.',
);
