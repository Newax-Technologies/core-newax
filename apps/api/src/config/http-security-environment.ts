export type HttpSecurityNodeEnvironment =
  | 'development'
  | 'test'
  | 'production';

export interface HttpSecurityEnvironment {
  readonly HTTP_ALLOWED_ORIGINS: readonly string[];
  readonly HTTP_CSRF_SECRET: string;
  readonly HTTP_REQUIRE_HTTPS: boolean;
  readonly HTTP_TRUST_PROXY_HOPS: number;
  readonly HTTP_BODY_LIMIT_BYTES: number;
  readonly HTTP_RATE_LIMIT_WINDOW_MILLISECONDS: number;
  readonly HTTP_RATE_LIMIT_MAXIMUM_REQUESTS: number;
  readonly HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS: number;
  readonly HTTP_HSTS_MAX_AGE_SECONDS: number;
  readonly HTTP_HSTS_INCLUDE_SUBDOMAINS: boolean;
  readonly HTTP_HSTS_PRELOAD: boolean;
}

const DEVELOPMENT_CSRF_SECRET =
  'development-only-http-csrf-secret-change-before-production';

export function validateHttpSecurityEnvironment(
  configuration: Record<string, unknown>,
  nodeEnvironment: HttpSecurityNodeEnvironment,
): HttpSecurityEnvironment {
  const requireHttps = parseBoolean(
    configuration.HTTP_REQUIRE_HTTPS,
    'HTTP_REQUIRE_HTTPS',
    nodeEnvironment === 'production',
  );
  const hstsIncludeSubDomains = parseBoolean(
    configuration.HTTP_HSTS_INCLUDE_SUBDOMAINS,
    'HTTP_HSTS_INCLUDE_SUBDOMAINS',
    nodeEnvironment === 'production',
  );
  const hstsPreload = parseBoolean(
    configuration.HTTP_HSTS_PRELOAD,
    'HTTP_HSTS_PRELOAD',
    false,
  );
  if (hstsPreload && !hstsIncludeSubDomains) {
    throw new Error(
      'HTTP_HSTS_PRELOAD requires HTTP_HSTS_INCLUDE_SUBDOMAINS=true.',
    );
  }

  return {
    HTTP_ALLOWED_ORIGINS: parseOrigins(
      configuration.HTTP_ALLOWED_ORIGINS,
      nodeEnvironment,
    ),
    HTTP_CSRF_SECRET: parseSecret(
      configuration.HTTP_CSRF_SECRET,
      nodeEnvironment,
    ),
    HTTP_REQUIRE_HTTPS: requireHttps,
    HTTP_TRUST_PROXY_HOPS: parseInteger(
      configuration.HTTP_TRUST_PROXY_HOPS,
      'HTTP_TRUST_PROXY_HOPS',
      0,
      0,
      10,
    ),
    HTTP_BODY_LIMIT_BYTES: parseInteger(
      configuration.HTTP_BODY_LIMIT_BYTES,
      'HTTP_BODY_LIMIT_BYTES',
      1_048_576,
      1_024,
      10_485_760,
    ),
    HTTP_RATE_LIMIT_WINDOW_MILLISECONDS: parseInteger(
      configuration.HTTP_RATE_LIMIT_WINDOW_MILLISECONDS,
      'HTTP_RATE_LIMIT_WINDOW_MILLISECONDS',
      60_000,
      1_000,
      3_600_000,
    ),
    HTTP_RATE_LIMIT_MAXIMUM_REQUESTS: parseInteger(
      configuration.HTTP_RATE_LIMIT_MAXIMUM_REQUESTS,
      'HTTP_RATE_LIMIT_MAXIMUM_REQUESTS',
      120,
      1,
      100_000,
    ),
    HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS: parseInteger(
      configuration.HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS,
      'HTTP_AUTH_RATE_LIMIT_MAXIMUM_REQUESTS',
      10,
      1,
      10_000,
    ),
    HTTP_HSTS_MAX_AGE_SECONDS: parseInteger(
      configuration.HTTP_HSTS_MAX_AGE_SECONDS,
      'HTTP_HSTS_MAX_AGE_SECONDS',
      63_072_000,
      300,
      126_144_000,
    ),
    HTTP_HSTS_INCLUDE_SUBDOMAINS: hstsIncludeSubDomains,
    HTTP_HSTS_PRELOAD: hstsPreload,
  };
}

function parseOrigins(
  value: unknown,
  nodeEnvironment: HttpSecurityNodeEnvironment,
): readonly string[] {
  const source =
    value === undefined
      ? 'http://localhost:3000,http://localhost:3001'
      : requireString(value, 'HTTP_ALLOWED_ORIGINS');
  const origins = source
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin, index, all) => all.indexOf(origin) === index);

  if (origins.length === 0 || origins.length > 20) {
    throw new Error('HTTP_ALLOWED_ORIGINS must contain between 1 and 20 origins.');
  }
  if (
    nodeEnvironment === 'production' &&
    origins.some((origin) => !origin.startsWith('https://'))
  ) {
    throw new Error('HTTP_ALLOWED_ORIGINS must use HTTPS in production.');
  }
  return origins;
}

function normalizeOrigin(value: string): string {
  const source = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch {
    throw new Error(`Invalid HTTP origin: ${source}`);
  }
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.pathname !== '/' ||
    parsed.search.length > 0 ||
    parsed.hash.length > 0
  ) {
    throw new Error(`Invalid HTTP origin: ${source}`);
  }
  return parsed.origin;
}

function parseSecret(
  value: unknown,
  nodeEnvironment: HttpSecurityNodeEnvironment,
): string {
  if (value === undefined) {
    if (nodeEnvironment === 'production') {
      throw new Error('HTTP_CSRF_SECRET is required in production.');
    }
    return DEVELOPMENT_CSRF_SECRET;
  }
  const secret = requireString(value, 'HTTP_CSRF_SECRET').trim();
  if (secret.length < 32) {
    throw new Error('HTTP_CSRF_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function parseBoolean(
  value: unknown,
  name: string,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  throw new Error(`${name} must be true or false.`);
}

function parseInteger(
  value: unknown,
  name: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${name} must be a string or number.`);
  }
  const normalized = typeof value === 'string' ? value.trim() : value;
  const parsed = typeof normalized === 'number' ? normalized : Number(normalized);
  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new Error(
      `${name} must be an integer between ${String(minimum)} and ${String(maximum)}.`,
    );
  }
  return parsed;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
  return value;
}
