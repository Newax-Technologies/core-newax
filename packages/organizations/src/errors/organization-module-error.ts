export type OrganizationErrorCode =
  | 'ORGANIZATION_FORBIDDEN'
  | 'ORGANIZATION_HAS_ACTIVE_CHILDREN'
  | 'ORGANIZATION_HIERARCHY_CYCLE'
  | 'ORGANIZATION_INTEGRITY_FAILURE'
  | 'ORGANIZATION_INVALID_INPUT'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_PARENT_ARCHIVED'
  | 'ORGANIZATION_PARENT_NOT_FOUND';

export class OrganizationModuleError extends Error {
  readonly code: OrganizationErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: OrganizationErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'OrganizationModuleError';
    this.code = code;
    this.details = details;
  }
}
