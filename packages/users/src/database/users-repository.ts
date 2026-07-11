import type {
  AddUserIdentityRecordInput,
  AddUserIdentityResult,
  AuthenticationUserRecord,
  CreateUserRecordInput,
  CreateUserResult,
  RemoveUserIdentityResult,
  UserIdentityRecord,
  UserIdentityType,
  UserListQuery,
  UserPage,
  UserRecord,
  UserStatus,
} from '../types/user';

export interface UsersRepository {
  addIdentity(input: AddUserIdentityRecordInput): Promise<AddUserIdentityResult>;
  create(input: CreateUserRecordInput): Promise<CreateUserResult>;
  findById(id: string): Promise<UserRecord | null>;
  findByNormalizedIdentity(
    identityType: UserIdentityType,
    normalizedValue: string,
  ): Promise<AuthenticationUserRecord | null>;
  list(organizationId: string, query: UserListQuery): Promise<UserPage>;
  listIdentities(userId: string): Promise<readonly UserIdentityRecord[]>;
  recordSuccessfulLogin(userId: string, occurredAt: Date): Promise<UserRecord | null>;
  removeIdentity(userId: string, identityId: string): Promise<RemoveUserIdentityResult>;
  setLockedUntil(userId: string, lockedUntil: Date | null): Promise<UserRecord | null>;
  setPrimaryIdentity(userId: string, identityId: string): Promise<UserIdentityRecord | null>;
  setStatus(id: string, status: UserStatus): Promise<UserRecord>;
}
