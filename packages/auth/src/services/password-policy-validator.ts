import { AuthenticationError } from '../errors/authentication-error';
import type { AuthenticationPolicy } from '../types/authentication';

export class PasswordPolicyValidator {
  constructor(private readonly policy: AuthenticationPolicy) {}

  normalize(password: string): string {
    return password.normalize('NFC');
  }

  validate(password: string): string {
    const normalized = this.normalize(password);
    const characterCount = [...normalized].length;

    if (
      characterCount < this.policy.passwordMinimumLength ||
      characterCount > this.policy.passwordMaximumLength
    ) {
      throw new AuthenticationError(
        'AUTHENTICATION_PASSWORD_POLICY_FAILED',
        `Password length must be between ${String(
          this.policy.passwordMinimumLength,
        )} and ${String(this.policy.passwordMaximumLength)} characters.`,
      );
    }

    return normalized;
  }
}
