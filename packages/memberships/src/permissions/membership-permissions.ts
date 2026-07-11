export const MEMBERSHIP_PERMISSIONS = {
  create: 'memberships.create',
  remove: 'memberships.remove',
  update: 'memberships.update',
  view: 'memberships.view',
} as const;

export type MembershipPermission =
  (typeof MEMBERSHIP_PERMISSIONS)[keyof typeof MEMBERSHIP_PERMISSIONS];
