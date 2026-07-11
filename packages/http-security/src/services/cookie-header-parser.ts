import { HttpSecurityError } from '../errors/http-security-error';
import type { HttpCookieValues } from '../types/http-security';

const MAX_COOKIE_HEADER_LENGTH = 8_192;
const COOKIE_VALUE_PATTERN =
  /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/u;

export class CookieHeaderParser {
  constructor(
    private readonly sessionCookieName = '__Host-newax_session',
    private readonly csrfCookieName = '__Host-newax_csrf',
  ) {}

  parse(cookieHeader: string | null): HttpCookieValues {
    if (cookieHeader === null || cookieHeader.length === 0) {
      return { sessionToken: null, csrfToken: null };
    }
    if (cookieHeader.length > MAX_COOKIE_HEADER_LENGTH) {
      throw this.invalidCookieHeader();
    }

    const values = new Map<string, string>();
    for (const segment of cookieHeader.split(';')) {
      const separatorIndex = segment.indexOf('=');
      if (separatorIndex < 1) {
        throw this.invalidCookieHeader();
      }

      const name = segment.slice(0, separatorIndex).trim();
      const value = segment.slice(separatorIndex + 1).trim();
      if (name.length === 0) {
        throw this.invalidCookieHeader();
      }
      if (name !== this.sessionCookieName && name !== this.csrfCookieName) {
        continue;
      }
      if (
        value.length === 0 ||
        !COOKIE_VALUE_PATTERN.test(value) ||
        values.has(name)
      ) {
        throw this.invalidCookieHeader();
      }
      values.set(name, value);
    }

    return {
      sessionToken: values.get(this.sessionCookieName) ?? null,
      csrfToken: values.get(this.csrfCookieName) ?? null,
    };
  }

  private invalidCookieHeader(): HttpSecurityError {
    return new HttpSecurityError(
      'HTTP_SECURITY_INVALID_COOKIE_HEADER',
      'The request cookie header is invalid.',
      400,
    );
  }
}
