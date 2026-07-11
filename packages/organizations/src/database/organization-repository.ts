import type {
  CreateOrganizationRecordInput,
  OrganizationListQuery,
  OrganizationPage,
  OrganizationRecord,
  UpdateOrganizationRecordInput,
} from '../types/organization';

export interface OrganizationRepository {
  archive(id: string, archivedAt: Date): Promise<OrganizationRecord>;
  create(input: CreateOrganizationRecordInput): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  hasActiveChildren(id: string): Promise<boolean>;
  list(query: OrganizationListQuery): Promise<OrganizationPage>;
  update(id: string, input: UpdateOrganizationRecordInput): Promise<OrganizationRecord>;
  wouldCreateCycle(organizationId: string, candidateParentId: string): Promise<boolean>;
}
