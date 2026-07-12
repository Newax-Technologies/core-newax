import type { AuthenticationPolicy } from '../types/authentication';

export const DEFAULT_AUTHENTICATION_POLICY: AuthenticationPolicy = {
  passwordMinimumLength: 15,
  passwordMaximumLength: 128,
  sessionTtlMinutes: 480,
  failedAttemptWindowMinutes: 15,
  maximumFailedAttempts: 5,
  accountLockMinutes: 15,
  sessionTouchIntervalMinutes: 5,
};

export function validateAuthenticationPolicy(policy: AuthenticationPolicy): AuthenticationPolicy {
  const positiveIntegers: ReadonlyArray<readonly [keyof AuthenticationPolicy, number]> = [
    ['passwordMinimumLength', policy.passwordMinimumLength],
    ['passwordMaximumLength', policy.passwordMaximumLength],
    ['sessionTtlMinutes', policy.sessionTtlMinutes],
    ['failedAttemptWindowMinutes', policy.failedAttemptWindowMinutes],
    ['maximumFailedAttempts', policy.maximumFailedAttempts],
    ['accountLockMinutes', policy.accountLockMinutes],
    ['sessionTouchIntervalMinutes', policy.sessionTouchIntervalMinutes],
  ];

  for (const [name, value] of positiveIntegers) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${name} must be a positive integer.`);
    }
  }

  if (policy.passwordMaximumLength < policy.passwordMinimumLength) {
    throw new Error(
      'passwordMaximumLength must be greater than or equal to passwordMinimumLength.',
    );
  }

  return { ...policy };
}
