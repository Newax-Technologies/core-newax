export type RequestContextErrorCode =
  | 'REQUEST_CONTEXT_AUTHENTICATION_REQUIRED'
  | 'REQUEST_CONTEXT_FORBIDDEN'
  | 'REQUEST_CONTEXT_INTEGRITY_FAILURE'
  | 'REQUEST_CONTEXT_INVALID_INPUT'
  | 'REQUEST_CONTEXT_MEMBERSHIP_UNAVAILABLE'
  | 'REQUEST_CONTEXT_NOT_ESTABLISHED';

export class RequestContextError extends Error {
  readonly code: RequestContextErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: RequestContextErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = 'RequestContextError';
    this.code = code;
    this.details = details;
  }
}
