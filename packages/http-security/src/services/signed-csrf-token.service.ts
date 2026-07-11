import { HttpSecurityError } from '../errors/http-security-error';
import type {
  CsrfValidationInput,
  IssuedCsrfToken,
} from '../types/http-security';
import type { HttpSecurityCrypto } from './http-security-ports';

const TOKEN_DOMAIN = 'newax-http-csrf-v1';
const TOKEN_PART_PATTERN = /^[A-Za-z0-9_-]+$/u;
const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const MAX_TOKEN_LENGTH = 256;

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
      input.cookieToken.length > MAX_TOKEN_LENGTH ||
      input.headerToken.length > MAX_TOKEN_LENGTH ||
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
    const normalized = sessionId.trim().toLowerCase();
    if (!SESSION_ID_PATTERN.test(normalized)) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'sessionId must be a valid UUID.',
        500,
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
