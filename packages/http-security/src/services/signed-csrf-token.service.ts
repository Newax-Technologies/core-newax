import { HttpSecurityError } from '../errors/http-security-error';
import type { HttpSecurityCrypto } from './http-security-ports';
import type {
  CsrfValidationInput,
  IssuedCsrfToken,
} from '../types/http-security';

const TOKEN_DOMAIN = 'newax-http-csrf-v1';
const TOKEN_PART_PATTERN = /^[A-Za-z0-9_-]+$/u;

export class SignedCsrfTokenService {
  constructor(private readonly crypto: HttpSecurityCrypto) {}

  issue(sessionId: string): IssuedCsrfToken {
    const normalizedSessionId = this.requireSessionId(sessionId);
    const randomValue = this.crypto.issueRandomValue(32);
    const signature = this.crypto.sign(
      TOKEN_DOMAIN,
      this.message(normalizedSessionId, randomValue),
    );
    const token = `${randomValue}.${signature}`;
    return { token, cookieValue: token };
  }

  verify(input: CsrfValidationInput): void {
    const sessionId = this.requireSessionId(input.sessionId);
    if (
      input.cookieToken === null ||
      input.headerToken === null ||
      !this.crypto.equals(input.cookieToken, input.headerToken)
    ) {
      throw this.rejected();
    }

    const parts = input.headerToken.split('.');
    if (parts.length !== 2) {
      throw this.rejected();
    }
    const [randomValue, providedSignature] = parts;
    if (
      randomValue === undefined ||
      providedSignature === undefined ||
      randomValue.length < 32 ||
      providedSignature.length !== 64 ||
      !TOKEN_PART_PATTERN.test(randomValue) ||
      !TOKEN_PART_PATTERN.test(providedSignature)
    ) {
      throw this.rejected();
    }

    const expectedSignature = this.crypto.sign(
      TOKEN_DOMAIN,
      this.message(sessionId, randomValue),
    );
    if (!this.crypto.equals(providedSignature, expectedSignature)) {
      throw this.rejected();
    }
  }

  private message(sessionId: string, randomValue: string): string {
    return `${String(sessionId.length)}!${sessionId}!${String(
      randomValue.length,
    )}!${randomValue}`;
  }

  private requireSessionId(sessionId: string): string {
    const normalized = sessionId.trim();
    if (normalized.length === 0 || normalized.length > 128) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'sessionId must contain between 1 and 128 characters.',
        400,
      );
    }
    return normalized;
  }

  private rejected(): HttpSecurityError {
    return new HttpSecurityError(
      'HTTP_SECURITY_CSRF_REJECTED',
      'The request could not be verified.',
      403,
    );
  }
}
