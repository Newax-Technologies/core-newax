import type { UsersRepository } from '../database/users-repository';
import { UserModuleError } from '../errors/user-module-error';
import type { AuthenticationUserRecord, UserIdentityType, UserRecord } from '../types/user';
import { UserIdentityNormalizer } from './user-identity-normalizer';

export class UserAuthenticationGateway {
  constructor(
    private readonly repository: UsersRepository,
    private readonly identityNormalizer: UserIdentityNormalizer,
  ) {}

  async resolveIdentity(
    identityType: UserIdentityType,
    identityValue: string,
  ): Promise<AuthenticationUserRecord | null> {
    const identity = this.identityNormalizer.normalize(identityType, identityValue);
    return this.repository.findByNormalizedIdentity(
      identity.identityType,
      identity.normalizedValue,
    );
  }

  async activateInvitedUser(userId: string): Promise<UserRecord> {
    const user = await this.requireUser(userId);
    if (user.status === 'active') {
      return user;
    }
    if (user.status !== 'invited') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Only invited user accounts may be activated by authentication.',
        { status: user.status },
      );
    }
    return this.repository.setStatus(user.id, 'active');
  }

  async recordSuccessfulLogin(userId: string, occurredAt: Date): Promise<UserRecord> {
    const user = await this.requireUser(userId);
    if (user.status !== 'active') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Only active user accounts may record successful login.',
        { status: user.status },
      );
    }
    const updated = await this.repository.recordSuccessfulLogin(
      user.id,
      this.requireDate(occurredAt, 'occurredAt'),
    );
    if (updated === null) {
      throw new UserModuleError('USER_ACCOUNT_NOT_FOUND', 'The user account no longer exists.');
    }
    return updated;
  }

  async setLockedUntil(userId: string, lockedUntil: Date | null): Promise<UserRecord> {
    const user = await this.requireUser(userId);
    if (user.status === 'archived') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Archived user accounts cannot be locked or unlocked.',
      );
    }
    const updated = await this.repository.setLockedUntil(
      user.id,
      lockedUntil === null ? null : this.requireDate(lockedUntil, 'lockedUntil'),
    );
    if (updated === null) {
      throw new UserModuleError('USER_ACCOUNT_NOT_FOUND', 'The user account no longer exists.');
    }
    return updated;
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const normalized = userId.trim();
    if (normalized.length === 0) {
      throw new UserModuleError('USER_INVALID_INPUT', 'userId is required.');
    }
    const user = await this.repository.findById(normalized);
    if (user === null) {
      throw new UserModuleError('USER_ACCOUNT_NOT_FOUND', 'The user account does not exist.');
    }
    return user;
  }

  private requireDate(value: Date, field: string): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new UserModuleError('USER_INVALID_INPUT', `${field} must be a valid date.`, { field });
    }
    return new Date(value.getTime());
  }
}
