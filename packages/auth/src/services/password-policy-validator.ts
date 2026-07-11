import { AuthenticationError } from '../errors/authentication-error';
import type { AuthenticationPolicy } from '../types/authentication';

export class PasswordPolicyValidator {
  constructor(private readonly policy: AuthenticationPolicy) {}

  validate(password: string): void {
    if (
      password.length < this.policy.passwordMinimumLength ||
      password.length > this.policy.passwordMaximumLength
    ) {
      throw new AuthenticationError(
        'AUTHENTICATION_PASSWORD_POLICY_FAILED',
        `Password length must be between ${String(
          this.policy.passwordMinimumLength,
        )} and ${String(this.policy.passwordMaximumLength)} characters.`,
      );
    }

    const hasLetter = /[A-Za-z]/u.test(password);
    const hasNumber = /\d/u.test(password);
    const hasSymbol = /[^A-Za-z\d\s]/u.test(password);

    if (!hasLetter || !hasNumber || !hasSymbol) {
      throw new AuthenticationError(
        'AUTHENTICATION_PASSWORD_POLICY_FAILED',
        'Password must include a letter, a number, and a symbol.',
      );
    }
  }
}
