import { describe, expect, it } from 'vitest';

import { CookieHeaderParser } from '../src/services/cookie-header-parser';
import { RequestOriginPolicy } from '../src/services/request-origin-policy';
import { SecureCookieTransport } from '../src/services/secure-cookie-transport';
import { SecurityHeadersPolicy } from '../src/services/security-headers-policy';
import { SensitiveResponseRedactor } from '../src/services/sensitive-response-redactor';
import { SignedCsrfTokenService } from '../src/services/signed-csrf-token.service';
import type { HttpSecurityCrypto } from '../src/services/http-security-ports';
import type {
  HttpSecurityPolicy,
  HttpSecurityRequest,
} from '../src/types/http-security';

const policy: HttpSecurityPolicy = {
  allowedOrigins: ['https://app.newax.test'],
  requireHttps: true,
  trustProxyHops: 1,
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
      checksum = (checksum + character.codePointAt(0)!) % 16;
    }
    return checksum.toString(16).repeat(64);
  }

  equals(left: string, right: string): boolean {
    return left === right;
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
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    ...overrides,
  };
}

describe('CookieHeaderParser', () => {
  it('extracts only the security cookies', () => {
    const parser = new CookieHeaderParser();
    expect(
      parser.parse(
        'theme=dark; __Host-newax_session=session-token; __Host-newax_csrf=csrf-token',
      ),
    ).toEqual({ sessionToken: 'session-token', csrfToken: 'csrf-token' });
  });

  it('rejects duplicate security cookies', () => {
    const parser = new CookieHeaderParser();
    expect(() =>
      parser.parse(
        '__Host-newax_session=first; __Host-newax_session=second',
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_COOKIE_HEADER' }),
    );
  });
});

describe('RequestOriginPolicy', () => {
  it('allows safe requests without origin metadata', () => {
    const originPolicy = new RequestOriginPolicy(policy.allowedOrigins);
    expect(() =>
      originPolicy.validate(
        request({ method: 'GET', origin: null, fetchSite: null, contentType: null }),
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

  it('rejects simple cross-site form content types', () => {
    const originPolicy = new RequestOriginPolicy(policy.allowedOrigins);
    expect(() =>
      originPolicy.validate(
        request({ contentType: 'application/x-www-form-urlencoded' }),
      ),
    ).toThrowError(expect.objectContaining({ statusCode: 415 }));
  });
});

describe('SignedCsrfTokenService', () => {
  it('issues and verifies a session-bound signed token', () => {
    const service = new SignedCsrfTokenService(new FakeCrypto());
    const issued = service.issue('session-1');
    expect(() =>
      service.verify({
        sessionId: 'session-1',
        cookieToken: issued.cookieValue,
        headerToken: issued.token,
      }),
    ).not.toThrow();
  });

  it('rejects a valid token replayed against another session', () => {
    const service = new SignedCsrfTokenService(new FakeCrypto());
    const issued = service.issue('session-1');
    expect(() =>
      service.verify({
        sessionId: 'session-2',
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
    const cookie = new SecureCookieTransport().sessionCookie('session-token', 3600);
    expect(cookie).toContain('__Host-newax_session=session-token');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Domain=');
  });

  it('keeps the CSRF cookie readable by the same-origin client', () => {
    const cookie = new SecureCookieTransport().csrfCookie('csrf-token', 3600);
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).not.toContain('HttpOnly');
  });
});

describe('SecurityHeadersPolicy', () => {
  it('adds HSTS only for secure requests', () => {
    const headersPolicy = new SecurityHeadersPolicy(policy);
    expect(headersPolicy.headers(false)['Strict-Transport-Security']).toBeUndefined();
    expect(headersPolicy.headers(true)['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains',
    );
  });
});

describe('SensitiveResponseRedactor', () => {
  it('removes nested credentials and tokens from response bodies', () => {
    const redactor = new SensitiveResponseRedactor();
    expect(
      redactor.redact({
        userId: 'user-1',
        sessionToken: 'secret',
        nested: { password: 'secret', status: 'ok' },
      }),
    ).toEqual({ userId: 'user-1', nested: { status: 'ok' } });
  });
});
