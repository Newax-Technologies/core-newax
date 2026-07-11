import type { UserReferenceRecord } from '../types/user';

export interface UserReferenceDirectory {
  findMembership(
    personId: string,
    organizationId: string,
  ): Promise<UserReferenceRecord | null>;
  findOrganizationById(
    organizationId: string,
  ): Promise<UserReferenceRecord | null>;
  findPersonById(personId: string): Promise<UserReferenceRecord | null>;
}
