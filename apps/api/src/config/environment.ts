const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = 'development';
const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface ApplicationEnvironment {
  readonly NODE_ENV: NodeEnvironment;
  readonly HOST: string;
  readonly PORT: number;
  readonly DATABASE_URL?: string;
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

  const port = typeof value === 'number' ? value : Number(value);

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

export function validateEnvironment(
  configuration: Record<string, unknown>,
): Record<string, unknown> & ApplicationEnvironment {
  const databaseUrl = parseDatabaseUrl(configuration.DATABASE_URL);

  return {
    ...configuration,
    NODE_ENV: parseNodeEnvironment(configuration.NODE_ENV),
    HOST: parseHost(configuration.HOST),
    PORT: parsePort(configuration.PORT),
    ...(databaseUrl === undefined ? {} : { DATABASE_URL: databaseUrl }),
  };
}
