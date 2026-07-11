import { HttpSecurityError } from '../errors/http-security-error';
import type {
  HttpRateLimitResult,
  HttpSecurityPolicy,
} from '../types/http-security';
import type {
  HttpRateLimitStore,
  HttpSecurityClock,
} from './http-security-ports';

export class HttpRateLimiter {
  constructor(
    private readonly store: HttpRateLimitStore,
    private readonly clock: HttpSecurityClock,
    private readonly policy: HttpSecurityPolicy,
  ) {}

  async consume(
    key: string,
    authenticationSensitive = false,
  ): Promise<HttpRateLimitResult> {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0 || normalizedKey.length > 512) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Rate-limit key must contain between 1 and 512 characters.',
        400,
      );
    }

    const result = await this.store.consume({
      key: normalizedKey,
      limit: authenticationSensitive
        ? this.policy.authenticationRateLimitMaximumRequests
        : this.policy.rateLimitMaximumRequests,
      windowMilliseconds: this.policy.rateLimitWindowMilliseconds,
      occurredAt: this.clock.now(),
    });

    if (!result.allowed) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_RATE_LIMITED',
        'Too many requests. Try again later.',
        429,
        {
          retryAfterSeconds: result.retryAfterSeconds,
          resetAt: result.resetAt.toISOString(),
        },
      );
    }
    return result;
  }
}
