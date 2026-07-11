import type {
  CreateMembershipRecordInput,
  CreateMembershipResult,
  MembershipListQuery,
  MembershipPage,
  MembershipRecord,
  UpdateMembershipRecordInput,
} from '../types/membership';

export interface MembershipsRepository {
  create(input: CreateMembershipRecordInput): Promise<CreateMembershipResult>;
  findById(id: string): Promise<MembershipRecord | null>;
  list(organizationId: string, query: MembershipListQuery): Promise<MembershipPage>;
  remove(id: string, endedAt: Date): Promise<MembershipRecord>;
  update(id: string, input: UpdateMembershipRecordInput): Promise<MembershipRecord>;
}
