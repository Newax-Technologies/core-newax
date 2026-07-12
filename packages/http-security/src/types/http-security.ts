export type HttpSecurityContextMode = 'public' | 'account' | 'organization';
export type HttpSecurityMethod = 'GET' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpSecurityPolicy {
  readonly allowedOrigins: readonly string[];
  readonly requireHttps: boolean;
  readonly trustedProxyCidrs: readonly string[];
  readonly bodyLimitBytes: number;
  readonly rateLimitWindowMilliseconds: number;
  readonly rateLimitMaximumRequests: number;
  readonly authenticationRateLimitMaximumRequests: number;
  readonly hstsMaxAgeSeconds: number;
  readonly hstsIncludeSubDomains: boolean;
  readonly hstsPreload: boolean;
}

export interface HttpSecurityRequest {
  readonly method: HttpSecurityMethod;
  readonly routeKey: string;
  readonly requestId: string;
  readonly origin: string | null;
  readonly referer: string | null;
  readonly fetchSite: string | null;
  readonly contentType: string | null;
  readonly hasBody: boolean;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

export interface HttpCookieValues {
  readonly sessionToken: string | null;
  readonly csrfToken: string | null;
}

export interface CsrfValidationInput {
  readonly sessionId: string;
  readonly cookieToken: string | null;
  readonly headerToken: string | null;
}

export interface IssuedCsrfToken {
  readonly token: string;
  readonly cookieValue: string;
}

export interface HttpRateLimitInput {
  readonly key: string;
  readonly limit: number;
  readonly windowMilliseconds: number;
  readonly occurredAt: Date;
}

export interface HttpRateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
  readonly resetAt: Date;
}

export interface HttpAuditRecord {
  readonly requestId: string;
  readonly actorUserId: string | null;
  readonly organizationId: string | null;
  readonly action: string;
  readonly outcome: 'allowed' | 'denied' | 'failed';
  readonly routeKey: string;
  readonly method: HttpSecurityMethod;
  readonly statusCode: number;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface HttpSecurityHeaders {
  readonly [headerName: string]: string;
}
