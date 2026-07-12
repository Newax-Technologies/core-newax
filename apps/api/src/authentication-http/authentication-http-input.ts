import type { AuthenticationIdentityType, PasswordLoginInput } from '@newax/auth';
import { HttpSecurityError } from '@newax/http-security';

const LOGIN_KEYS = new Set(['identityType', 'identityValue', 'password']);
const IDENTITY_TYPES: ReadonlySet<AuthenticationIdentityType> = new Set([
  'email',
  'username',
  'phone',
]);

export interface AuthenticationLoginRequest {
  readonly identityType: AuthenticationIdentityType;
  readonly identityValue: string;
  readonly password: string;
}

export function parseAuthenticationLoginRequest(value: unknown): AuthenticationLoginRequest {
  const record = requirePlainRecord(value);
  const keys = Object.keys(record);
  if (keys.length !== LOGIN_KEYS.size || keys.some((key) => !LOGIN_KEYS.has(key))) {
    throw invalidRequest();
  }

  const identityType = record.identityType;
  if (typeof identityType !== 'string' || !IDENTITY_TYPES.has(identityType as AuthenticationIdentityType)) {
    throw invalidRequest();
  }

  const identityValue = requireText(record.identityValue, 320, false);
  const password = requireText(record.password, 1_024, true);

  return {
    identityType: identityType as AuthenticationIdentityType,
    identityValue,
    password,
  } satisfies Pick<PasswordLoginInput, 'identityType' | 'identityValue' | 'password'>;
}

function requirePlainRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw invalidRequest();
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw invalidRequest();
  }
  return value as Record<string, unknown>;
}

function requireText(value: unknown, maximumLength: number, preserveWhitespace: boolean): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximumLength) {
    throw invalidRequest();
  }
  if (!preserveWhitespace && value.trim().length === 0) {
    throw invalidRequest();
  }
  return value;
}

function invalidRequest(): HttpSecurityError {
  return new HttpSecurityError(
    'HTTP_SECURITY_INVALID_INPUT',
    'The authentication request body is invalid.',
    400,
  );
}
