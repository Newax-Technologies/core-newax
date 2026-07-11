import {
  Inject,
  MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  CookieHeaderParser,
  HttpRateLimiter,
  RequestOriginPolicy,
  SecureCookieTransport,
  SensitiveResponseRedactor,
  SignedCsrfTokenService,
  type HttpSecurityPolicy,
} from '@newax/http-security';

import type { ApplicationEnvironment } from '../config/environment';
import { DatabaseModule } from '../database/database.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { HttpBoundaryMiddleware } from './http-boundary.middleware';
import { HttpSecurityExceptionFilter } from './http-security-exception.filter';
import { HttpSecurityGuard } from './http-security.guard';
import { HttpSecurityInterceptor } from './http-security.interceptor';
import { HTTP_SECURITY_POLICY } from './http-security.tokens';
import {
  HttpRequestIdFactory,
  MemoryHttpRateLimitStore,
  NodeHttpSecurityCrypto,
  SystemHttpSecurityClock,
} from './node-http-security.infrastructure';
import { PrismaHttpSecurityAuditSink } from './prisma-http-security-audit.sink';

@Module({
  imports: [DatabaseModule, RequestContextModule],
  providers: [
    {
      provide: HTTP_SECURITY_POLICY,
      inject: [ConfigService],
      useFactory: (
        configuration: ConfigService<ApplicationEnvironment, true>,
      ): HttpSecurityPolicy => ({
        allowedOrigins: configuration.get('HTTP_ALLOWED_ORIGINS', {
          infer: true,
        }),
        requireHttps: configuration.get('HTTP_REQUIRE_HTTPS', { infer: true }),
        trustProxyHops: configuration.get('HTTP_TRUST_PROXY_HOPS', {
          infer: true,
        }),
        bodyLimitBytes: configuration.get('HTTP_BODY_LIMIT_BYTES', {
          infer: true,
        }),
        rateLimitWindowMilliseconds: configuration.get(
          'HTTP_RATE_LIMIT_WINDOW_MILLISECONDS',
          { infer: true },
        ),
        rateLimitMaximumRequests: configuration.get(
          'HTTP_RATE_LIMIT_MAXIMUM_REQUESTS',
          { infer: true },
        ),
        authenticationRateLimitMaximumRequests: configuration.get(
          'HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS',
          { infer: true },
        ),
        hstsMaxAgeSeconds: configuration.get('HTTP_HSTS_MAX_AGE_SECONDS', {
          infer: true,
        }),
        hstsIncludeSubDomains: configuration.get(
          'HTTP_HSTS_INCLUDE_SUBDOMAINS',
          { infer: true },
        ),
        hstsPreload: configuration.get('HTTP_HSTS_PRELOAD', { infer: true }),
      }),
    },
    CookieHeaderParser,
    SecureCookieTransport,
    SensitiveResponseRedactor,
    MemoryHttpRateLimitStore,
    SystemHttpSecurityClock,
    HttpRequestIdFactory,
    PrismaHttpSecurityAuditSink,
    {
      provide: NodeHttpSecurityCrypto,
      inject: [ConfigService],
      useFactory: (
        configuration: ConfigService<ApplicationEnvironment, true>,
      ): NodeHttpSecurityCrypto =>
        new NodeHttpSecurityCrypto(
          configuration.get('HTTP_CSRF_SECRET', { infer: true }),
        ),
    },
    {
      provide: RequestOriginPolicy,
      inject: [HTTP_SECURITY_POLICY],
      useFactory: (policy: HttpSecurityPolicy): RequestOriginPolicy =>
        new RequestOriginPolicy(policy.allowedOrigins),
    },
    {
      provide: SignedCsrfTokenService,
      inject: [NodeHttpSecurityCrypto],
      useFactory: (
        crypto: NodeHttpSecurityCrypto,
      ): SignedCsrfTokenService => new SignedCsrfTokenService(crypto),
    },
    {
      provide: HttpRateLimiter,
      inject: [
        MemoryHttpRateLimitStore,
        SystemHttpSecurityClock,
        HTTP_SECURITY_POLICY,
      ],
      useFactory: (
        store: MemoryHttpRateLimitStore,
        clock: SystemHttpSecurityClock,
        policy: HttpSecurityPolicy,
      ): HttpRateLimiter => new HttpRateLimiter(store, clock, policy),
    },
    HttpBoundaryMiddleware,
    HttpSecurityGuard,
    HttpSecurityInterceptor,
    HttpSecurityExceptionFilter,
    {
      provide: APP_GUARD,
      useExisting: HttpSecurityGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: HttpSecurityInterceptor,
    },
    {
      provide: APP_FILTER,
      useExisting: HttpSecurityExceptionFilter,
    },
  ],
  exports: [
    SecureCookieTransport,
    SignedCsrfTokenService,
    HTTP_SECURITY_POLICY,
  ],
})
export class HttpSecurityModule implements NestModule {
  constructor(
    @Inject(HttpBoundaryMiddleware)
    private readonly boundary: HttpBoundaryMiddleware,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(this.boundary.use.bind(this.boundary)).forRoutes('*');
  }
}
