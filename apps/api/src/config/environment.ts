import {
  validateHttpSecurityEnvironment,
  type HttpSecurityEnvironment,
} from './http-security-environment';

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = 'development';
const DEFAULT_AUTH_TOKEN_PEPPER = 'development-only-auth-token-pepper-change-before-production';
const DEFAULT_AUTH_PASSWORD_MINIMUM_LENGTH = 15;
const DEFAULT_AUTH_PASSWORD_MAXIMUM_LENGTH = 128;
const DEFAULT_AUTH_SESSION_TTL_MINUTES = 480;
const DEFAULT_AUTH_FAILED_ATTEMPT_WINDOW_MINUTES = 15;
const DEFAULT_AUTH_MAXIMUM_FAILED_ATTEMPTS = 5;
const DEFAULT_AUTH_ACCOUNT_LOCK_MINUTES = 15;
const DEFAULT_AUTH_SESSION_TOUCH_INTERVAL_MINUTES = 5;
const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface ApplicationEnvironment extends HttpSecurityEnvironment {
  readonly NODE_ENV: NodeEnvironment;
  readonly HOST: string;
  readonly PORT: number;
  readonly DATABASE_URL?: string;
  readonly AUTH_TOKEN_PEPPER: string;
  readonly AUTH_PASSWORD_MINIMUM_LENGTH: number;
  readonly AUTH_PASSWORD_MAXIMUM_LENGTH: number;
  readonly AUTH_SESSION_TTL_MINUTES: number;
  readonly AUTH_FAILED_ATTEMPT_WINDOW_MINUTES: number;
  readonly AUTH_MAXIMUM_FAILED_ATTEMPTS: number;
  readonly AUTH_ACCOUNT_LOCK_MINUTES: number;
  readonly AUTH_SESSION_TOUCH_INTERVAL_MINUTES: number;
}

function parseNodeEnvironment(value: unknown): NodeEnvironment {
  if (value === undefined) {
    return DEFAULT_NODE_ENV;
  }

  if (typeof value !== 'string') {
    throw new Error('NODE_ENV must be a string.');
  }

  const environment = value.trim();

  if (!NODE_ENVIRONMENTS.includes(environment as NodeEnvironment)) {
    throw new Error(`NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}.`);
  }

  return environment as NodeEnvironment;
}

function parseHost(value: unknown): string {
  if (value === undefined) {
    return DEFAULT_HOST;
  }

  if (typeof value !== 'string') {
    throw new Error('HOST must be a string.');
  }

  const host = value.trim();

  if (host.length === 0) {
    throw new Error('HOST must not be empty.');
  }

  return host;
}

function parsePort(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('PORT must be a string or number.');
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : value;
  const port = typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseDatabaseUrl(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('DATABASE_URL must be a string.');
  }

  const databaseUrl = value.trim();

  if (databaseUrl.length === 0) {
    throw new Error('DATABASE_URL must not be empty.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (parsedUrl.protocol !== 'postgresql:' && parsedUrl.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql:// or postgres:// protocol.');
  }

  return databaseUrl;
}

function parseAuthenticationPepper(value: unknown, nodeEnvironment: NodeEnvironment): string {
  if (value === undefined) {
    if (nodeEnvironment === 'production') {
      throw new Error('AUTH_TOKEN_PEPPER is required in production.');
    }
    return DEFAULT_AUTH_TOKEN_PEPPER;
  }

  if (typeof value !== 'string') {
    throw new Error('AUTH_TOKEN_PEPPER must be a string.');
  }

  const pepper = value.trim();
  if (pepper.length < 32) {
    throw new Error('AUTH_TOKEN_PEPPER must contain at least 32 characters.');
  }
  return pepper;
}

function parsePositiveInteger(
  value: unknown,
  name: string,
  defaultValue: number,
  maximumValue: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${name} must be a string or number.`);
  }
  const normalizedValue = typeof value === 'string' ? value.trim() : value;
  const parsed = typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximumValue) {
    throw new Error(`${name} must be an integer between 1 and ${String(maximumValue)}.`);
  }
  return parsed;
}

export function validateEnvironment(
  configuration: Record<string, unknown>,
): Record<string, unknown> & ApplicationEnvironment {
  const nodeEnvironment = parseNodeEnvironment(configuration.NODE_ENV);
  const databaseUrl = parseDatabaseUrl(configuration.DATABASE_URL);
  const passwordMinimumLength = parsePositiveInteger(
    configuration.AUTH_PASSWORD_MINIMUM_LENGTH,
    'AUTH_PASSWORD_MINIMUM_LENGTH',
    DEFAULT_AUTH_PASSWORD_MINIMUM_LENGTH,
    256,
  );
  const passwordMaximumLength = parsePositiveInteger(
    configuration.AUTH_PASSWORD_MAXIMUM_LENGTH,
    'AUTH_PASSWORD_MAXIMUM_LENGTH',
    DEFAULT_AUTH_PASSWORD_MAXIMUM_LENGTH,
    1024,
  );
  if (passwordMaximumLength < passwordMinimumLength) {
    throw new Error(
      'AUTH_PASSWORD_MAXIMUM_LENGTH must be greater than or equal to AUTH_PASSWORD_MINIMUM_LENGTH.',
    );
  }

  return {
    ...configuration,
    NODE_ENV: nodeEnvironment,
    HOST: parseHost(configuration.HOST),
    PORT: parsePort(configuration.PORT),
    ...(databaseUrl === undefined ? {} : { DATABASE_URL: databaseUrl }),
    AUTH_TOKEN_PEPPER: parseAuthenticationPepper(configuration.AUTH_TOKEN_PEPPER, nodeEnvironment),
    AUTH_PASSWORD_MINIMUM_LENGTH: passwordMinimumLength,
    AUTH_PASSWORD_MAXIMUM_LENGTH: passwordMaximumLength,
    AUTH_SESSION_TTL_MINUTES: parsePositiveInteger(
      configuration.AUTH_SESSION_TTL_MINUTES,
      'AUTH_SESSION_TTL_MINUTES',
      DEFAULT_AUTH_SESSION_TTL_MINUTES,
      43_200,
    ),
    AUTH_FAILED_ATTEMPT_WINDOW_MINUTES: parsePositiveInteger(
      configuration.AUTH_FAILED_ATTEMPT_WINDOW_MINUTES,
      'AUTH_FAILED_ATTEMPT_WINDOW_MINUTES',
      DEFAULT_AUTH_FAILED_ATTEMPT_WINDOW_MINUTES,
      1_440,
    ),
    AUTH_MAXIMUM_FAILED_ATTEMPTS: parsePositiveInteger(
      configuration.AUTH_MAXIMUM_FAILED_ATTEMPTS,
      'AUTH_MAXIMUM_FAILED_ATTEMPTS',
      DEFAULT_AUTH_MAXIMUM_FAILED_ATTEMPTS,
      100,
    ),
    AUTH_ACCOUNT_LOCK_MINUTES: parsePositiveInteger(
      configuration.AUTH_ACCOUNT_LOCK_MINUTES,
      'AUTH_ACCOUNT_LOCK_MINUTES',
      DEFAULT_AUTH_ACCOUNT_LOCK_MINUTES,
      43_200,
    ),
    AUTH_SESSION_TOUCH_INTERVAL_MINUTES: parsePositiveInteger(
      configuration.AUTH_SESSION_TOUCH_INTERVAL_MINUTES,
      'AUTH_SESSION_TOUCH_INTERVAL_MINUTES',
      DEFAULT_AUTH_SESSION_TOUCH_INTERVAL_MINUTES,
      1_440,
    ),
    ...validateHttpSecurityEnvironment(configuration, nodeEnvironment),
  };
}
