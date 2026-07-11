import { describe, expect, it } from 'vitest';

import type { AccessControlRepository } from '../src/database/access-control-repository';
import type {
  AccessControlEvent,
  AccessControlEventPublisher,
} from '../src/events/access-control-event';
import { ACCESS_CONTROL_PERMISSIONS } from '../src/permissions/access-control-permissions';
import type { AccessReferenceDirectory } from '../src/services/access-reference-directory';
import { AccessControlService } from '../src/services/access-control.service';
import { PermissionEvaluator } from '../src/services/permission-evaluator';
import type {
  AccessControlRequestContext,
  AccessReferenceRecord,
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
} from '../src/types/access-control';

const now = new Date('2026-07-11T00:00:00.000Z');

function role(overrides: Partial<RoleRecord> = {}): RoleRecord {
  return {
    id: '00000000-0000-4000-8000-000000000100',
    organizationId: '00000000-0000-4000-8000-000000000010',
    code: 'operations-manager',
    name: 'Operations Manager',
    description: null,
    roleType: 'organization',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function permission(overrides: Partial<PermissionRecord> = {}): PermissionRecord {
  return {
    id: '00000000-0000-4000-8000-000000000200',
    code: 'organizations.view',
    moduleCode: 'organizations',
    resource: 'organizations',
    action: 'view',
    riskLevel: 'standard',
    description: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function assignment(
  overrides: Partial<MembershipRoleAssignmentRecord> = {},
): MembershipRoleAssignmentRecord {
  return {
    id: '00000000-0000-4000-8000-000000000300',
    membershipId: '00000000-0000-4000-8000-000000000020',
    roleId: '00000000-0000-4000-8000-000000000100',
    assignedByUserId: '00000000-0000-4000-8000-000000000999',
    revokedByUserId: null,
    validFrom: now,
    validUntil: null,
    revokedAt: null,
    createdAt: now,
    ...overrides,
  };
}

class FakeAccessControlRepository implements AccessControlRepository {
  readonly roles = new Map<string, RoleRecord>();
  readonly permissions = new Map<string, PermissionRecord>();
  readonly assignments = new Map<string, MembershipRoleAssignmentRecord>();
  readonly rolePermissions: RolePermissionRecord[] = [];
  lastPermissionInput: RegisterPermissionRecordInput | null = null;
  evaluation: PermissionEvaluation = {
    membershipId: '00000000-0000-4000-8000-000000000020',
    organizationId: '00000000-0000-4000-8000-000000000010',
    evaluatedAt: now,
    allowedPermissionCodes: ['records.view', 'records.delete'],
    deniedPermissionCodes: ['records.delete'],
    effectivePermissionCodes: ['records.view'],
  };

  async archiveRole(id: string): Promise<RoleRecord> {
    const current = this.roles.get(id);
    if (current === undefined) throw new Error('Missing fake role.');
    const archived = { ...current, status: 'archived' as const };
    this.roles.set(id, archived);
    return archived;
  }

  async assignMembershipRole(
    input: AssignMembershipRoleRecordInput,
  ): Promise<AssignMembershipRoleResult> {
    const created = assignment({ ...input });
    this.assignments.set(created.id, created);
    return { status: 'assigned', assignment: created };
  }

  async createRole(input: CreateRoleRecordInput): Promise<CreateRoleResult> {
    const created = role({ id: crypto.randomUUID(), ...input });
    this.roles.set(created.id, created);
    return { status: 'created', role: created };
  }

  async createRoleFromTemplate(
    input: CreateRoleFromTemplateRecordInput,
  ): Promise<CreateRoleResult> {
    return this.createRole(input);
  }

  async evaluateMembershipPermissions(): Promise<PermissionEvaluation> {
    return this.evaluation;
  }

  async findAssignmentById(id: string): Promise<MembershipRoleAssignmentRecord | null> {
    return this.assignments.get(id) ?? null;
  }

  async findPermissionById(id: string): Promise<PermissionRecord | null> {
    return this.permissions.get(id) ?? null;
  }

  async findRoleById(id: string): Promise<RoleRecord | null> {
    return this.roles.get(id) ?? null;
  }

  async listAssignments(
    _organizationId: string,
    _query: AssignmentListQuery,
  ): Promise<AssignmentPage> {
    return { items: [...this.assignments.values()], nextCursor: null };
  }

  async listPermissions(_query: PermissionListQuery): Promise<PermissionPage> {
    return { items: [...this.permissions.values()], nextCursor: null };
  }

  async listRolePermissions(_roleId: string): Promise<readonly RolePermissionRecord[]> {
    return this.rolePermissions;
  }

  async listRoles(_organizationId: string | null, _query: RoleListQuery): Promise<RolePage> {
    return { items: [...this.roles.values()], nextCursor: null };
  }

  async registerPermission(
    input: RegisterPermissionRecordInput,
  ): Promise<PermissionRegistrationResult> {
    this.lastPermissionInput = input;
    const created = permission({ ...input });
    this.permissions.set(created.id, created);
    return { status: 'registered', permission: created };
  }

  async removeRolePermission(): Promise<boolean> {
    return true;
  }

  async revokeAssignment(
    id: string,
    revokedByUserId: string,
    revokedAt: Date,
  ): Promise<MembershipRoleAssignmentRecord> {
    const current = this.assignments.get(id);
    if (current === undefined) throw new Error('Missing fake assignment.');
    const revoked = { ...current, revokedByUserId, revokedAt };
    this.assignments.set(id, revoked);
    return revoked;
  }

  async setRolePermission(
    roleId: string,
    permissionId: string,
    effect: 'allow' | 'deny',
    createdByUserId: string,
  ): Promise<RolePermissionRecord> {
    const record = { roleId, permissionId, effect, createdByUserId, createdAt: now };
    this.rolePermissions.push(record);
    return record;
  }

  async updateRole(id: string, input: UpdateRoleRecordInput): Promise<RoleRecord> {
    const current = this.roles.get(id);
    if (current === undefined) throw new Error('Missing fake role.');
    const updated = {
      ...current,
      name: input.name ?? current.name,
      description:
        'description' in input ? (input.description ?? null) : current.description,
    };
    this.roles.set(id, updated);
    return updated;
  }
}

class FakeReferenceDirectory implements AccessReferenceDirectory {
  readonly records = new Map<string, AccessReferenceRecord>();

  async findMembershipById(id: string): Promise<AccessReferenceRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findOrganizationById(id: string): Promise<AccessReferenceRecord | null> {
    return this.records.get(id) ?? null;
  }
}

class RecordingPublisher implements AccessControlEventPublisher {
  readonly events: AccessControlEvent[] = [];

  async publish(event: AccessControlEvent): Promise<void> {
    this.events.push(event);
  }
}

function context(...permissions: string[]): AccessControlRequestContext {
  return {
    actorUserId: '00000000-0000-4000-8000-000000000999',
    organizationId: '00000000-0000-4000-8000-000000000010',
    permissionCodes: new Set(permissions),
  };
}

function activeReferences(directory: FakeReferenceDirectory): void {
  directory.records.set('00000000-0000-4000-8000-000000000010', {
    id: '00000000-0000-4000-8000-000000000010',
    organizationId: '00000000-0000-4000-8000-000000000010',
    status: 'active',
  });
  directory.records.set('00000000-0000-4000-8000-000000000020', {
    id: '00000000-0000-4000-8000-000000000020',
    organizationId: '00000000-0000-4000-8000-000000000010',
    status: 'active',
  });
}

describe('AccessControlService', () => {
  it('requires explicit administrative permissions', async () => {
    const service = new AccessControlService(
      new FakeAccessControlRepository(),
      new FakeReferenceDirectory(),
      new RecordingPublisher(),
    );

    await expect(service.listPermissions(context())).rejects.toMatchObject({
      code: 'ACCESS_FORBIDDEN',
    });
  });

  it('derives stable permission codes and emits registration events', async () => {
    const repository = new FakeAccessControlRepository();
    const publisher = new RecordingPublisher();
    const service = new AccessControlService(
      repository,
      new FakeReferenceDirectory(),
      publisher,
    );

    const created = await service.registerPermission(
      context(ACCESS_CONTROL_PERMISSIONS.permissionsManage),
      {
        moduleCode: ' People ',
        resource: ' Identifiers ',
        action: ' View ',
      },
    );

    expect(created.code).toBe('people.identifiers.view');
    expect(repository.lastPermissionInput?.code).toBe('people.identifiers.view');
    expect(publisher.events[0]?.name).toBe('permission.registered');
  });

  it('conceals organization roles owned by another organization', async () => {
    const repository = new FakeAccessControlRepository();
    const foreign = role({ organizationId: '00000000-0000-4000-8000-000000000777' });
    repository.roles.set(foreign.id, foreign);
    const service = new AccessControlService(
      repository,
      new FakeReferenceDirectory(),
      new RecordingPublisher(),
    );

    await expect(
      service.getRoleById(context(ACCESS_CONTROL_PERMISSIONS.rolesView), foreign.id),
    ).rejects.toMatchObject({ code: 'ACCESS_ROLE_NOT_FOUND' });
  });

  it('assigns only organization roles to active memberships in the context', async () => {
    const repository = new FakeAccessControlRepository();
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    const organizationRole = role();
    repository.roles.set(organizationRole.id, organizationRole);
    const publisher = new RecordingPublisher();
    const service = new AccessControlService(repository, references, publisher);

    const created = await service.assignRole(
      context(ACCESS_CONTROL_PERMISSIONS.assignmentsManage),
      {
        membershipId: '00000000-0000-4000-8000-000000000020',
        roleId: organizationRole.id,
      },
    );

    expect(created.roleId).toBe(organizationRole.id);
    expect(publisher.events[0]?.name).toBe('role.assigned');
  });
});

describe('PermissionEvaluator', () => {
  it('returns no permissions for suspended memberships', async () => {
    const repository = new FakeAccessControlRepository();
    const references = new FakeReferenceDirectory();
    references.records.set('membership', {
      id: 'membership',
      organizationId: 'organization',
      status: 'suspended',
    });

    const result = await new PermissionEvaluator(repository, references).evaluate('membership', now);
    expect(result.effectivePermissionCodes).toEqual([]);
  });

  it('preserves repository deny precedence for active memberships', async () => {
    const repository = new FakeAccessControlRepository();
    const references = new FakeReferenceDirectory();
    references.records.set('membership', {
      id: 'membership',
      organizationId: 'organization',
      status: 'active',
    });

    const result = await new PermissionEvaluator(repository, references).evaluate('membership', now);
    expect(result.allowedPermissionCodes).toContain('records.delete');
    expect(result.deniedPermissionCodes).toContain('records.delete');
    expect(result.effectivePermissionCodes).not.toContain('records.delete');
  });
});
