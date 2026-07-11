export const USER_PERMISSIONS = {
  archive: 'users.archive',
  create: 'users.create',
  disable: 'users.disable',
  enable: 'users.enable',
  identitiesManage: 'users.identities.manage',
  identitiesView: 'users.identities.view',
  suspend: 'users.suspend',
  view: 'users.view',
} as const;

export type UserPermission =
  (typeof USER_PERMISSIONS)[keyof typeof USER_PERMISSIONS];
