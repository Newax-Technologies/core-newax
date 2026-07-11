import type { AccessControlRepository } from '../database/access-control-repository';
import type { AccessControlEventPublisher } from '../events/access-control-event';
import { AccessControlError } from '../errors/access-control-error';
import {
  ACCESS_CONTROL_PERMISSIONS,
  type AccessControlPermission,
} from '../permissions/access-control-permissions';
import type {
  AccessControlRequestContext,
  AssignMembershipRoleInput,
  AssignmentListQuery,
  AssignmentPage,
  CreateRoleFromTemplateInput,
  CreateRoleInput,
  MembershipRoleAssignmentRecord,
  PermissionListQuery,
  PermissionPage,
  PermissionRecord,
  RegisterPermissionInput,
  RoleListQuery,
  RolePage,
  RolePermissionRecord,
  RoleRecord,
  SetRolePermissionInput,
  UpdateRoleInput,
  UpdateRoleRecordInput,
} from '../types/access-control';
import type { AccessReferenceDirectory } from './access-reference-directory';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

export class AccessControlService {
  constructor(
    private readonly repository: AccessControlRepository,
    private readonly referenceDirectory: AccessReferenceDirectory,
    private readonly eventPublisher: AccessControlEventPublisher,
  ) {}

  async registerPermission(
    context: AccessControlRequestContext,
    input: RegisterPermissionInput,
  ): Promise<PermissionRecord> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.permissionsManage);

    const moduleCode = this.normalizeSegment(input.moduleCode, 'moduleCode');
    const resource = this.normalizeSegment(input.resource, 'resource');
    const action = this.normalizeSegment(input.action, 'action');
    const code =
      resource === moduleCode ? `${moduleCode}.${action}` : `${moduleCode}.${resource}.${action}`;

    const result = await this.repository.registerPermission({
      code,
      moduleCode,
      resource,
      action,
      riskLevel: this.normalizeRiskLevel(input.riskLevel),
      description: this.normalizeNullableText(input.description, 'description', 2000),
    });

    await this.eventPublisher.publish({
      name: result.status === 'registered' ? 'permission.registered' : 'permission.updated',
      actorUserId: context.actorUserId,
      occurredAt: new Date(),
      permission: result.permission,
    });

    return result.permission;
  }

  async listPermissions(
    context: AccessControlRequestContext,
    query: PermissionListQuery = {},
  ): Promise<PermissionPage> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.permissionsView);
    const normalized: Mutable<PermissionListQuery> = {
      limit: this.normalizeLimit(query.limit),
    };

    if (query.moduleCode !== undefined) {
      normalized.moduleCode = this.normalizeSegment(query.moduleCode, 'moduleCode');
    }
    if (query.status !== undefined) {
      normalized.status = query.status;
    }
    if (query.search !== undefined && query.search.trim().length > 0) {
      normalized.search = this.requireText(query.search, 'search', 255);
    }
    if (query.afterId !== undefined) {
      normalized.afterId = this.requireText(query.afterId, 'afterId', 128);
    }

    return this.repository.listPermissions(normalized);
  }

  async createRole(
    context: AccessControlRequestContext,
    input: CreateRoleInput,
  ): Promise<RoleRecord> {
    const organizationId = await this.requireActiveOrganization(
      context,
      ACCESS_CONTROL_PERMISSIONS.rolesCreate,
    );
    return this.createRoleRecord(context, {
      organizationId,
      code: this.normalizeRoleCode(input.code),
      name: this.requireText(input.name, 'name', 128),
      description: this.normalizeNullableText(input.description, 'description', 2000),
      roleType: 'organization',
    });
  }

  async createTemplate(
    context: AccessControlRequestContext,
    input: CreateRoleInput,
  ): Promise<RoleRecord> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.templatesManage);
    return this.createRoleRecord(context, {
      organizationId: null,
      code: this.normalizeRoleCode(input.code),
      name: this.requireText(input.name, 'name', 128),
      description: this.normalizeNullableText(input.description, 'description', 2000),
      roleType: 'template',
    });
  }

  async createRoleFromTemplate(
    context: AccessControlRequestContext,
    input: CreateRoleFromTemplateInput,
  ): Promise<RoleRecord> {
    const organizationId = await this.requireActiveOrganization(
      context,
      ACCESS_CONTROL_PERMISSIONS.rolesCreate,
    );
    const template = await this.repository.findRoleById(
      this.requireText(input.templateRoleId, 'templateRoleId', 128),
    );

    if (template === null || template.roleType !== 'template' || template.status !== 'active') {
      throw new AccessControlError(
        'ACCESS_TEMPLATE_NOT_FOUND',
        'The active role template does not exist.',
        { templateRoleId: input.templateRoleId },
      );
    }

    const result = await this.repository.createRoleFromTemplate({
      templateRoleId: template.id,
      organizationId,
      code: this.normalizeRoleCode(input.code),
      name: this.requireText(input.name, 'name', 128),
      description: this.normalizeNullableText(input.description, 'description', 2000),
      roleType: 'organization',
    });

    return this.finishRoleCreation(context, result, organizationId);
  }

  async getRoleById(context: AccessControlRequestContext, roleId: string): Promise<RoleRecord> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.rolesView);
    return this.requireVisibleRole(context, roleId);
  }

  async listRoles(
    context: AccessControlRequestContext,
    query: RoleListQuery = {},
  ): Promise<RolePage> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.rolesView);
    const normalized: Mutable<RoleListQuery> = {
      limit: this.normalizeLimit(query.limit),
    };
    if (query.roleType !== undefined) normalized.roleType = query.roleType;
    if (query.status !== undefined) normalized.status = query.status;
    if (query.search !== undefined && query.search.trim().length > 0) {
      normalized.search = this.requireText(query.search, 'search', 255);
    }
    if (query.afterId !== undefined) {
      normalized.afterId = this.requireText(query.afterId, 'afterId', 128);
    }

    return this.repository.listRoles(this.requireOrganizationId(context), normalized);
  }

  async updateRole(
    context: AccessControlRequestContext,
    roleId: string,
    input: UpdateRoleInput,
  ): Promise<RoleRecord> {
    const role = await this.requireManageableRole(
      context,
      roleId,
      ACCESS_CONTROL_PERMISSIONS.rolesUpdate,
    );
    const update: Mutable<UpdateRoleRecordInput> = {};
    if (input.name !== undefined) update.name = this.requireText(input.name, 'name', 128);
    if ('description' in input) {
      update.description = this.normalizeNullableText(input.description, 'description', 2000);
    }
    if (Object.keys(update).length === 0) {
      throw new AccessControlError('ACCESS_INVALID_INPUT', 'At least one role field is required.');
    }

    const updated = await this.repository.updateRole(role.id, update);
    await this.publishRole('role.updated', context.actorUserId, updated);
    return updated;
  }

  async archiveRole(context: AccessControlRequestContext, roleId: string): Promise<RoleRecord> {
    const role = await this.requireManageableRole(
      context,
      roleId,
      ACCESS_CONTROL_PERMISSIONS.rolesArchive,
    );
    if (role.status === 'archived') return role;
    const archived = await this.repository.archiveRole(role.id);
    await this.publishRole('role.archived', context.actorUserId, archived);
    return archived;
  }

  async setRolePermission(
    context: AccessControlRequestContext,
    roleId: string,
    input: SetRolePermissionInput,
  ): Promise<RolePermissionRecord> {
    const role = await this.requirePermissionManageableRole(context, roleId);
    const permission = await this.repository.findPermissionById(
      this.requireText(input.permissionId, 'permissionId', 128),
    );
    if (permission === null || permission.status !== 'active') {
      throw new AccessControlError(
        'ACCESS_PERMISSION_NOT_FOUND',
        'The active permission does not exist.',
      );
    }

    const assignment = await this.repository.setRolePermission(
      role.id,
      permission.id,
      input.effect ?? 'allow',
      context.actorUserId,
    );
    await this.publishRolePermission(context, role, permission.id, assignment);
    return assignment;
  }

  async removeRolePermission(
    context: AccessControlRequestContext,
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const role = await this.requirePermissionManageableRole(context, roleId);
    const normalizedPermissionId = this.requireText(permissionId, 'permissionId', 128);
    await this.repository.removeRolePermission(role.id, normalizedPermissionId);
    await this.publishRolePermission(context, role, normalizedPermissionId, null);
  }

  async listRolePermissions(
    context: AccessControlRequestContext,
    roleId: string,
  ): Promise<readonly RolePermissionRecord[]> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.rolesView);
    const role = await this.requireVisibleRole(context, roleId);
    return this.repository.listRolePermissions(role.id);
  }

  async assignRole(
    context: AccessControlRequestContext,
    input: AssignMembershipRoleInput,
  ): Promise<MembershipRoleAssignmentRecord> {
    const organizationId = await this.requireActiveOrganization(
      context,
      ACCESS_CONTROL_PERMISSIONS.assignmentsManage,
    );
    const membership = await this.requireActiveMembership(input.membershipId, organizationId);
    const role = await this.requireOrganizationRole(input.roleId, organizationId);
    const validFrom = this.normalizeDate(input.validFrom ?? new Date(), 'validFrom');
    const validUntil =
      input.validUntil == null ? null : this.normalizeDate(input.validUntil, 'validUntil');
    if (validUntil !== null && validUntil <= validFrom) {
      throw new AccessControlError(
        'ACCESS_INVALID_INPUT',
        'validUntil must be later than validFrom.',
        { field: 'validUntil' },
      );
    }

    const result = await this.repository.assignMembershipRole({
      membershipId: membership.id,
      roleId: role.id,
      assignedByUserId: context.actorUserId,
      validFrom,
      validUntil,
    });
    if (result.status === 'conflict') {
      throw new AccessControlError(
        'ACCESS_ASSIGNMENT_CONFLICT',
        'An effective or scheduled assignment already exists for this membership and role.',
        { existingAssignmentId: result.existingAssignmentId },
      );
    }

    await this.eventPublisher.publish({
      name: 'role.assigned',
      actorUserId: context.actorUserId,
      organizationId,
      occurredAt: new Date(),
      assignment: result.assignment,
    });
    return result.assignment;
  }

  async revokeRole(
    context: AccessControlRequestContext,
    assignmentId: string,
  ): Promise<MembershipRoleAssignmentRecord> {
    const organizationId = await this.requireActiveOrganization(
      context,
      ACCESS_CONTROL_PERMISSIONS.assignmentsManage,
    );
    const assignment = await this.repository.findAssignmentById(
      this.requireText(assignmentId, 'assignmentId', 128),
    );
    if (assignment === null) {
      throw new AccessControlError(
        'ACCESS_ASSIGNMENT_NOT_FOUND',
        'The role assignment does not exist.',
      );
    }
    await this.requireScopedMembership(assignment.membershipId, organizationId);
    if (assignment.revokedAt !== null) return assignment;

    const revoked = await this.repository.revokeAssignment(
      assignment.id,
      context.actorUserId,
      new Date(),
    );
    await this.eventPublisher.publish({
      name: 'role.removed',
      actorUserId: context.actorUserId,
      organizationId,
      occurredAt: new Date(),
      assignment: revoked,
    });
    return revoked;
  }

  async listAssignments(
    context: AccessControlRequestContext,
    query: AssignmentListQuery = {},
  ): Promise<AssignmentPage> {
    this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.assignmentsView);
    const organizationId = this.requireOrganizationId(context);
    const normalized: Mutable<AssignmentListQuery> = {
      limit: this.normalizeLimit(query.limit),
    };
    if (query.membershipId !== undefined) {
      normalized.membershipId = this.requireText(query.membershipId, 'membershipId', 128);
    }
    if (query.roleId !== undefined) {
      normalized.roleId = this.requireText(query.roleId, 'roleId', 128);
    }
    if (query.includeRevoked !== undefined) normalized.includeRevoked = query.includeRevoked;
    if (query.afterId !== undefined) {
      normalized.afterId = this.requireText(query.afterId, 'afterId', 128);
    }
    return this.repository.listAssignments(organizationId, normalized);
  }

  private async createRoleRecord(
    context: AccessControlRequestContext,
    input: Parameters<AccessControlRepository['createRole']>[0],
  ): Promise<RoleRecord> {
    const result = await this.repository.createRole(input);
    return this.finishRoleCreation(context, result, input.organizationId);
  }

  private async finishRoleCreation(
    context: AccessControlRequestContext,
    result: Awaited<ReturnType<AccessControlRepository['createRole']>>,
    organizationId: string | null,
  ): Promise<RoleRecord> {
    if (result.status === 'conflict') {
      throw new AccessControlError(
        'ACCESS_ROLE_CONFLICT',
        'A role with this code already exists.',
        {
          existingRoleId: result.existingRoleId,
          organizationId,
        },
      );
    }
    await this.publishRole('role.created', context.actorUserId, result.role);
    return result.role;
  }

  private async requireManageableRole(
    context: AccessControlRequestContext,
    roleId: string,
    permission: AccessControlPermission,
  ): Promise<RoleRecord> {
    const role = await this.requireVisibleRole(context, roleId);
    if (role.roleType === 'system') {
      throw new AccessControlError('ACCESS_ROLE_UNAVAILABLE', 'System roles are immutable.');
    }
    if (role.roleType === 'template') {
      this.requirePermission(context, ACCESS_CONTROL_PERMISSIONS.templatesManage);
    } else {
      this.requirePermission(context, permission);
    }
    return role;
  }

  private async requirePermissionManageableRole(
    context: AccessControlRequestContext,
    roleId: string,
  ): Promise<RoleRecord> {
    const role = await this.requireVisibleRole(context, roleId);
    if (role.status !== 'active' || role.roleType === 'system') {
      throw new AccessControlError('ACCESS_ROLE_UNAVAILABLE', 'The role cannot be changed.');
    }
    this.requirePermission(
      context,
      role.roleType === 'template'
        ? ACCESS_CONTROL_PERMISSIONS.templatesManage
        : ACCESS_CONTROL_PERMISSIONS.rolePermissionsManage,
    );
    return role;
  }

  private async requireVisibleRole(
    context: AccessControlRequestContext,
    roleId: string,
  ): Promise<RoleRecord> {
    const role = await this.repository.findRoleById(this.requireText(roleId, 'roleId', 128));
    const organizationId =
      context.organizationId === null
        ? null
        : this.requireText(context.organizationId, 'organizationId', 128);
    if (
      role === null ||
      (role.roleType === 'organization' &&
        (organizationId === null || role.organizationId !== organizationId))
    ) {
      throw new AccessControlError(
        'ACCESS_ROLE_NOT_FOUND',
        'The role does not exist in this context.',
      );
    }
    return role;
  }

  private async requireOrganizationRole(
    roleId: string,
    organizationId: string,
  ): Promise<RoleRecord> {
    const role = await this.repository.findRoleById(this.requireText(roleId, 'roleId', 128));
    if (
      role === null ||
      role.roleType !== 'organization' ||
      role.organizationId !== organizationId
    ) {
      throw new AccessControlError(
        'ACCESS_ROLE_NOT_FOUND',
        'The organization role does not exist.',
      );
    }
    if (role.status !== 'active') {
      throw new AccessControlError('ACCESS_ROLE_UNAVAILABLE', 'The role is archived.');
    }
    return role;
  }

  private async requireActiveMembership(membershipId: string, organizationId: string) {
    const membership = await this.requireScopedMembership(membershipId, organizationId);
    if (membership.status !== 'active') {
      throw new AccessControlError(
        'ACCESS_MEMBERSHIP_UNAVAILABLE',
        'Only active memberships may receive role assignments.',
        { status: membership.status },
      );
    }
    return membership;
  }

  private async requireScopedMembership(membershipId: string, organizationId: string) {
    const membership = await this.referenceDirectory.findMembershipById(
      this.requireText(membershipId, 'membershipId', 128),
    );
    if (membership === null || membership.organizationId !== organizationId) {
      throw new AccessControlError(
        'ACCESS_MEMBERSHIP_NOT_FOUND',
        'The membership does not exist in this organization.',
      );
    }
    return membership;
  }

  private async requireActiveOrganization(
    context: AccessControlRequestContext,
    permission: AccessControlPermission,
  ): Promise<string> {
    this.requirePermission(context, permission);
    const organizationId = this.requireOrganizationId(context);
    const organization = await this.referenceDirectory.findOrganizationById(organizationId);
    if (organization === null) {
      throw new AccessControlError(
        'ACCESS_ORGANIZATION_NOT_FOUND',
        'The organization does not exist.',
      );
    }
    if (organization.status !== 'active') {
      throw new AccessControlError(
        'ACCESS_ORGANIZATION_UNAVAILABLE',
        'Access-control changes require an active organization.',
        { status: organization.status },
      );
    }
    return organizationId;
  }

  private requirePermission(
    context: AccessControlRequestContext,
    permission: AccessControlPermission,
  ): void {
    if (context.actorUserId.trim().length === 0) {
      throw new AccessControlError('ACCESS_INVALID_INPUT', 'actorUserId is required.');
    }
    if (!context.permissionCodes.has(permission)) {
      throw new AccessControlError('ACCESS_FORBIDDEN', `The operation requires ${permission}.`, {
        permission,
      });
    }
  }

  private requireOrganizationId(context: AccessControlRequestContext): string {
    if (context.organizationId === null) {
      throw new AccessControlError('ACCESS_INVALID_INPUT', 'organizationId is required.');
    }
    return this.requireText(context.organizationId, 'organizationId', 128);
  }

  private async publishRole(
    name: 'role.created' | 'role.updated' | 'role.archived',
    actorUserId: string,
    role: RoleRecord,
  ): Promise<void> {
    await this.eventPublisher.publish({
      name,
      actorUserId,
      organizationId: role.organizationId,
      occurredAt: new Date(),
      role,
    });
  }

  private async publishRolePermission(
    context: AccessControlRequestContext,
    role: RoleRecord,
    permissionId: string,
    assignment: RolePermissionRecord | null,
  ): Promise<void> {
    await this.eventPublisher.publish({
      name: 'role.permission_changed',
      actorUserId: context.actorUserId,
      organizationId: role.organizationId,
      occurredAt: new Date(),
      roleId: role.id,
      permissionId,
      assignment,
    });
  }

  private normalizeLimit(value: number | undefined): number {
    const limit = value ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new AccessControlError(
        'ACCESS_INVALID_INPUT',
        `limit must be an integer between 1 and ${String(MAX_PAGE_SIZE)}.`,
      );
    }
    return limit;
  }

  private normalizeRoleCode(value: string): string {
    return this.normalizeSegment(value, 'code').replace(/_/g, '-');
  }

  private normalizeSegment(value: string, field: string): string {
    const normalized = this.requireText(value, field, 128).toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(normalized)) {
      throw new AccessControlError(
        'ACCESS_INVALID_INPUT',
        `${field} may contain lowercase letters, numbers, underscores, and hyphens.`,
        { field },
      );
    }
    return normalized;
  }

  private normalizeRiskLevel(value: string | undefined): string {
    const normalized = value === undefined ? 'standard' : this.normalizeSegment(value, 'riskLevel');
    if (!['standard', 'elevated', 'critical'].includes(normalized)) {
      throw new AccessControlError(
        'ACCESS_INVALID_INPUT',
        'riskLevel must be standard, elevated, or critical.',
      );
    }
    return normalized;
  }

  private normalizeDate(value: Date, field: string): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new AccessControlError('ACCESS_INVALID_INPUT', `${field} must be a valid date.`, {
        field,
      });
    }
    return new Date(value.getTime());
  }

  private requireText(value: string, field: string, maxLength: number): string {
    const normalized = value.trim();
    if (normalized.length === 0 || normalized.length > maxLength) {
      throw new AccessControlError(
        'ACCESS_INVALID_INPUT',
        `${field} must contain between 1 and ${String(maxLength)} characters.`,
        { field },
      );
    }
    return normalized;
  }

  private normalizeNullableText(
    value: string | null | undefined,
    field: string,
    maxLength: number,
  ): string | null {
    if (value == null || value.trim().length === 0) return null;
    return this.requireText(value, field, maxLength);
  }
}
