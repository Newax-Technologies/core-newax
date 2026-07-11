export const ACCESS_CONTROL_PERMISSIONS = {
  assignmentsManage: 'access_control.assignments.manage',
  assignmentsView: 'access_control.assignments.view',
  permissionsManage: 'access_control.permissions.manage',
  permissionsView: 'access_control.permissions.view',
  rolePermissionsManage: 'access_control.roles.permissions.manage',
  rolesArchive: 'access_control.roles.archive',
  rolesCreate: 'access_control.roles.create',
  rolesUpdate: 'access_control.roles.update',
  rolesView: 'access_control.roles.view',
  templatesManage: 'access_control.templates.manage',
} as const;

export type AccessControlPermission =
  (typeof ACCESS_CONTROL_PERMISSIONS)[keyof typeof ACCESS_CONTROL_PERMISSIONS];
