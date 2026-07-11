export type PeopleErrorCode =
  | 'PERSON_ARCHIVED'
  | 'PERSON_FORBIDDEN'
  | 'PERSON_IDENTIFIER_CONFLICT'
  | 'PERSON_IDENTIFIER_NOT_FOUND'
  | 'PERSON_INVALID_INPUT'
  | 'PERSON_NOT_FOUND';

export class PeopleModuleError extends Error {
  readonly code: PeopleErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: PeopleErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'PeopleModuleError';
    this.code = code;
    this.details = details;
  }
}
