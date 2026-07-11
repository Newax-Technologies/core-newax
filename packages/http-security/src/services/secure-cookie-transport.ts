import { HttpSecurityError } from '../errors/http-security-error';

const COOKIE_VALUE_PATTERN =
  /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/u;
const EXPIRED_COOKIE_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

export class SecureCookieTransport {
  readonly sessionCookieName = '__Host-newax_session';
  readonly csrfCookieName = '__Host-newax_csrf';
  readonly csrfHeaderName = 'x-newax-csrf';
  readonly membershipHeaderName = 'x-newax-membership-id';

  sessionCookie(sessionToken: string, maxAgeSeconds: number): string {
    return this.serialize(
      this.sessionCookieName,
      this.requireCookieValue(sessionToken),
      maxAgeSeconds,
      true,
      'Lax',
    );
  }

  csrfCookie(csrfToken: string, maxAgeSeconds: number): string {
    return this.serialize(
      this.csrfCookieName,
      this.requireCookieValue(csrfToken),
      maxAgeSeconds,
      false,
      'Strict',
    );
  }

  clearSessionCookie(): string {
    return this.serialize(this.sessionCookieName, '', 0, true, 'Lax', true);
  }

  clearCsrfCookie(): string {
    return this.serialize(this.csrfCookieName, '', 0, false, 'Strict', true);
  }

  private serialize(
    name: string,
    value: string,
    maxAgeSeconds: number,
    httpOnly: boolean,
    sameSite: 'Lax' | 'Strict',
    expired = false,
  ): string {
    if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds < 0) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Cookie max age must be a non-negative integer.',
        500,
      );
    }

    const directives = [
      `${name}=${value}`,
      'Path=/',
      `Max-Age=${String(maxAgeSeconds)}`,
      'Secure',
      `SameSite=${sameSite}`,
      'Priority=High',
    ];
    if (expired) {
      directives.push(`Expires=${EXPIRED_COOKIE_DATE}`);
    }
    if (httpOnly) {
      directives.push('HttpOnly');
    }
    return directives.join('; ');
  }

  private requireCookieValue(value: string): string {
    if (
      value.length === 0 ||
      value.length > 1_024 ||
      !COOKIE_VALUE_PATTERN.test(value)
    ) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Cookie value is invalid.',
        500,
      );
    }
    return value;
  }
}
