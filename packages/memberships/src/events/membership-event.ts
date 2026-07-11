import type { MembershipRecord } from '../types/membership';

export type MembershipEventName =
  | 'membership.created'
  | 'membership.updated'
  | 'membership.removed';

export interface MembershipEvent {
  readonly name: MembershipEventName;
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly personId: string;
  readonly occurredAt: Date;
  readonly membership: MembershipRecord;
}

export interface MembershipEventPublisher {
  publish(event: MembershipEvent): Promise<void>;
}
