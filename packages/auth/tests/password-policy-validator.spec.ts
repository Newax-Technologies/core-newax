import { describe, expect, it } from 'vitest';

import { PasswordPolicyValidator } from '../src/services/password-policy-validator';
import type { AuthenticationPolicy } from '../src/types/authentication';

const policy: AuthenticationPolicy = {
  passwordMinimumLength: 15,
  passwordMaximumLength: 128,
  sessionTtlMinutes: 480,
  failedAttemptWindowMinutes: 15,
  maximumFailedAttempts: 5,
  accountLockMinutes: 15,
  sessionTouchIntervalMinutes: 5,
};

describe('PasswordPolicyValidator', () => {
  it('accepts long passwords without forced character-type mixtures', () => {
    const validator = new PasswordPolicyValidator(policy);
    expect(validator.validate('a long memorable phrase')).toBe(
      'a long memorable phrase',
    );
  });

  it('normalizes Unicode passwords with NFC before hashing', () => {
    const validator = new PasswordPolicyValidator(policy);
    const decomposed = `Cafe\u0301 has a long phrase`;
    expect(validator.validate(decomposed)).toBe(
      'Café has a long phrase',
    );
  });

  it('counts Unicode code points and rejects passwords below the minimum', () => {
    const validator = new PasswordPolicyValidator(policy);
    expect(() => validator.validate('short-password')).toThrow(
      'Password length must be between 15 and 128 characters.',
    );
  });
});
