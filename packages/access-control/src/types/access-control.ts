export type RoleType = 'system' | 'template' | 'organization';
export type RoleStatus = 'active' | 'archived';
export type PermissionStatus = 'active' | 'archived';
export type PermissionEffect = 'allow' | 'deny';
export type PermissionRegistrationStatus = 'registered' | 'updated';
export type AccessReferenceStatus = 'active' | 'suspended' | 'archived' | 'ended';

export interface AccessControlRequestContext {
  readonly actorUserId: string;
  readonly organizationId: string | null;
  readonly permissionCodes: ReadonlySet<string>;
}

export interface RoleRecord {
  readonly id: string;
  readonly organizationId: string | null;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly roleType: RoleType;
  readonly status: RoleStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PermissionRecord {
  readonly id: string;
  readonly code: string;
  readonly moduleCode: string;
  readonly resource: string;
  readonly action: string;
  readonly riskLevel: string;
  readonly description: string | null;
  readonly status: PermissionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface RolePermissionRecord {
  readonly roleId: string;
  readonly permissionId: string;
  readonly effect: PermissionEffect;
  readonly createdByUserId: string | null;
  readonly createdAt: Date;
}

export interface MembershipRoleAssignmentRecord {
  readonly id: string;
  readonly membershipId: string;
  readonly roleId: string;
  readonly assignedByUserId: string | null;
  readonly revokedByUserId: string | null;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface CreateRoleInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
}

export interface CreateRoleFromTemplateInput {
  readonly templateRoleId: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
}

export interface UpdateRoleInput {
  readonly name?: string;
  readonly description?: string | null;
}

export interface RegisterPermissionInput {
  readonly moduleCode: string;
  readonly resource: string;
  readonly action: string;
  readonly riskLevel?: string;
  readonly description?: string | null;
}

export interface SetRolePermissionInput {
  readonly permissionId: string;
  readonly effect?: PermissionEffect;
}

export interface AssignMembershipRoleInput {
  readonly membershipId: string;
  readonly roleId: string;
  readonly validFrom?: Date;
  readonly validUntil?: Date | null;
}

export interface RoleListQuery {
  readonly roleType?: RoleType;
  readonly status?: RoleStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface PermissionListQuery {
  readonly moduleCode?: string;
  readonly status?: PermissionStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface AssignmentListQuery {
  readonly membershipId?: string;
  readonly roleId?: string;
  readonly includeRevoked?: boolean;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface RolePage {
  readonly items: readonly RoleRecord[];
  readonly nextCursor: string | null;
}

export interface PermissionPage {
  readonly items: readonly PermissionRecord[];
  readonly nextCursor: string | null;
}

export interface AssignmentPage {
  readonly items: readonly MembershipRoleAssignmentRecord[];
  readonly nextCursor: string | null;
}

export interface PermissionRegistrationResult {
  readonly status: PermissionRegistrationStatus;
  readonly permission: PermissionRecord;
}

export interface PermissionEvaluation {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly evaluatedAt: Date;
  readonly allowedPermissionCodes: readonly string[];
  readonly deniedPermissionCodes: readonly string[];
  readonly effectivePermissionCodes: readonly string[];
}

export interface AccessReferenceRecord {
  readonly id: string;
  readonly organizationId: string | null;
  readonly status: AccessReferenceStatus;
}

export interface CreateRoleRecordInput {
  readonly organizationId: string | null;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly roleType: RoleType;
}

export interface CreateRoleFromTemplateRecordInput extends CreateRoleRecordInput {
  readonly templateRoleId: string;
}

export interface UpdateRoleRecordInput {
  readonly name?: string;
  readonly description?: string | null;
}

export interface RegisterPermissionRecordInput {
  readonly code: string;
  readonly moduleCode: string;
  readonly resource: string;
  readonly action: string;
  readonly riskLevel: string;
  readonly description: string | null;
}

export interface AssignMembershipRoleRecordInput {
  readonly membershipId: string;
  readonly roleId: string;
  readonly assignedByUserId: string;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
}

export type CreateRoleResult =
  | { readonly status: 'created'; readonly role: RoleRecord }
  | { readonly status: 'conflict'; readonly existingRoleId: string };

export type AssignMembershipRoleResult =
  | {
      readonly status: 'assigned';
      readonly assignment: MembershipRoleAssignmentRecord;
    }
  | {
      readonly status: 'conflict';
      readonly existingAssignmentId: string;
    };
