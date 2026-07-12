import { describe, expect, it } from 'vitest';

import { HttpRequestIdFactory, NodeHttpSecurityCrypto } from './node-http-security.infrastructure';

const secret = 'test-http-security-secret-with-more-than-thirty-two-characters';

describe('NodeHttpSecurityCrypto', () => {
  it('issues URL-safe random values with the requested entropy', () => {
    const value = new NodeHttpSecurityCrypto(secret).issueRandomValue(32);

    expect(value).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(value.length).toBeGreaterThanOrEqual(43);
  });

  it('uses domain-separated keyed signatures', () => {
    const crypto = new NodeHttpSecurityCrypto(secret);
    const first = crypto.sign('domain-one', 'value');
    const repeated = crypto.sign('domain-one', 'value');
    const separated = crypto.sign('domain-two', 'value');

    expect(first).toBe(repeated);
    expect(first).toHaveLength(64);
    expect(separated).not.toBe(first);
  });

  it('compares equal and unequal values safely', () => {
    const crypto = new NodeHttpSecurityCrypto(secret);

    expect(crypto.equals('same-value', 'same-value')).toBe(true);
    expect(crypto.equals('same-value', 'different-value')).toBe(false);
    expect(crypto.equals('short', 'a-much-longer-value')).toBe(false);
  });
});

describe('HttpRequestIdFactory', () => {
  it('issues server-controlled UUID request identifiers', () => {
    expect(new HttpRequestIdFactory().issue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });
});
