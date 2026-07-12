export const AUTHENTICATION_PERMISSIONS = {
  sessionsView: 'authentication.sessions.view',
  sessionsRevoke: 'authentication.sessions.revoke',
  policiesManage: 'authentication.policies.manage',
} as const;

export type AuthenticationPermission =
  (typeof AUTHENTICATION_PERMISSIONS)[keyof typeof AUTHENTICATION_PERMISSIONS];
