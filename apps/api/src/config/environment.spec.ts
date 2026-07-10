import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('applies safe defaults and preserves unrelated values', () => {
    expect(validateEnvironment({ FEATURE_FLAG: 'enabled' })).toEqual({
      FEATURE_FLAG: 'enabled',
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
    });
  });

  it('normalizes supported environment values', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        HOST: ' 127.0.0.1 ',
        PORT: '8080',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: 8080,
    });
  });

  it.each([
    ['staging'],
    [''],
    [42],
  ])('rejects an invalid NODE_ENV value: %s', (NODE_ENV) => {
    expect(() => validateEnvironment({ NODE_ENV })).toThrow(
      /NODE_ENV must be (a string|one of: development, test, production)/,
    );
  });

  it.each([
    [''],
    ['   '],
    [42],
  ])('rejects an invalid HOST value: %s', (HOST) => {
    expect(() => validateEnvironment({ HOST })).toThrow(/HOST must/);
  });

  it.each([
    [0],
    [65_536],
    [3.5],
    ['invalid'],
    [''],
  ])('rejects an invalid PORT value: %s', (PORT) => {
    expect(() => validateEnvironment({ PORT })).toThrow(
      'PORT must be an integer between 1 and 65535.',
    );
  });
});
