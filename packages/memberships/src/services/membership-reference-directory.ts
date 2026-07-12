import type { MembershipReferenceRecord } from '../types/membership';

export interface MembershipReferenceDirectory {
  findOrganizationById(id: string): Promise<MembershipReferenceRecord | null>;
  findPersonById(id: string): Promise<MembershipReferenceRecord | null>;
}
