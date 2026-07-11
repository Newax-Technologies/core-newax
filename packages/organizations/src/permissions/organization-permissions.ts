export const ORGANIZATION_PERMISSIONS = {
  archive: 'organizations.archive',
  create: 'organizations.create',
  update: 'organizations.update',
  view: 'organizations.view',
} as const;

export type OrganizationPermission =
  (typeof ORGANIZATION_PERMISSIONS)[keyof typeof ORGANIZATION_PERMISSIONS];
