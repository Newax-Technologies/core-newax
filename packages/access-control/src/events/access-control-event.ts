import type {
  MembershipRoleAssignmentRecord,
  PermissionRecord,
  RolePermissionRecord,
  RoleRecord,
} from '../types/access-control';

export type AccessControlEvent =
  | {
      readonly name: 'permission.registered' | 'permission.updated';
      readonly actorUserId: string;
      readonly occurredAt: Date;
      readonly permission: PermissionRecord;
    }
  | {
      readonly name: 'role.created' | 'role.updated' | 'role.archived';
      readonly actorUserId: string;
      readonly organizationId: string | null;
      readonly occurredAt: Date;
      readonly role: RoleRecord;
    }
  | {
      readonly name: 'role.permission_changed';
      readonly actorUserId: string;
      readonly organizationId: string | null;
      readonly occurredAt: Date;
      readonly roleId: string;
      readonly permissionId: string;
      readonly assignment: RolePermissionRecord | null;
    }
  | {
      readonly name: 'role.assigned' | 'role.removed';
      readonly actorUserId: string;
      readonly organizationId: string;
      readonly occurredAt: Date;
      readonly assignment: MembershipRoleAssignmentRecord;
    };

export interface AccessControlEventPublisher {
  publish(event: AccessControlEvent): Promise<void>;
}
