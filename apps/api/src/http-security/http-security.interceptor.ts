import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { SensitiveResponseRedactor, type HttpSecurityAuditSink } from '@newax/http-security';
import { from, lastValueFrom, type Observable } from 'rxjs';

import { AsyncLocalStorageTrustedRequestContextStore } from '../request-context/node-request-context.infrastructure';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from './http-security-request';
import { SystemHttpSecurityClock } from './node-http-security.infrastructure';
import { PrismaHttpSecurityAuditSink } from './prisma-http-security-audit.sink';

@Injectable()
export class HttpSecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpSecurityInterceptor.name);

  constructor(
    private readonly contextStore: AsyncLocalStorageTrustedRequestContextStore,
    private readonly redactor: SensitiveResponseRedactor,
    private readonly auditSink: PrismaHttpSecurityAuditSink,
    private readonly clock: SystemHttpSecurityClock,
  ) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest<HttpSecurityRequestAdapter>();
    const response = executionContext.switchToHttp().getResponse<HttpSecurityResponseAdapter>();
    const context = request.trustedContext;

    const execute = async (): Promise<unknown> => {
      const value = await lastValueFrom(next.handle());
      const redacted = this.redactor.redact(value);
      await this.auditCompleted(request, response, this.auditSink);
      return redacted;
    };

    return from(context === undefined ? execute() : this.contextStore.run(context, execute));
  }

  private async auditCompleted(
    request: HttpSecurityRequestAdapter,
    response: HttpSecurityResponseAdapter,
    auditSink: HttpSecurityAuditSink,
  ): Promise<void> {
    if (
      request.newaxStateChanging !== true ||
      request.trustedContext === undefined ||
      request.newaxSecurityRequest === undefined
    ) {
      return;
    }

    const context = request.trustedContext;
    const securityRequest = request.newaxSecurityRequest;
    try {
      await auditSink.record({
        requestId: securityRequest.requestId,
        actorUserId: context.userId,
        organizationId: context.scope === 'organization' ? context.organizationId : null,
        action: 'http.request.completed',
        outcome: 'allowed',
        routeKey: securityRequest.routeKey,
        method: securityRequest.method,
        statusCode: response.statusCode ?? 200,
        ipAddress: securityRequest.ipAddress,
        userAgent: securityRequest.userAgent,
        metadata: {
          contextScope: context.scope,
          membershipId: context.scope === 'organization' ? context.membershipId : null,
          requiredPermissions: [...(request.newaxRequiredPermissions ?? [])],
        },
        occurredAt: this.clock.now(),
      });
    } catch (error: unknown) {
      this.logger.error({
        event: 'http.audit.write_failed',
        requestId: securityRequest.requestId,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }
}
