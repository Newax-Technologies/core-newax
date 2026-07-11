import type {
  AuthenticationAccountRecord,
  AuthenticationIdentityRecord,
  AuthenticationIdentityType,
} from '../types/authentication';

export interface AuthenticationUserDirectory {
  activateInvitedUser(userId: string): Promise<AuthenticationAccountRecord>;
  findAccountById(userId: string): Promise<AuthenticationAccountRecord | null>;
  recordSuccessfulLogin(
    userId: string,
    occurredAt: Date,
  ): Promise<AuthenticationAccountRecord>;
  resolveIdentity(
    identityType: AuthenticationIdentityType,
    identityValue: string,
  ): Promise<AuthenticationIdentityRecord | null>;
  setLockedUntil(
    userId: string,
    lockedUntil: Date | null,
  ): Promise<AuthenticationAccountRecord>;
}
