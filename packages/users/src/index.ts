export type { UsersRepository } from './database/users-repository';
export type { UserEvent, UserEventPublisher } from './events/user-event';
export {
  UserModuleError,
  type UserErrorCode,
} from './errors/user-module-error';
export {
  USER_PERMISSIONS,
  type UserPermission,
} from './permissions/user-permissions';
export { UserAuthenticationGateway } from './services/user-authentication-gateway';
export {
  UserIdentityNormalizer,
  type NormalizedUserIdentity,
} from './services/user-identity-normalizer';
export type { UserReferenceDirectory } from './services/user-reference-directory';
export { UsersService } from './services/users.service';
export type {
  AddUserIdentityInput,
  AddUserIdentityRecordInput,
  AddUserIdentityResult,
  AuthenticationUserRecord,
  CreateUserInput,
  CreateUserRecordInput,
  CreateUserResult,
  MutableUserStatus,
  RemoveUserIdentityResult,
  UserIdentityRecord,
  UserIdentityType,
  UserListQuery,
  UserPage,
  UserRecord,
  UserReferenceRecord,
  UserReferenceStatus,
  UserRequestContext,
  UserStatus,
} from './types/user';
