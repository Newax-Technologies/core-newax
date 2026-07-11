import { Inject, Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type {
  HttpSecurityAuditSink,
  HttpSecurityMethod,
  HttpSecurityPolicy,
} from '@newax/http-security';
import { SecurityHeadersPolicy } from '@newax/http-security';

import { PrismaHttpSecurityAuditSink } from './prisma-http-security-audit.sink';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from './http-security-request';
import { HTTP_SECURITY_POLICY } from './http-security.tokens';
import { HttpRequestIdFactory, SystemHttpSecurityClock } from './node-http-security.infrastructure';

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const SUPPORTED_METHODS: ReadonlySet<string> = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

@Injectable()
export class HttpBoundaryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpBoundaryMiddleware.name);
  private readonly headersPolicy: SecurityHeadersPolicy;

  constructor(
    @Inject(HTTP_SECURITY_POLICY)
    private readonly policy: HttpSecurityPolicy,
    @Inject(HttpRequestIdFactory)
    private readonly requestIds: HttpRequestIdFactory,
    @Inject(SystemHttpSecurityClock)
    private readonly clock: SystemHttpSecurityClock,
    @Inject(PrismaHttpSecurityAuditSink)
    private readonly auditSink: HttpSecurityAuditSink,
  ) {
    this.headersPolicy = new SecurityHeadersPolicy(policy);
  }

  async use(
    request: HttpSecurityRequestAdapter,
    response: HttpSecurityResponseAdapter,
    next: () => void,
  ): Promise<void> {
    const requestId = this.resolveRequestId(request.headers['x-request-id']);
    request.newaxRequestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    const isSecure = request.secure === true || request.protocol === 'https';
    for (const [name, value] of Object.entries(
      this.headersPolicy.headers(isSecure),
    )) {
      response.setHeader(name, value);
    }

    const method = request.method.toUpperCase();
    if (
      !SUPPORTED_METHODS.has(method) ||
      request.headers['x-http-method-override'] !== undefined
    ) {
      await this.reject(
        request,
        response,
        requestId,
        'http.method.rejected',
        405,
        'HTTP method is not allowed.',
      );
      return;
    }

    if (this.policy.requireHttps && !isSecure) {
      response.setHeader('Connection', 'close');
      await this.reject(
        request,
        response,
        requestId,
        'http.https.required',
        400,
        'HTTPS is required.',
      );
      return;
    }

    next();
  }

  private resolveRequestId(
    header: string | readonly string[] | undefined,
  ): string {
    if (typeof header === 'string' && REQUEST_ID_PATTERN.test(header.trim())) {
      return header.trim().toLowerCase();
    }
    return this.requestIds.issue();
  }

  private async reject(
    request: HttpSecurityRequestAdapter,
    response: HttpSecurityResponseAdapter,
    requestId: string,
    action: string,
    statusCode: number,
    message: string,
  ): Promise<void> {
    const method = this.normalizeMethod(request.method);
    const routeKey = `${method} ${request.path ?? request.originalUrl ?? '/'}`.slice(
      0,
      128,
    );
    try {
      await this.auditSink.record({
        requestId,
        actorUserId: null,
        organizationId: null,
        action,
        outcome: 'denied',
        routeKey,
        method,
        statusCode,
        ipAddress: request.ip ?? null,
        userAgent: this.singleHeader(request.headers['user-agent']),
        metadata: {},
        occurredAt: this.clock.now(),
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to persist an HTTP boundary denial audit record.',
        error instanceof Error ? error.stack : String(error),
      );
    }

    response.status(statusCode).json({
      error: {
        code: action === 'http.https.required' ? 'HTTPS_REQUIRED' : 'METHOD_NOT_ALLOWED',
        message,
        requestId,
      },
    });
  }

  private normalizeMethod(value: string): HttpSecurityMethod {
    const normalized = value.toUpperCase();
    return SUPPORTED_METHODS.has(normalized)
      ? (normalized as HttpSecurityMethod)
      : 'GET';
  }

  private singleHeader(
    value: string | readonly string[] | undefined,
  ): string | null {
    return typeof value === 'string' ? value.slice(0, 1_024) : null;
  }
}
