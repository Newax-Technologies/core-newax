import { Body, Controller, Get, Header, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { AuthenticationService, type PasswordLoginInput } from '@newax/auth';
import {
  CookieHeaderParser,
  HttpSecurityError,
  SecureCookieTransport,
  SignedCsrfTokenService,
} from '@newax/http-security';
import type { TrustedAccountRequestContext } from '@newax/request-context';

import {
  AccountContextEndpoint,
  PublicAuthenticationEndpoint,
} from '../http-security/http-security.decorators';
import type {
  HttpSecurityRequestAdapter,
  HttpSecurityResponseAdapter,
} from '../http-security/http-security-request';
import {
  parseAuthenticationLoginRequest,
  type AuthenticationLoginRequest,
} from './authentication-http-input';

interface AuthenticationLoginResponse {
  readonly userId: string;
  readonly personId: string;
  readonly session: {
    readonly id: string;
    readonly expiresAt: string;
  };
  readonly csrfToken: string;
}

interface AuthenticationSessionResponse {
  readonly authenticated: true;
  readonly userId: string;
  readonly personId: string;
  readonly sessionId: string;
  readonly expiresAt: string;
}

interface AuthenticationCsrfResponse {
  readonly csrfToken: string;
}

@Controller('auth')
export class AuthenticationHttpController {
  constructor(
    @Inject(AuthenticationService)
    private readonly authentication: AuthenticationService,
    @Inject(CookieHeaderParser)
    private readonly cookieParser: CookieHeaderParser,
    @Inject(SecureCookieTransport)
    private readonly cookieTransport: SecureCookieTransport,
    @Inject(SignedCsrfTokenService)
    private readonly csrfTokens: SignedCsrfTokenService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @PublicAuthenticationEndpoint()
  async login(
    @Body() body: unknown,
    @Req() request: HttpSecurityRequestAdapter,
    @Res({ passthrough: true }) response: HttpSecurityResponseAdapter,
  ): Promise<AuthenticationLoginResponse> {
    const parsed = parseAuthenticationLoginRequest(body);
    const result = await this.authentication.login(this.toLoginInput(parsed, request));
    const maxAgeSeconds = this.cookieMaxAgeSeconds(result.session.expiresAt);
    const csrf = this.csrfTokens.issue(result.session.id);

    response.setHeader('Set-Cookie', [
      this.cookieTransport.sessionCookie(result.sessionToken, maxAgeSeconds),
      this.cookieTransport.csrfCookie(csrf.cookieValue, maxAgeSeconds),
    ]);
    request.newaxAuthenticatedUserId = result.userId;
    request.newaxAuthenticatedSessionId = result.session.id;

    return {
      userId: result.userId,
      personId: result.personId,
      session: {
        id: result.session.id,
        expiresAt: result.session.expiresAt.toISOString(),
      },
      csrfToken: csrf.token,
    };
  }

  @Get('session')
  @Header('Cache-Control', 'no-store')
  @AccountContextEndpoint()
  getSession(@Req() request: HttpSecurityRequestAdapter): AuthenticationSessionResponse {
    const context = this.requireAccountContext(request);
    return {
      authenticated: true,
      userId: context.userId,
      personId: context.personId,
      sessionId: context.sessionId,
      expiresAt: context.sessionExpiresAt.toISOString(),
    };
  }

  @Get('csrf')
  @Header('Cache-Control', 'no-store')
  @AccountContextEndpoint()
  issueCsrf(
    @Req() request: HttpSecurityRequestAdapter,
    @Res({ passthrough: true }) response: HttpSecurityResponseAdapter,
  ): AuthenticationCsrfResponse {
    const context = this.requireAccountContext(request);
    const issued = this.csrfTokens.issue(context.sessionId);
    response.setHeader(
      'Set-Cookie',
      this.cookieTransport.csrfCookie(
        issued.cookieValue,
        this.cookieMaxAgeSeconds(context.sessionExpiresAt),
      ),
    );
    return { csrfToken: issued.token };
  }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @AccountContextEndpoint()
  async logout(
    @Req() request: HttpSecurityRequestAdapter,
    @Res({ passthrough: true }) response: HttpSecurityResponseAdapter,
  ): Promise<void> {
    if (request.newaxHasBody === true) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'The logout request must not include a body.',
        400,
      );
    }

    const cookies = this.cookieParser.parse(this.singleHeader(request.headers.cookie, 8_192));
    if (cookies.sessionToken === null) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_AUTHENTICATION_REQUIRED',
        'A valid authenticated session is required.',
        401,
      );
    }

    await this.authentication.logout(cookies.sessionToken);
    response.setHeader('Set-Cookie', [
      this.cookieTransport.clearSessionCookie(),
      this.cookieTransport.clearCsrfCookie(),
    ]);
  }

  private toLoginInput(
    parsed: AuthenticationLoginRequest,
    request: HttpSecurityRequestAdapter,
  ): PasswordLoginInput {
    const ipAddress = request.ip?.slice(0, 64);
    const userAgent = this.optionalSingleHeader(request.headers['user-agent'], 1_024);
    return {
      identityType: parsed.identityType,
      identityValue: parsed.identityValue,
      password: parsed.password,
      ...(ipAddress === undefined ? {} : { ipAddress }),
      ...(userAgent === undefined ? {} : { userAgent }),
    };
  }

  private requireAccountContext(request: HttpSecurityRequestAdapter): TrustedAccountRequestContext {
    const context = request.trustedContext;
    if (context === undefined || context.scope !== 'account') {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Trusted account context was not established.',
        500,
      );
    }
    return context;
  }

  private cookieMaxAgeSeconds(expiresAt: Date): number {
    const remainingMilliseconds = expiresAt.getTime() - Date.now();
    if (!Number.isFinite(remainingMilliseconds) || remainingMilliseconds <= 0) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'The authenticated session expiry is invalid.',
        500,
      );
    }
    return Math.max(1, Math.floor(remainingMilliseconds / 1_000));
  }

  private singleHeader(
    value: string | readonly string[] | undefined,
    maximumLength: number,
  ): string | null {
    if (value === undefined) {
      return null;
    }
    if (typeof value !== 'string' || value.length > maximumLength) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'A security-relevant HTTP header is invalid.',
        400,
      );
    }
    return value;
  }

  private optionalSingleHeader(
    value: string | readonly string[] | undefined,
    maximumLength: number,
  ): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    return value.slice(0, maximumLength);
  }
}
