import { describe, expect, it } from 'vitest';

import { CookieHeaderParser } from '../src/services/cookie-header-parser';
import { HttpRateLimiter } from '../src/services/http-rate-limiter';
import type {
  HttpRateLimitInput,
  HttpRateLimitResult,
  HttpSecurityPolicy,
  HttpSecurityRequest,
} from '../src/types/http-security';
import type {
  HttpRateLimitStore,
  HttpSecurityClock,
  HttpSecurityCrypto,
} from '../src/services/http-security-ports';
import { RequestOriginPolicy } from '../src/services/request-origin-policy';
import { SecureCookieTransport } from '../src/services/secure-cookie-transport';
import { SecurityHeadersPolicy } from '../src/services/security-headers-policy';
import { SensitiveResponseRedactor } from '../src/services/sensitive-response-redactor';
import { SignedCsrfTokenService } from '../src/services/signed-csrf-token.service';

const policy: HttpSecurityPolicy = {
  allowedOrigins: ['https://app.newax.test'],
  requireHttps: true,
  trustedProxyCidrs: ['10.0.0.0/8'],
  bodyLimitBytes: 1_048_576,
  rateLimitWindowMilliseconds: 60_000,
  rateLimitMaximumRequests: 120,
  authenticationRateLimitMaximumRequests: 10,
  hstsMaxAgeSeconds: 63_072_000,
  hstsIncludeSubDomains: true,
  hstsPreload: false,
};

class FakeCrypto implements HttpSecurityCrypto {
  issueRandomValue(_bytes: number): string {
    return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  }

  sign(domain: string, value: string): string {
    const source = `${domain}:${value}`;
    let checksum = 0;
    for (const character of source) {
      checksum = (checksum + (character.codePointAt(0) ?? 0)) % 16;
    }
    return checksum.toString(16).repeat(64);
  }

  equals(left: string, right: string): boolean {
    return left === right;
  }
}

class FixedClock implements HttpSecurityClock {
  now(): Date {
    return new Date('2026-07-12T00:00:00.000Z');
  }
}

class RecordingRateLimitStore implements HttpRateLimitStore {
  readonly inputs: HttpRateLimitInput[] = [];
  result: HttpRateLimitResult = {
    allowed: true,
    remaining: 9,
    retryAfterSeconds: 60,
    resetAt: new Date('2026-07-12T00:01:00.000Z'),
  };

  async consume(input: HttpRateLimitInput): Promise<HttpRateLimitResult> {
    this.inputs.push(input);
    return this.result;
  }
}

function request(
  overrides: Partial<HttpSecurityRequest> = {},
): HttpSecurityRequest {
  return {
    method: 'POST',
    routeKey: 'POST /api/people',
    requestId: 'request-1',
    origin: 'https://app.newax.test',
    referer: null,
    fetchSite: 'same-site',
    contentType: 'application/json; charset=utf-8',
    hasBody: true,
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    ...overrides,
  };
}

describe('CookieHeaderParser', () => {
  it('extracts only the security cookies and permits empty unrelated cookies', () => {
    const parser = new CookieHeaderParser();
    expect(
      parser.parse(
        'theme=; __Host-newax_session=session-token; __Host-newax_csrf=csrf-token',
      ),
    ).toEqual({ sessionToken: 'session-token', csrfToken: 'csrf-token' });
  });

  it('rejects duplicate and malformed security cookies', () => {
    const parser = new CookieHeaderParser();
    expect(() =>
      parser.parse(
        '__Host-newax_session=first; __Host-newax_session=second',
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_COOKIE_HEADER' }),
    );
    expect(() => parser.parse('__Host-newax_session="quoted"')).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_COOKIE_HEADER' }),
    );
  });
});

describe('RequestOriginPolicy', () => {
  it('allows safe requests without origin metadata', () => {
    const originPolicy = new RequestOriginPolicy(policy.allowedOrigins);
    expect(() =>
      originPolicy.validate(
        request({
          method: 'GET',
          origin: null,
          fetchSite: null,
          contentType: null,
          hasBody: false,
        }),
      ),
    ).not.toThrow();
  });

  it('requires an exact allowed origin for state-changing requests', () => {
    const originPolicy = new RequestOriginPolicy(policy.allowedOrigins);
    expect(() =>
      originPolicy.validate(request({ origin: 'https://evil.example' })),
    ).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_ORIGIN_REJECTED' }),
    );
  });

  it('requires JSON for state-changing request bodies', () => {
    const originPolicy = new RequestOriginPolicy(policy.allowedOrigins);
    expect(() =>
      originPolicy.validate(
        request({ contentType: 'application/x-www-form-urlencoded' }),
      ),
    ).toThrowError(expect.objectContaining({ statusCode: 415 }));
    expect(() =>
      originPolicy.validate(
        request({ method: 'DELETE', contentType: null, hasBody: false }),
      ),
    ).not.toThrow();
  });
});

describe('SignedCsrfTokenService', () => {
  const firstSessionId = '00000000-0000-4000-8000-000000000001';
  const secondSessionId = '00000000-0000-4000-8000-000000000002';

  it('issues and verifies a session-bound signed token', () => {
    const service = new SignedCsrfTokenService(new FakeCrypto());
    const issued = service.issue(firstSessionId);
    expect(() =>
      service.verify({
        sessionId: firstSessionId,
        cookieToken: issued.cookieValue,
        headerToken: issued.token,
      }),
    ).not.toThrow();
  });

  it('rejects a valid token replayed against another session', () => {
    const service = new SignedCsrfTokenService(new FakeCrypto());
    const issued = service.issue(firstSessionId);
    expect(() =>
      service.verify({
        sessionId: secondSessionId,
        cookieToken: issued.cookieValue,
        headerToken: issued.token,
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_CSRF_REJECTED' }),
    );
  });
});

describe('SecureCookieTransport', () => {
  it('creates a host-only secure HttpOnly session cookie', () => {
    const cookie = new SecureCookieTransport().sessionCookie(
      'session-token',
      3_600,
    );
    expect(cookie).toContain('__Host-newax_session=session-token');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Domain=');
  });

  it('keeps the CSRF cookie readable and expires cleared cookies', () => {
    const transport = new SecureCookieTransport();
    expect(transport.csrfCookie('csrf-token', 3_600)).toContain(
      'SameSite=Strict',
    );
    expect(transport.csrfCookie('csrf-token', 3_600)).not.toContain(
      'HttpOnly',
    );
    expect(transport.clearSessionCookie()).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
  });
});

describe('SecurityHeadersPolicy', () => {
  it('adds strict API headers and HSTS only for secure requests', () => {
    const headersPolicy = new SecurityHeadersPolicy(policy);
    expect(
      headersPolicy.headers(false)['Strict-Transport-Security'],
    ).toBeUndefined();
    expect(headersPolicy.headers(true)['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(headersPolicy.headers(true)['Referrer-Policy']).toBe('no-referrer');
    expect(headersPolicy.headers(true)['X-Content-Type-Options']).toBe(
      'nosniff',
    );
  });
});

describe('SensitiveResponseRedactor', () => {
  it('removes nested credentials and normalized sensitive key variants', () => {
    const redactor = new SensitiveResponseRedactor();
    expect(
      redactor.redact({
        userId: 'user-1',
        session_token: 'secret',
        csrfToken: 'readable-csrf-token',
        nested: {
          currentPassword: 'secret',
          client_secret: 'secret',
          status: 'ok',
        },
      }),
    ).toEqual({
      userId: 'user-1',
      csrfToken: 'readable-csrf-token',
      nested: { status: 'ok' },
    });
  });
});

describe('HttpRateLimiter', () => {
  it('uses the authentication-sensitive limit when requested', async () => {
    const store = new RecordingRateLimitStore();
    const limiter = new HttpRateLimiter(store, new FixedClock(), policy);

    await limiter.consume('127.0.0.1|login', true);

    expect(store.inputs[0]).toMatchObject({
      key: '127.0.0.1|login',
      limit: 10,
      windowMilliseconds: 60_000,
    });
  });

  it('throws a generic rate-limit error when the store denies a request', async () => {
    const store = new RecordingRateLimitStore();
    store.result = {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 30,
      resetAt: new Date('2026-07-12T00:00:30.000Z'),
    };
    const limiter = new HttpRateLimiter(store, new FixedClock(), policy);

    await expect(limiter.consume('127.0.0.1|people')).rejects.toMatchObject({
      code: 'HTTP_SECURITY_RATE_LIMITED',
      statusCode: 429,
    });
  });
});
