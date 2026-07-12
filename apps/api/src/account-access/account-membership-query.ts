import { HttpSecurityError } from '@newax/http-security';

export interface AccountMembershipHttpQuery {
  readonly page: number;
  readonly perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE = 1_000_000;
const MAX_PAGE_SIZE = 100;
const SUPPORTED_FIELDS = new Set(['page', 'per_page']);

export function parseAccountMembershipHttpQuery(value: unknown): AccountMembershipHttpQuery {
  if (value === undefined) {
    return { page: DEFAULT_PAGE, perPage: DEFAULT_PAGE_SIZE };
  }
  if (!isRecord(value)) {
    throw invalidQuery('The membership query must be an object.');
  }

  for (const field of Object.keys(value)) {
    if (!SUPPORTED_FIELDS.has(field)) {
      throw invalidQuery(`Unsupported membership query field: ${field}`);
    }
  }

  return {
    page: parsePositiveInteger(value.page, 'page', DEFAULT_PAGE, MAX_PAGE),
    perPage: parsePositiveInteger(value.per_page, 'per_page', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}

function parsePositiveInteger(
  value: unknown,
  field: string,
  fallback: number,
  maximum: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) {
    throw invalidQuery(`${field} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw invalidQuery(`${field} must not exceed ${String(maximum)}.`);
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidQuery(message: string): HttpSecurityError {
  return new HttpSecurityError('HTTP_SECURITY_INVALID_INPUT', message, 400);
}
