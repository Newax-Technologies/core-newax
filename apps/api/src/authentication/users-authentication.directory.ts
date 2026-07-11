import { Inject, Injectable } from '@nestjs/common';
import type {
  AuthenticationAccountRecord,
  AuthenticationIdentityRecord,
  AuthenticationIdentityType,
  AuthenticationUserDirectory,
} from '@newax/auth';
import {
  UserAuthenticationGateway,
  UserModuleError,
  type AuthenticationUserRecord,
  type UserRecord,
} from '@newax/users';

@Injectable()
export class UsersAuthenticationDirectory
  implements AuthenticationUserDirectory
{
  constructor(
    @Inject(UserAuthenticationGateway)
    private readonly users: UserAuthenticationGateway,
  ) {}

  async activateInvitedUser(
    userId: string,
  ): Promise<AuthenticationAccountRecord> {
    return this.mapAccount(await this.users.activateInvitedUser(userId));
  }

  async findAccountById(
    userId: string,
  ): Promise<AuthenticationAccountRecord | null> {
    const account = await this.users.findAccountById(userId);
    return account === null ? null : this.mapAccount(account);
  }

  async recordSuccessfulLogin(
    userId: string,
    occurredAt: Date,
  ): Promise<AuthenticationAccountRecord> {
    return this.mapAccount(
      await this.users.recordSuccessfulLogin(userId, occurredAt),
    );
  }

  async resolveIdentity(
    identityType: AuthenticationIdentityType,
    identityValue: string,
  ): Promise<AuthenticationIdentityRecord | null> {
    let identity: AuthenticationUserRecord | null;
    try {
      identity = await this.users.resolveIdentity(identityType, identityValue);
    } catch (error: unknown) {
      if (
        error instanceof UserModuleError &&
        error.code === 'USER_INVALID_INPUT'
      ) {
        return null;
      }
      throw error;
    }

    return identity === null
      ? null
      : {
          identityId: identity.identityId,
          identityType: identity.identityType,
          isVerified: identity.isVerified,
          account: {
            userId: identity.userId,
            personId: identity.personId,
            status: identity.userStatus,
            lockedUntil: identity.lockedUntil,
          },
        };
  }

  async setLockedUntil(
    userId: string,
    lockedUntil: Date | null,
  ): Promise<AuthenticationAccountRecord> {
    return this.mapAccount(
      await this.users.setLockedUntil(userId, lockedUntil),
    );
  }

  private mapAccount(record: UserRecord): AuthenticationAccountRecord {
    return {
      userId: record.id,
      personId: record.personId,
      status: record.status,
      lockedUntil: record.lockedUntil,
    };
  }
}
