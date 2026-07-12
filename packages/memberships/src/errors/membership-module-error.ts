export type MembershipErrorCode =
  | 'MEMBERSHIP_CONFLICT'
  | 'MEMBERSHIP_ENDED'
  | 'MEMBERSHIP_FORBIDDEN'
  | 'MEMBERSHIP_INVALID_INPUT'
  | 'MEMBERSHIP_NOT_FOUND'
  | 'MEMBERSHIP_ORGANIZATION_NOT_FOUND'
  | 'MEMBERSHIP_ORGANIZATION_UNAVAILABLE'
  | 'MEMBERSHIP_PERSON_NOT_FOUND'
  | 'MEMBERSHIP_PERSON_UNAVAILABLE';

export class MembershipModuleError extends Error {
  readonly code: MembershipErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: MembershipErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'MembershipModuleError';
    this.code = code;
    this.details = details;
  }
}
