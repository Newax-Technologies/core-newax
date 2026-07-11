export type HttpSecurityErrorCode =
  | 'HTTP_SECURITY_AUTHENTICATION_REQUIRED'
  | 'HTTP_SECURITY_CSRF_REJECTED'
  | 'HTTP_SECURITY_FORBIDDEN'
  | 'HTTP_SECURITY_HTTPS_REQUIRED'
  | 'HTTP_SECURITY_INVALID_COOKIE_HEADER'
  | 'HTTP_SECURITY_INVALID_INPUT'
  | 'HTTP_SECURITY_ORIGIN_REJECTED'
  | 'HTTP_SECURITY_RATE_LIMITED'
  | 'HTTP_SECURITY_RESPONSE_REDACTED';

export class HttpSecurityError extends Error {
  readonly code: HttpSecurityErrorCode;
  readonly statusCode: number;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: HttpSecurityErrorCode,
    message: string,
    statusCode: number,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'HttpSecurityError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
