import type {
  AssignMembershipRoleRecordInput,
  AssignMembershipRoleResult,
  AssignmentListQuery,
  AssignmentPage,
  CreateRoleFromTemplateRecordInput,
  CreateRoleRecordInput,
  CreateRoleResult,
  MembershipRoleAssignmentRecord,
  PermissionEvaluation,
  PermissionListQuery,
  PermissionPage,
  PermissionRecord,
  PermissionRegistrationResult,
  RegisterPermissionRecordInput,
  RoleListQuery,
  RolePage,
  RolePermissionRecord,
  RoleRecord,
  UpdateRoleRecordInput,
} from '../types/access-control';

export interface AccessControlRepository {
  archiveRole(id: string): Promise<RoleRecord>;
  assignMembershipRole(
    input: AssignMembershipRoleRecordInput,
  ): Promise<AssignMembershipRoleResult>;
  createRole(input: CreateRoleRecordInput): Promise<CreateRoleResult>;
  createRoleFromTemplate(
    input: CreateRoleFromTemplateRecordInput,
  ): Promise<CreateRoleResult>;
  evaluateMembershipPermissions(
    membershipId: string,
    organizationId: string,
    evaluatedAt: Date,
  ): Promise<PermissionEvaluation>;
  findAssignmentById(id: string): Promise<MembershipRoleAssignmentRecord | null>;
  findPermissionById(id: string): Promise<PermissionRecord | null>;
  findRoleById(id: string): Promise<RoleRecord | null>;
  listAssignments(
    organizationId: string,
    query: AssignmentListQuery,
  ): Promise<AssignmentPage>;
  listPermissions(query: PermissionListQuery): Promise<PermissionPage>;
  listRolePermissions(roleId: string): Promise<readonly RolePermissionRecord[]>;
  listRoles(organizationId: string | null, query: RoleListQuery): Promise<RolePage>;
  registerPermission(
    input: RegisterPermissionRecordInput,
  ): Promise<PermissionRegistrationResult>;
  removeRolePermission(roleId: string, permissionId: string): Promise<boolean>;
  revokeAssignment(
    id: string,
    revokedByUserId: string,
    revokedAt: Date,
  ): Promise<MembershipRoleAssignmentRecord>;
  setRolePermission(
    roleId: string,
    permissionId: string,
    effect: 'allow' | 'deny',
    createdByUserId: string,
  ): Promise<RolePermissionRecord>;
  updateRole(id: string, input: UpdateRoleRecordInput): Promise<RoleRecord>;
}
