import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CookieHeaderParser,
  HttpRateLimiter,
  HttpSecurityError,
  RequestOriginPolicy,
  SecureCookieTransport,
  SignedCsrfTokenService,
  type HttpSecurityAuditSink,
  type HttpSecurityContextMode,
  type HttpSecurityMethod,
  type HttpSecurityPolicy,
  type HttpSecurityRequest,
} from '@newax/http-security';
import {
  ContextAuthorizer,
  TrustedRequestContextService,
  type TrustedOrganizationRequestContext,
  type TrustedRequestContext,
} from '@newax/request-context';

import { PrismaHttpSecurityAuditSink } from './prisma-http-security-audit.sink';
import {
  HTTP_AUTHENTICATION_SENSITIVE_KEY,
  HTTP_CONTEXT_MODE_KEY,
  HTTP_REQUIRED_PERMISSIONS_KEY,
} from './http-security.decorators';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from './http-security-request';
import { HTTP_SECURITY_POLICY } from './http-security.tokens';
import { SystemHttpSecurityClock } from './node-http-security.infrastructure';

@Injectable()
export class HttpSecurityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(HTTP_SECURITY_POLICY)
    private readonly policy: HttpSecurityPolicy,
    private readonly cookieParser: CookieHeaderParser,
    private readonly cookieTransport: SecureCookieTransport,
    private readonly originPolicy: RequestOriginPolicy,
    private readonly csrfTokens: SignedCsrfTokenService,
    private readonly rateLimiter: HttpRateLimiter,
    private readonly contexts: TrustedRequestContextService,
    private readonly authorizer: ContextAuthorizer,
    @Inject(PrismaHttpSecurityAuditSink)
    private readonly auditSink: HttpSecurityAuditSink,
    private readonly clock: SystemHttpSecurityClock,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<HttpSecurityRequestAdapter>();
    const response = executionContext
      .switchToHttp()
      .getResponse<HttpSecurityResponseAdapter>();
    const method = this.normalizeMethod(request.method);
    const routeKey = `${executionContext.getClass().name}.${executionContext.getHandler().name}`;
    request.newaxRouteKey = routeKey;
    const requestId = this.requireRequestId(request.newaxRequestId);
    const securityRequest = this.toSecurityRequest(
      request,
      requestId,
      routeKey,
      method,
    );

    const authenticationSensitive =
      this.reflector.getAllAndOverride<boolean>(
        HTTP_AUTHENTICATION_SENSITIVE_KEY,
        [executionContext.getHandler(), executionContext.getClass()],
      ) ?? false;
    const rateLimit = await this.rateLimiter.consume(
      `${request.ip ?? 'unknown'}|${routeKey}`,
      authenticationSensitive,
    );
    response.setHeader('RateLimit-Limit', String(
      authenticationSensitive
        ? this.policy.authenticationRateLimitMaximumRequests
        : this.policy.rateLimitMaximumRequests,
    ));
    response.setHeader('RateLimit-Remaining', String(rateLimit.remaining));
    response.setHeader(
      'RateLimit-Reset',
      String(Math.ceil(rateLimit.resetAt.getTime() / 1_000)),
    );

    this.originPolicy.validate(securityRequest);
    const contextMode =
      this.reflector.getAllAndOverride<HttpSecurityContextMode>(
        HTTP_CONTEXT_MODE_KEY,
        [executionContext.getHandler(), executionContext.getClass()],
      ) ?? 'organization';

    if (contextMode === 'public') {
      if (this.originPolicy.isStateChanging(method)) {
        throw new HttpSecurityError(
          'HTTP_SECURITY_FORBIDDEN',
          'Unauthenticated state-changing HTTP endpoints are not enabled.',
          403,
        );
      }
      return true;
    }

    const cookies = this.cookieParser.parse(
      this.singleHeader(request.headers.cookie),
    );
    if (cookies.sessionToken === null) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_AUTHENTICATION_REQUIRED',
        'A valid authenticated session is required.',
        401,
      );
    }

    const trustedContext = await this.resolveContext(
      contextMode,
      cookies.sessionToken,
      this.singleHeader(
        request.headers[this.cookieTransport.membershipHeaderName],
      ),
      requestId,
    );
    request.trustedContext = trustedContext;

    if (this.originPolicy.isStateChanging(method)) {
      this.csrfTokens.verify({
        sessionId: trustedContext.sessionId,
        cookieToken: cookies.csrfToken,
        headerToken: this.singleHeader(
          request.headers[this.cookieTransport.csrfHeaderName],
        ),
      });
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<readonly string[]>(
        HTTP_REQUIRED_PERMISSIONS_KEY,
        [executionContext.getHandler(), executionContext.getClass()],
      ) ?? [];
    if (requiredPermissions.length > 0) {
      if (trustedContext.scope !== 'organization') {
        throw new HttpSecurityError(
          'HTTP_SECURITY_FORBIDDEN',
          'Organization context is required for permission checks.',
          403,
        );
      }
      this.authorizer.requireAllPermissions(
        trustedContext,
        requiredPermissions,
      );
    }

    if (this.originPolicy.isStateChanging(method)) {
      await this.auditAllowed(
        trustedContext,
        securityRequest,
        requiredPermissions,
      );
    }
    return true;
  }

  private async resolveContext(
    mode: Exclude<HttpSecurityContextMode, 'public'>,
    sessionToken: string,
    membershipId: string | null,
    requestId: string,
  ): Promise<TrustedRequestContext> {
    if (mode === 'account') {
      return this.contexts.resolveAccountContext({ sessionToken, requestId });
    }
    if (membershipId === null) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_FORBIDDEN',
        'An active organization membership is required.',
        403,
      );
    }
    return this.contexts.resolveOrganizationContext({
      sessionToken,
      membershipId,
      requestId,
    });
  }

  private async auditAllowed(
    context: TrustedRequestContext,
    request: HttpSecurityRequest,
    requiredPermissions: readonly string[],
  ): Promise<void> {
    await this.auditSink.record({
      requestId: request.requestId,
      actorUserId: context.userId,
      organizationId:
        context.scope === 'organization' ? context.organizationId : null,
      action: 'http.request.authorized',
      outcome: 'allowed',
      routeKey: request.routeKey,
      method: request.method,
      statusCode: 0,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: {
        contextScope: context.scope,
        membershipId:
          context.scope === 'organization' ? context.membershipId : null,
        requiredPermissions: [...requiredPermissions],
      },
      occurredAt: this.clock.now(),
    });
  }

  private toSecurityRequest(
    request: HttpSecurityRequestAdapter,
    requestId: string,
    routeKey: string,
    method: HttpSecurityMethod,
  ): HttpSecurityRequest {
    return {
      method,
      routeKey,
      requestId,
      origin: this.singleHeader(request.headers.origin),
      referer: this.singleHeader(request.headers.referer),
      fetchSite: this.singleHeader(request.headers['sec-fetch-site']),
      contentType: this.singleHeader(request.headers['content-type']),
      ipAddress: request.ip ?? null,
      userAgent: this.singleHeader(request.headers['user-agent']),
    };
  }

  private requireRequestId(value: string | undefined): string {
    if (value === undefined) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'The HTTP request boundary did not establish a request identifier.',
        500,
      );
    }
    return value;
  }

  private normalizeMethod(method: string): HttpSecurityMethod {
    const normalized = method.toUpperCase();
    if (
      normalized === 'GET' ||
      normalized === 'HEAD' ||
      normalized === 'OPTIONS' ||
      normalized === 'POST' ||
      normalized === 'PUT' ||
      normalized === 'PATCH' ||
      normalized === 'DELETE'
    ) {
      return normalized;
    }
    throw new HttpSecurityError(
      'HTTP_SECURITY_INVALID_INPUT',
      'HTTP method is not supported.',
      405,
    );
  }

  private singleHeader(
    value: string | readonly string[] | undefined,
  ): string | null {
    if (value === undefined) {
      return null;
    }
    if (typeof value !== 'string') {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Duplicate security headers are not allowed.',
        400,
      );
    }
    return value;
  }
}
