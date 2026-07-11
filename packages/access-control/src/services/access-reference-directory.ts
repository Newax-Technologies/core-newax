import type { AccessReferenceRecord } from '../types/access-control';

export interface AccessReferenceDirectory {
  findMembershipById(id: string): Promise<AccessReferenceRecord | null>;
  findOrganizationById(id: string): Promise<AccessReferenceRecord | null>;
}
