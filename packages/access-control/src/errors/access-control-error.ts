export type AccessControlErrorCode =
  | 'ACCESS_ASSIGNMENT_CONFLICT'
  | 'ACCESS_ASSIGNMENT_NOT_FOUND'
  | 'ACCESS_FORBIDDEN'
  | 'ACCESS_INVALID_INPUT'
  | 'ACCESS_MEMBERSHIP_NOT_FOUND'
  | 'ACCESS_MEMBERSHIP_UNAVAILABLE'
  | 'ACCESS_ORGANIZATION_NOT_FOUND'
  | 'ACCESS_ORGANIZATION_UNAVAILABLE'
  | 'ACCESS_PERMISSION_NOT_FOUND'
  | 'ACCESS_ROLE_CONFLICT'
  | 'ACCESS_ROLE_NOT_FOUND'
  | 'ACCESS_ROLE_UNAVAILABLE'
  | 'ACCESS_TEMPLATE_NOT_FOUND';

export class AccessControlError extends Error {
  readonly code: AccessControlErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: AccessControlErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'AccessControlError';
    this.code = code;
    this.details = details;
  }
}
