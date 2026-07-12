import { describe, expect, it } from 'vitest';

import { validateHttpSecurityEnvironment } from './http-security-environment';

const productionSecret = 'production-http-csrf-secret-with-more-than-thirty-two-characters';
const productionBase = {
  HTTP_ALLOWED_ORIGINS: 'https://app.newax.test',
  HTTP_CSRF_SECRET: productionSecret,
  HTTP_TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
};

describe('validateHttpSecurityEnvironment', () => {
  it('uses safe development defaults without trusting forwarded headers', () => {
    expect(validateHttpSecurityEnvironment({}, 'development')).toMatchObject({
      HTTP_ALLOWED_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
      HTTP_REQUIRE_HTTPS: false,
      HTTP_TRUSTED_PROXY_CIDRS: [],
      HTTP_BODY_LIMIT_BYTES: 1_048_576,
      HTTP_RATE_LIMIT_WINDOW_MILLISECONDS: 60_000,
      HTTP_RATE_LIMIT_MAXIMUM_REQUESTS: 120,
      HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS: 10,
      HTTP_HSTS_MAX_AGE_SECONDS: 63_072_000,
      HTTP_HSTS_INCLUDE_SUBDOMAINS: false,
      HTTP_HSTS_PRELOAD: false,
    });
  });

  it('requires HTTPS in production', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        { ...productionBase, HTTP_REQUIRE_HTTPS: false },
        'production',
      ),
    ).toThrow('HTTP_REQUIRE_HTTPS must be true in production.');
  });

  it('requires an explicit production TLS proxy network', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_ALLOWED_ORIGINS: productionBase.HTTP_ALLOWED_ORIGINS,
          HTTP_CSRF_SECRET: productionSecret,
        },
        'production',
      ),
    ).toThrow('HTTP_TRUSTED_PROXY_CIDRS must identify the production TLS proxy network.');
  });

  it('keeps HSTS subdomain coverage opt-in in production', () => {
    expect(
      validateHttpSecurityEnvironment(productionBase, 'production'),
    ).toMatchObject({
      HTTP_REQUIRE_HTTPS: true,
      HTTP_HSTS_INCLUDE_SUBDOMAINS: false,
      HTTP_HSTS_PRELOAD: false,
    });
  });

  it('requires explicit HTTPS origins and a CSRF secret in production', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_ALLOWED_ORIGINS: 'http://app.newax.test',
          HTTP_CSRF_SECRET: productionSecret,
          HTTP_TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
        },
        'production',
      ),
    ).toThrow('HTTP_ALLOWED_ORIGINS must use HTTPS in production.');

    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_ALLOWED_ORIGINS: 'https://app.newax.test',
          HTTP_TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
        },
        'production',
      ),
    ).toThrow('HTTP_CSRF_SECRET is required in production.');
  });

  it('normalizes exact production origins and trusted proxy networks', () => {
    expect(
      validateHttpSecurityEnvironment(
        {
          HTTP_ALLOWED_ORIGINS: ' https://app.newax.test,https://admin.newax.test ',
          HTTP_CSRF_SECRET: productionSecret,
          HTTP_TRUSTED_PROXY_CIDRS: ' 10.0.0.0/8,192.0.2.10 ',
          HTTP_HSTS_PRELOAD: 'true',
          HTTP_HSTS_INCLUDE_SUBDOMAINS: 'true',
        },
        'production',
      ),
    ).toMatchObject({
      HTTP_ALLOWED_ORIGINS: ['https://app.newax.test', 'https://admin.newax.test'],
      HTTP_CSRF_SECRET: productionSecret,
      HTTP_REQUIRE_HTTPS: true,
      HTTP_TRUSTED_PROXY_CIDRS: ['10.0.0.0/8', '192.0.2.10'],
      HTTP_HSTS_PRELOAD: true,
      HTTP_HSTS_INCLUDE_SUBDOMAINS: true,
    });
  });

  it('rejects origins with paths, credentials, or wildcards', () => {
    for (const origin of [
      'https://app.newax.test/path',
      'https://user:pass@app.newax.test',
      'https://*.newax.test',
    ]) {
      expect(() =>
        validateHttpSecurityEnvironment({ HTTP_ALLOWED_ORIGINS: origin }, 'test'),
      ).toThrow(/Invalid HTTP origin/);
    }
  });

  it('rejects malformed and internet-wide trusted proxy networks', () => {
    for (const network of ['proxy.internal', '10.0.0.0/33', '10.0.0.0/8/1']) {
      expect(() =>
        validateHttpSecurityEnvironment({ HTTP_TRUSTED_PROXY_CIDRS: network }, 'test'),
      ).toThrow(/Invalid trusted proxy network/);
    }

    expect(() =>
      validateHttpSecurityEnvironment(
        {
          ...productionBase,
          HTTP_TRUSTED_PROXY_CIDRS: '0.0.0.0/0',
        },
        'production',
      ),
    ).toThrow('HTTP_TRUSTED_PROXY_CIDRS must not trust the entire internet in production.');
  });

  it('requires preload to include subdomains and at least one year of HSTS', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_HSTS_PRELOAD: true,
          HTTP_HSTS_INCLUDE_SUBDOMAINS: false,
        },
        'test',
      ),
    ).toThrow('HTTP_HSTS_PRELOAD requires HTTP_HSTS_INCLUDE_SUBDOMAINS=true.');

    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_HSTS_PRELOAD: true,
          HTTP_HSTS_INCLUDE_SUBDOMAINS: true,
          HTTP_HSTS_MAX_AGE_SECONDS: 300,
        },
        'test',
      ),
    ).toThrow('HTTP_HSTS_PRELOAD requires HTTP_HSTS_MAX_AGE_SECONDS of at least 31536000.');
  });
});
