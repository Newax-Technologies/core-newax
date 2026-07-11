import { describe, expect, it } from 'vitest';

import { validateHttpSecurityEnvironment } from './http-security-environment';

const productionSecret =
  'production-http-csrf-secret-with-more-than-thirty-two-characters';

describe('validateHttpSecurityEnvironment', () => {
  it('uses safe development defaults', () => {
    expect(validateHttpSecurityEnvironment({}, 'development')).toMatchObject({
      HTTP_ALLOWED_ORIGINS: [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      HTTP_REQUIRE_HTTPS: false,
      HTTP_TRUST_PROXY_HOPS: 0,
      HTTP_BODY_LIMIT_BYTES: 1_048_576,
      HTTP_RATE_LIMIT_WINDOW_MILLISECONDS: 60_000,
      HTTP_RATE_LIMIT_MAXIMUM_REQUESTS: 120,
      HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS: 10,
      HTTP_HSTS_MAX_AGE_SECONDS: 63_072_000,
      HTTP_HSTS_INCLUDE_SUBDOMAINS: false,
      HTTP_HSTS_PRELOAD: false,
    });
  });

  it('requires HTTPS origins and an explicit CSRF secret in production', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        { HTTP_ALLOWED_ORIGINS: 'http://app.newax.test' },
        'production',
      ),
    ).toThrow('HTTP_ALLOWED_ORIGINS must use HTTPS in production.');

    expect(() =>
      validateHttpSecurityEnvironment(
        { HTTP_ALLOWED_ORIGINS: 'https://app.newax.test' },
        'production',
      ),
    ).toThrow('HTTP_CSRF_SECRET is required in production.');
  });

  it('normalizes exact production origins and security values', () => {
    expect(
      validateHttpSecurityEnvironment(
        {
          HTTP_ALLOWED_ORIGINS:
            ' https://app.newax.test,https://admin.newax.test ',
          HTTP_CSRF_SECRET: productionSecret,
          HTTP_TRUST_PROXY_HOPS: '1',
          HTTP_HSTS_PRELOAD: 'true',
          HTTP_HSTS_INCLUDE_SUBDOMAINS: 'true',
        },
        'production',
      ),
    ).toMatchObject({
      HTTP_ALLOWED_ORIGINS: [
        'https://app.newax.test',
        'https://admin.newax.test',
      ],
      HTTP_CSRF_SECRET: productionSecret,
      HTTP_REQUIRE_HTTPS: true,
      HTTP_TRUST_PROXY_HOPS: 1,
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
        validateHttpSecurityEnvironment(
          { HTTP_ALLOWED_ORIGINS: origin },
          'test',
        ),
      ).toThrow(/Invalid HTTP origin/);
    }
  });

  it('requires preload to include subdomains', () => {
    expect(() =>
      validateHttpSecurityEnvironment(
        {
          HTTP_HSTS_PRELOAD: true,
          HTTP_HSTS_INCLUDE_SUBDOMAINS: false,
        },
        'test',
      ),
    ).toThrow(
      'HTTP_HSTS_PRELOAD requires HTTP_HSTS_INCLUDE_SUBDOMAINS=true.',
    );
  });
});
