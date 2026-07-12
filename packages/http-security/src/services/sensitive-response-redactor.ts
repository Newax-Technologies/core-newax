const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'accesstoken',
  'apikey',
  'authorization',
  'authtokenpepper',
  'clientsecret',
  'cookie',
  'credentialhash',
  'csrfsecret',
  'currentpassword',
  'mfasecret',
  'newpassword',
  'otpsecret',
  'password',
  'passwordhash',
  'privatekey',
  'recoverycodes',
  'refreshtoken',
  'secrethash',
  'sessiontoken',
  'sessiontokenhash',
  'setcookie',
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
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      return null;
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (ArrayBuffer.isView(value)) {
      return null;
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
      if (SENSITIVE_KEYS.has(this.normalizeKey(key))) {
        continue;
      }
      redacted[key] = this.redactValue(nestedValue, seen);
    }
    seen.delete(value);
    return redacted;
  }

  private normalizeKey(key: string): string {
    return key.replace(/[^a-z0-9]/giu, '').toLowerCase();
  }
}
