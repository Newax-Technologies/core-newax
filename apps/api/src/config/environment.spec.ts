import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './environment';

const productionPepper =
  'production-authentication-pepper-with-more-than-thirty-two-characters';

describe('validateEnvironment', () => {
  it('applies safe defaults and preserves unrelated values', () => {
    expect(validateEnvironment({ FEATURE_FLAG: 'enabled' })).toMatchObject({
      FEATURE_FLAG: 'enabled',
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      AUTH_PASSWORD_MINIMUM_LENGTH: 12,
      AUTH_PASSWORD_MAXIMUM_LENGTH: 128,
      AUTH_SESSION_TTL_MINUTES: 480,
      AUTH_FAILED_ATTEMPT_WINDOW_MINUTES: 15,
      AUTH_MAXIMUM_FAILED_ATTEMPTS: 5,
      AUTH_ACCOUNT_LOCK_MINUTES: 15,
      AUTH_SESSION_TOUCH_INTERVAL_MINUTES: 5,
    });
  });

  it('normalizes supported environment values', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        HOST: ' 127.0.0.1 ',
        PORT: '8080',
        AUTH_TOKEN_PEPPER: ` ${productionPepper} `,
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: 8080,
      AUTH_TOKEN_PEPPER: productionPepper,
    });
  });

  it('requires an explicit authentication token pepper in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'AUTH_TOKEN_PEPPER is required in production.',
    );
  });

  it('rejects a short authentication token pepper', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        AUTH_TOKEN_PEPPER: 'too-short',
      }),
    ).toThrow('AUTH_TOKEN_PEPPER must contain at least 32 characters.');
  });

  it('rejects an inverted authentication password range', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        AUTH_PASSWORD_MINIMUM_LENGTH: 20,
        AUTH_PASSWORD_MAXIMUM_LENGTH: 12,
      }),
    ).toThrow(
      'AUTH_PASSWORD_MAXIMUM_LENGTH must be greater than or equal to AUTH_PASSWORD_MINIMUM_LENGTH.',
    );
  });

  it.each([['staging'], [''], [42]])(
    'rejects an invalid NODE_ENV value: %s',
    (NODE_ENV) => {
      expect(() => validateEnvironment({ NODE_ENV })).toThrow(
        /NODE_ENV must be (a string|one of: development, test, production)/,
      );
    },
  );

  it.each([[''], ['   '], [42]])(
    'rejects an invalid HOST value: %s',
    (HOST) => {
      expect(() => validateEnvironment({ HOST })).toThrow(/HOST must/);
    },
  );

  it.each([[0], [65_536], [3.5], ['invalid'], ['']])(
    'rejects an invalid PORT value: %s',
    (PORT) => {
      expect(() => validateEnvironment({ PORT })).toThrow(
        'PORT must be an integer between 1 and 65535.',
      );
    },
  );

  it.each([[true], [false], [null], [{}], [[]]])(
    'rejects an unsupported PORT type: %s',
    (PORT) => {
      expect(() => validateEnvironment({ PORT })).toThrow(
        'PORT must be a string or number.',
      );
    },
  );

  it.each([
    [
      ' postgresql://newax:secret@localhost:5432/newax ',
      'postgresql://newax:secret@localhost:5432/newax',
    ],
    [
      ' postgres://newax:secret@localhost:5432/newax ',
      'postgres://newax:secret@localhost:5432/newax',
    ],
  ])(
    'normalizes a valid PostgreSQL database URL',
    (DATABASE_URL, expectedDatabaseUrl) => {
      expect(validateEnvironment({ DATABASE_URL })).toMatchObject({
        DATABASE_URL: expectedDatabaseUrl,
      });
    },
  );

  it.each([
    [42, 'DATABASE_URL must be a string.'],
    ['', 'DATABASE_URL must not be empty.'],
    ['   ', 'DATABASE_URL must not be empty.'],
    ['not-a-url', 'DATABASE_URL must be a valid PostgreSQL connection URL.'],
    [
      'https://localhost/newax',
      'DATABASE_URL must use the postgresql:// or postgres:// protocol.',
    ],
    [
      'mysql://localhost/newax',
      'DATABASE_URL must use the postgresql:// or postgres:// protocol.',
    ],
  ])(
    'rejects an invalid DATABASE_URL value: %s',
    (DATABASE_URL, expectedMessage) => {
      expect(() => validateEnvironment({ DATABASE_URL })).toThrow(
        expectedMessage,
      );
    },
  );
});
