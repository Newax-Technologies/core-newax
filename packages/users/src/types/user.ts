export type UserStatus =
  | 'invited'
  | 'active'
  | 'suspended'
  | 'disabled'
  | 'archived';

export type MutableUserStatus = Exclude<UserStatus, 'archived'>;
export type UserIdentityType = 'email' | 'username' | 'phone';
export type UserReferenceStatus =
  | 'active'
  | 'suspended'
  | 'disabled'
  | 'archived'
  | 'ended';

export interface UserRequestContext {
  readonly actorUserId: string;
  readonly organizationId: string | null;
  readonly permissionCodes: ReadonlySet<string>;
}

export interface UserRecord {
  readonly id: string;
  readonly personId: string;
  readonly status: UserStatus;
  readonly lastLoginAt: Date | null;
  readonly lockedUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UserIdentityRecord {
  readonly id: string;
  readonly userId: string;
  readonly identityType: UserIdentityType;
  readonly identityValue: string;
  readonly normalizedValue: string;
  readonly isPrimary: boolean;
  readonly isVerified: boolean;
  readonly verifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UserReferenceRecord {
  readonly id: string;
  readonly personId: string | null;
  readonly organizationId: string | null;
  readonly status: UserReferenceStatus;
}

export interface CreateUserInput {
  readonly personId: string;
  readonly primaryIdentity: {
    readonly identityType: UserIdentityType;
    readonly identityValue: string;
  };
}

export interface AddUserIdentityInput {
  readonly identityType: UserIdentityType;
  readonly identityValue: string;
  readonly makePrimary?: boolean;
}

export interface UserListQuery {
  readonly status?: UserStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface UserPage {
  readonly items: readonly UserRecord[];
  readonly nextCursor: string | null;
}

export interface CreateUserRecordInput {
  readonly personId: string;
  readonly identityType: UserIdentityType;
  readonly identityValue: string;
  readonly normalizedValue: string;
}

export interface AddUserIdentityRecordInput {
  readonly userId: string;
  readonly identityType: UserIdentityType;
  readonly identityValue: string;
  readonly normalizedValue: string;
  readonly makePrimary: boolean;
}

export type CreateUserResult =
  | {
      readonly status: 'created';
      readonly user: UserRecord;
      readonly identity: UserIdentityRecord;
    }
  | {
      readonly status: 'person_conflict';
      readonly existingUserId: string;
    }
  | {
      readonly status: 'identity_conflict';
    };

export type AddUserIdentityResult =
  | {
      readonly status: 'created';
      readonly identity: UserIdentityRecord;
    }
  | {
      readonly status: 'identity_conflict';
    };

export type RemoveUserIdentityResult =
  | {
      readonly status: 'removed';
      readonly removedIdentityId: string;
      readonly newPrimaryIdentityId: string | null;
    }
  | {
      readonly status: 'not_found';
    }
  | {
      readonly status: 'last_identity';
    };

export interface AuthenticationUserRecord {
  readonly userId: string;
  readonly personId: string;
  readonly userStatus: UserStatus;
  readonly lockedUntil: Date | null;
  readonly identityId: string;
  readonly identityType: UserIdentityType;
  readonly isVerified: boolean;
}
