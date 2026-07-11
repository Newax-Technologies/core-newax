import { describe, expect, it } from 'vitest';

import type {
  HttpAuditRecord,
  HttpSecurityAuditSink,
  HttpSecurityPolicy,
} from '@newax/http-security';

import { HttpBoundaryMiddleware } from './http-boundary.middleware';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from './http-security-request';
import {
  HttpRequestIdFactory,
  SystemHttpSecurityClock,
} from './node-http-security.infrastructure';

const policy: HttpSecurityPolicy = {
  allowedOrigins: ['https://app.newax.test'],
  requireHttps: true,
  trustedProxyCidrs: ['10.0.0.0/8'],
  bodyLimitBytes: 1_024,
  rateLimitWindowMilliseconds: 60_000,
  rateLimitMaximumRequests: 120,
  authenticationRateLimitMaximumRequests: 10,
  hstsMaxAgeSeconds: 63_072_000,
  hstsIncludeSubDomains: true,
  hstsPreload: false,
};

class RecordingAuditSink implements HttpSecurityAuditSink {
  readonly records: HttpAuditRecord[] = [];

  async record(record: HttpAuditRecord): Promise<void> {
    this.records.push(record);
  }
}

class FakeResponse implements HttpSecurityResponseAdapter {
  statusCode = 200;
  readonly headers = new Map<string, string | readonly string[]>();
  body: unknown;
  ended = false;

  setHeader(name: string, value: string | readonly string[]): void {
    this.headers.set(name, value);
  }

  status(code: number): HttpSecurityResponseAdapter {
    this.statusCode = code;
    return this;
  }

  json(body: unknown): void {
    this.body = body;
  }

  end(): void {
    this.ended = true;
  }
}

function request(
  overrides: Partial<HttpSecurityRequestAdapter> = {},
): HttpSecurityRequestAdapter {
  return {
    method: 'GET',
    path: '/api/health',
    ip: '127.0.0.1',
    secure: true,
    protocol: 'https',
    headers: {},
    ...overrides,
  };
}

function middleware(auditSink: HttpSecurityAuditSink): HttpBoundaryMiddleware {
  return new HttpBoundaryMiddleware(
    policy,
    new HttpRequestIdFactory(),
    new SystemHttpSecurityClock(),
    auditSink,
  );
}

describe('HttpBoundaryMiddleware', () => {
  it('generates server request IDs and applies strict headers', async () => {
    const response = new FakeResponse();
    let continued = false;

    await middleware(new RecordingAuditSink()).use(
      request(),
      response,
      () => {
        continued = true;
      },
    );

    expect(continued).toBe(true);
    expect(response.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f-]{36}$/u,
    );
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
  });

  it('rejects insecure requests before routing', async () => {
    const auditSink = new RecordingAuditSink();
    const response = new FakeResponse();

    await middleware(auditSink).use(
      request({ secure: false, protocol: 'http' }),
      response,
      () => undefined,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'HTTPS_REQUIRED' },
    });
    expect(auditSink.records[0]?.action).toBe('http.https.required');
  });

  it('rejects ambiguous request framing', async () => {
    const response = new FakeResponse();

    await middleware(new RecordingAuditSink()).use(
      request({
        method: 'POST',
        headers: {
          'content-length': '10',
          'transfer-encoding': 'chunked',
        },
      }),
      response,
      () => undefined,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('marks chunked or non-empty requests for downstream body policy', async () => {
    const currentRequest = request({
      method: 'POST',
      headers: { 'content-length': '10' },
    });

    await middleware(new RecordingAuditSink()).use(
      currentRequest,
      new FakeResponse(),
      () => undefined,
    );

    expect(currentRequest.newaxHasBody).toBe(true);
  });
});
