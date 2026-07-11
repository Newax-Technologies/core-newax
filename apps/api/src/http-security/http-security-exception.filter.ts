import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import {
  HttpSecurityError,
  type HttpSecurityAuditSink,
  type HttpSecurityMethod,
} from '@newax/http-security';

import { PrismaHttpSecurityAuditSink } from './prisma-http-security-audit.sink';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from './http-security-request';
import { SystemHttpSecurityClock } from './node-http-security.infrastructure';

interface CodedError {
  readonly code: string;
  readonly message?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

interface MappedHttpError {
  readonly statusCode: number;
  readonly publicCode: string;
  readonly publicMessage: string;
  readonly internalCode: string;
  readonly retryAfterSeconds: number | null;
}

@Catch()
@Injectable()
export class HttpSecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpSecurityExceptionFilter.name);

  constructor(
    private readonly auditSink: PrismaHttpSecurityAuditSink,
    private readonly clock: SystemHttpSecurityClock,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpSecurityRequestAdapter>();
    const response = http.getResponse<HttpSecurityResponseAdapter>();
    const mapped = this.mapError(exception);
    const requestId = request.newaxRequestId ?? 'unavailable';
    const context = request.trustedContext;

    if (mapped.retryAfterSeconds !== null) {
      response.setHeader('Retry-After', String(mapped.retryAfterSeconds));
    }

    try {
      await this.auditSink.record({
        requestId: requestId.slice(0, 128),
        actorUserId: context?.userId ?? null,
        organizationId:
          context?.scope === 'organization' ? context.organizationId : null,
        action: 'http.request.rejected',
        outcome: mapped.statusCode >= 500 ? 'failed' : 'denied',
        routeKey: (request.newaxRouteKey ?? 'unknown').slice(0, 128),
        method: this.normalizeMethod(request.method),
        statusCode: mapped.statusCode,
        ipAddress: request.ip ?? null,
        userAgent: this.singleHeader(request.headers['user-agent']),
        metadata: { internalCode: mapped.internalCode },
        occurredAt: this.clock.now(),
      });
    } catch (auditError: unknown) {
      this.logger.error(
        'Failed to persist an HTTP security rejection audit record.',
        auditError instanceof Error ? auditError.stack : String(auditError),
      );
    }

    if (mapped.statusCode >= 500) {
      this.logger.error(
        `HTTP request failed with ${mapped.internalCode}.`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(mapped.statusCode).json({
      error: {
        code: mapped.publicCode,
        message: mapped.publicMessage,
        requestId,
      },
    });
  }

  private mapError(exception: unknown): MappedHttpError {
    if (exception instanceof HttpSecurityError) {
      return {
        statusCode: exception.statusCode,
        publicCode: this.publicCode(exception.statusCode),
        publicMessage: this.publicMessage(exception.statusCode),
        internalCode: exception.code,
        retryAfterSeconds: this.retryAfter(exception.details),
      };
    }

    const coded = this.asCodedError(exception);
    if (coded !== null) {
      const statusCode = this.statusForCode(coded.code);
      return {
        statusCode,
        publicCode: this.publicCode(statusCode),
        publicMessage: this.publicMessage(statusCode),
        internalCode: coded.code,
        retryAfterSeconds: null,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        publicCode: this.publicCode(statusCode),
        publicMessage: this.publicMessage(statusCode),
        internalCode: `HTTP_${String(statusCode)}`,
        retryAfterSeconds: null,
      };
    }

    return {
      statusCode: 500,
      publicCode: 'INTERNAL_ERROR',
      publicMessage: 'The request could not be completed.',
      internalCode: 'UNHANDLED_ERROR',
      retryAfterSeconds: null,
    };
  }

  private asCodedError(exception: unknown): CodedError | null {
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof exception.code === 'string'
    ) {
      return exception as CodedError;
    }
    return null;
  }

  private statusForCode(code: string): number {
    if (code.includes('AUTHENTICATION_REQUIRED') || code === 'AUTHENTICATION_FAILED') {
      return 401;
    }
    if (
      code.includes('FORBIDDEN') ||
      code.includes('MEMBERSHIP_UNAVAILABLE') ||
      code.includes('PLATFORM_CONTEXT_REQUIRED')
    ) {
      return 403;
    }
    if (code.includes('NOT_FOUND')) {
      return 404;
    }
    if (code.includes('CONFLICT') || code.includes('ALREADY')) {
      return 409;
    }
    if (code.includes('INVALID_INPUT') || code.includes('POLICY_FAILED')) {
      return 400;
    }
    if (code.includes('UNAVAILABLE')) {
      return 409;
    }
    return 500;
  }

  private publicCode(statusCode: number): string {
    if (statusCode === 400) return 'INVALID_REQUEST';
    if (statusCode === 401) return 'AUTHENTICATION_REQUIRED';
    if (statusCode === 403) return 'FORBIDDEN';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 405) return 'METHOD_NOT_ALLOWED';
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode === 415) return 'UNSUPPORTED_MEDIA_TYPE';
    if (statusCode === 429) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
  }

  private publicMessage(statusCode: number): string {
    if (statusCode === 400) return 'The request is invalid.';
    if (statusCode === 401) return 'Authentication is required.';
    if (statusCode === 403) return 'The request is not allowed.';
    if (statusCode === 404) return 'The requested resource was not found.';
    if (statusCode === 405) return 'The HTTP method is not allowed.';
    if (statusCode === 409) return 'The request conflicts with the current resource state.';
    if (statusCode === 415) return 'The request content type is not supported.';
    if (statusCode === 429) return 'Too many requests. Try again later.';
    return 'The request could not be completed.';
  }

  private retryAfter(
    details: Readonly<Record<string, unknown>>,
  ): number | null {
    const value = details.retryAfterSeconds;
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : null;
  }

  private normalizeMethod(value: string): HttpSecurityMethod {
    const method = value.toUpperCase();
    if (
      method === 'GET' ||
      method === 'HEAD' ||
      method === 'OPTIONS' ||
      method === 'POST' ||
      method === 'PUT' ||
      method === 'PATCH' ||
      method === 'DELETE'
    ) {
      return method;
    }
    return 'GET';
  }

  private singleHeader(
    value: string | readonly string[] | undefined,
  ): string | null {
    return typeof value === 'string' ? value.slice(0, 1_024) : null;
  }
}
