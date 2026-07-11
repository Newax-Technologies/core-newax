const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'accessToken',
  'authTokenPepper',
  'credentialHash',
  'csrfSecret',
  'csrfToken',
  'currentPassword',
  'newPassword',
  'password',
  'passwordHash',
  'refreshToken',
  'secretHash',
  'sessionToken',
  'sessionTokenHash',
]);

export class SensitiveResponseRedactor {
  redact(value: unknown): unknown {
    return this.redactValue(value, new WeakSet<object>());
  }

  private redactValue(value: unknown, seen: WeakSet<object>): unknown {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return value;
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.redactValue(item, seen));
    }
    if (typeof value !== 'object') {
      return null;
    }
    if (seen.has(value)) {
      return null;
    }
    seen.add(value);

    const redacted: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) {
        continue;
      }
      redacted[key] = this.redactValue(nestedValue, seen);
    }
    seen.delete(value);
    return redacted;
  }
}
