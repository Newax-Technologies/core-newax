import type {
  UserIdentityType,
  UserRecord,
} from '../types/user';

export type UserEvent =
  | {
      readonly name: 'user.created';
      readonly actorUserId: string;
      readonly organizationId: string;
      readonly occurredAt: Date;
      readonly user: UserRecord;
      readonly identityId: string;
      readonly identityType: UserIdentityType;
    }
  | {
      readonly name:
        | 'user.suspended'
        | 'user.disabled'
        | 'user.enabled'
        | 'user.archived';
      readonly actorUserId: string;
      readonly organizationId: null;
      readonly occurredAt: Date;
      readonly user: UserRecord;
    }
  | {
      readonly name:
        | 'user.identity_added'
        | 'user.identity_removed'
        | 'user.primary_identity_changed';
      readonly actorUserId: string;
      readonly organizationId: null;
      readonly occurredAt: Date;
      readonly userId: string;
      readonly identityId: string;
      readonly identityType?: UserIdentityType;
    };

export interface UserEventPublisher {
  publish(event: UserEvent): Promise<void>;
}
