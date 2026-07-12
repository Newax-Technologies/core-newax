export type MembershipStatus = 'active' | 'suspended' | 'ended';
export type MutableMembershipStatus = Exclude<MembershipStatus, 'ended'>;
export type MembershipReferenceStatus = 'active' | 'suspended' | 'archived';

export interface MembershipRecord {
  readonly id: string;
  readonly personId: string;
  readonly organizationId: string;
  readonly membershipType: string;
  readonly referenceNumber: string | null;
  readonly jobTitle: string | null;
  readonly status: MembershipStatus;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MembershipRequestContext {
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly permissionCodes: ReadonlySet<string>;
}

export interface CreateMembershipInput {
  readonly personId: string;
  readonly membershipType: string;
  readonly referenceNumber?: string | null;
  readonly jobTitle?: string | null;
  readonly startDate?: Date | null;
}

export interface UpdateMembershipInput {
  readonly referenceNumber?: string | null;
  readonly jobTitle?: string | null;
  readonly startDate?: Date | null;
  readonly status?: MutableMembershipStatus;
}

export interface MembershipListQuery {
  readonly personId?: string;
  readonly membershipType?: string;
  readonly status?: MembershipStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface MembershipPage {
  readonly items: readonly MembershipRecord[];
  readonly nextCursor: string | null;
}

export interface CreateMembershipRecordInput {
  readonly personId: string;
  readonly organizationId: string;
  readonly membershipType: string;
  readonly referenceNumber: string | null;
  readonly jobTitle: string | null;
  readonly startDate: Date;
}

export interface UpdateMembershipRecordInput {
  readonly referenceNumber?: string | null;
  readonly jobTitle?: string | null;
  readonly startDate?: Date;
  readonly status?: MutableMembershipStatus;
}

export type CreateMembershipResult =
  | {
      readonly status: 'created';
      readonly membership: MembershipRecord;
    }
  | {
      readonly status: 'conflict';
      readonly existingMembershipId: string;
    };

export interface MembershipReferenceRecord {
  readonly id: string;
  readonly status: MembershipReferenceStatus;
}
