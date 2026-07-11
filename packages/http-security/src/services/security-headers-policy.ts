import type {
  HttpSecurityHeaders,
  HttpSecurityPolicy,
} from '../types/http-security';

export class SecurityHeadersPolicy {
  constructor(private readonly policy: HttpSecurityPolicy) {}

  headers(isSecureRequest: boolean): HttpSecurityHeaders {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Security-Policy':
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; sandbox",
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-site',
      'Origin-Agent-Cluster': '?1',
      'Permissions-Policy':
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      Pragma: 'no-cache',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-DNS-Prefetch-Control': 'off',
      'X-Frame-Options': 'DENY',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-XSS-Protection': '0',
    };

    if (isSecureRequest) {
      const directives = [
        `max-age=${String(this.policy.hstsMaxAgeSeconds)}`,
      ];
      if (this.policy.hstsIncludeSubDomains) {
        directives.push('includeSubDomains');
      }
      if (this.policy.hstsPreload) {
        directives.push('preload');
      }
      headers['Strict-Transport-Security'] = directives.join('; ');
    }

    return headers;
  }
}
