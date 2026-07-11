import { UserModuleError } from '../errors/user-module-error';
import type { UserIdentityType } from '../types/user';

export interface NormalizedUserIdentity {
  readonly identityType: UserIdentityType;
  readonly identityValue: string;
  readonly normalizedValue: string;
}

export class UserIdentityNormalizer {
  normalize(identityType: UserIdentityType, identityValue: string): NormalizedUserIdentity {
    const value = identityValue.trim();

    if (value.length === 0 || value.length > 320) {
      throw new UserModuleError(
        'USER_INVALID_INPUT',
        'identityValue must contain between 1 and 320 characters.',
        { field: 'identityValue' },
      );
    }

    if (identityType === 'email') {
      const normalizedValue = value.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
        throw new UserModuleError('USER_INVALID_INPUT', 'A valid email identity is required.', {
          field: 'identityValue',
        });
      }
      return { identityType, identityValue: value, normalizedValue };
    }

    if (identityType === 'username') {
      const normalizedValue = value.toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalizedValue)) {
        throw new UserModuleError(
          'USER_INVALID_INPUT',
          'Username identities must contain 3 to 64 supported characters.',
          { field: 'identityValue' },
        );
      }
      return { identityType, identityValue: value, normalizedValue };
    }

    const normalizedValue = value.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedValue)) {
      throw new UserModuleError('USER_INVALID_INPUT', 'Phone identities must use E.164 format.', {
        field: 'identityValue',
      });
    }

    return {
      identityType,
      identityValue: normalizedValue,
      normalizedValue,
    };
  }
}
