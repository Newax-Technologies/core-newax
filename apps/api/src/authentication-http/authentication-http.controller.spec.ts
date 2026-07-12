import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AuthenticationService,
  type PasswordLoginInput,
  type PasswordLoginResult,
} from '@newax/auth';
import {
  CookieHeaderParser,
  SecureCookieTransport,
  SignedCsrfTokenService,
  type HttpSecurityCrypto,
} from '@newax/http-security';

import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from '../http-security/http-security-request';
import { AuthenticationHttpController } from './authentication-http.controller';

const SESSION_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const PERSON_ID = '00000000-0000-4000-8000-000000000003';
const EXPIRES_AT = new Date('2026-07-12T01:00:00.000Z');

class FakeCrypto implements HttpSecurityCrypto {
  issueRandomValue(_bytes: number): string {
    return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  }

  sign(_domain: string, _value: string): string {
    return 'a'.repeat(64);
  }

  equals(left: string, right: string): boolean {
    return left === right;
  }
}

class FakeAuthenticationService {
  loginInput: PasswordLoginInput | null = null;
  logoutToken: string | null = null;

  async login(input: PasswordLoginInput): Promise<PasswordLoginResult> {
    this.loginInput = input;
    return {
      userId: USER_ID,
      personId: PERSON_ID,
      sessionToken: 'opaque-session-token',
      session: {
        id: SESSION_ID,
        userId: USER_ID,
        status: 'active',
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        expiresAt: EXPIRES_AT,
        lastSeenAt: null,
        revokedAt: null,
        createdAt: new Date('2026-07-12T00:00:00.000Z'),
      },
    };
  }

  async logout(token: string): Promise<void> {
    this.logoutToken = token;
  }
}

class FakeResponse implements HttpSecurityResponseAdapter {
  statusCode = 200;
  readonly headers = new Map<string, string | readonly string[]>();

  setHeader(name: string, value: string | readonly string[]): void {
    this.headers.set(name, value);
  }

  status(code: number): HttpSecurityResponseAdapter {
    this.statusCode = code;
    return this;
  }

  json(_body: unknown): void {}

  end(): void {}
}

function request(
  overrides: Partial<HttpSecurityRequestAdapter> = {},
): HttpSecurityRequestAdapter {
  return {
    method: 'GET',
    ip: '192.0.2.10',
    headers: { 'user-agent': 'vitest-browser' },
    ...overrides,
  };
}

function createController(authentication: FakeAuthenticationService): AuthenticationHttpController {
  return new AuthenticationHttpController(
    authentication as unknown as AuthenticationService,
    new CookieHeaderParser(),
    new SecureCookieTransport(),
    new SignedCsrfTokenService(new FakeCrypto()),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthenticationHttpController', () => {
  it('logs in through secure cookies without returning the raw session token', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-12T00:00:00.000Z').getTime());
    const authentication = new FakeAuthenticationService();
    const controller = createController(authentication);
    const currentRequest = request({ method: 'POST' });
    const response = new FakeResponse();

    const result = await controller.login(
      {
        identityType: 'email',
        identityValue: 'person@example.test',
        password: 'correct horse battery staple',
      },
      currentRequest,
      response,
    );

    expect(authentication.loginInput).toMatchObject({
      identityType: 'email',
      identityValue: 'person@example.test',
      ipAddress: '192.0.2.10',
      userAgent: 'vitest-browser',
    });
    expect(result).toMatchObject({
      userId: USER_ID,
      personId: PERSON_ID,
      session: { id: SESSION_ID, expiresAt: EXPIRES_AT.toISOString() },
    });
    expect(result).not.toHaveProperty('sessionToken');
    expect(result.csrfToken).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u);

    const cookies = response.headers.get('Set-Cookie');
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('__Host-newax_session=opaque-session-token'),
        expect.stringContaining('__Host-newax_csrf='),
      ]),
    );
    expect(currentRequest.newaxAuthenticatedUserId).toBe(USER_ID);
    expect(currentRequest.newaxAuthenticatedSessionId).toBe(SESSION_ID);
  });

  it('returns the trusted account session and refreshes its CSRF token', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-12T00:00:00.000Z').getTime());
    const controller = createController(new FakeAuthenticationService());
    const currentRequest = request({
      trustedContext: {
        scope: 'account',
        requestId: 'request-1',
        userId: USER_ID,
        personId: PERSON_ID,
        sessionId: SESSION_ID,
        sessionExpiresAt: EXPIRES_AT,
      },
    });
    const response = new FakeResponse();

    expect(controller.getSession(currentRequest)).toEqual({
      authenticated: true,
      userId: USER_ID,
      personId: PERSON_ID,
      sessionId: SESSION_ID,
      expiresAt: EXPIRES_AT.toISOString(),
    });

    const csrf = controller.issueCsrf(currentRequest, response);
    expect(csrf.csrfToken).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u);
    expect(response.headers.get('Set-Cookie')).toEqual(
      expect.stringContaining('__Host-newax_csrf='),
    );
  });

  it('revokes the cookie session and clears both browser cookies', async () => {
    const authentication = new FakeAuthenticationService();
    const controller = createController(authentication);
    const response = new FakeResponse();

    await controller.logout(
      request({
        method: 'POST',
        headers: {
          cookie:
            '__Host-newax_session=opaque-session-token; __Host-newax_csrf=csrf-token',
        },
      }),
      response,
    );

    expect(authentication.logoutToken).toBe('opaque-session-token');
    expect(response.headers.get('Set-Cookie')).toEqual(
      expect.arrayContaining([
        expect.stringContaining('__Host-newax_session=;'),
        expect.stringContaining('__Host-newax_csrf=;'),
      ]),
    );
  });
});
