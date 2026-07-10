const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = 'development';
const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface ApplicationEnvironment {
  readonly NODE_ENV: NodeEnvironment;
  readonly HOST: string;
  readonly PORT: number;
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

export function validateEnvironment(
  configuration: Record<string, unknown>,
): Record<string, unknown> & ApplicationEnvironment {
  return {
    ...configuration,
    NODE_ENV: parseNodeEnvironment(configuration.NODE_ENV),
    HOST: parseHost(configuration.HOST),
    PORT: parsePort(configuration.PORT),
  };
}
