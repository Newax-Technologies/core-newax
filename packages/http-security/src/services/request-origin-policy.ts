import { HttpSecurityError } from '../errors/http-security-error';
import type {
  HttpSecurityMethod,
  HttpSecurityRequest,
} from '../types/http-security';

const SAFE_METHODS: ReadonlySet<HttpSecurityMethod> = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);

export class RequestOriginPolicy {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor(allowedOrigins: readonly string[]) {
    this.allowedOrigins = new Set(
      allowedOrigins.map((origin) => this.normalizeOrigin(origin)),
    );
    if (this.allowedOrigins.size === 0) {
      throw new Error('At least one allowed HTTP origin is required.');
    }
  }

  isStateChanging(method: HttpSecurityMethod): boolean {
    return !SAFE_METHODS.has(method);
  }

  validate(request: HttpSecurityRequest): void {
    if (!this.isStateChanging(request.method)) {
      return;
    }

    if (request.fetchSite === 'cross-site') {
      throw this.originRejected();
    }
    if (
      request.fetchSite !== null &&
      request.fetchSite !== 'same-origin' &&
      request.fetchSite !== 'same-site' &&
      request.fetchSite !== 'none'
    ) {
      throw this.originRejected();
    }

    const sourceOrigin = this.resolveSourceOrigin(
      request.origin,
      request.referer,
    );
    if (sourceOrigin === null || !this.allowedOrigins.has(sourceOrigin)) {
      throw this.originRejected();
    }

    if (request.hasBody && !this.isJsonContentType(request.contentType)) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_ORIGIN_REJECTED',
        'State-changing HTTP request bodies must use a supported JSON content type.',
        415,
      );
    }
  }

  private resolveSourceOrigin(
    origin: string | null,
    referer: string | null,
  ): string | null {
    if (origin !== null) {
      return this.tryNormalizeOrigin(origin);
    }
    if (referer === null) {
      return null;
    }
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  private isJsonContentType(contentType: string | null): boolean {
    if (contentType === null) {
      return false;
    }
    const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
    return (
      mediaType === 'application/json' ||
      (mediaType?.startsWith('application/') === true &&
        mediaType.endsWith('+json'))
    );
  }

  private normalizeOrigin(origin: string): string {
    const normalized = this.tryNormalizeOrigin(origin);
    if (normalized === null) {
      throw new Error(`Invalid allowed HTTP origin: ${origin}`);
    }
    return normalized;
  }

  private tryNormalizeOrigin(origin: string): string | null {
    try {
      const parsed = new URL(origin.trim());
      if (
        (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
        parsed.username.length > 0 ||
        parsed.password.length > 0 ||
        parsed.pathname !== '/' ||
        parsed.search.length > 0 ||
        parsed.hash.length > 0
      ) {
        return null;
      }
      return parsed.origin;
    } catch {
      return null;
    }
  }

  private originRejected(): HttpSecurityError {
    return new HttpSecurityError(
      'HTTP_SECURITY_ORIGIN_REJECTED',
      'The request origin is not allowed.',
      403,
    );
  }
}
