import { describe, expect, it } from 'vitest';

import { RequestOriginPolicy } from '../src/services/request-origin-policy';

describe('RequestOriginPolicy configuration', () => {
  it('rejects wildcard origins even outside the application environment adapter', () => {
    expect(() => new RequestOriginPolicy(['https://*.newax.test'])).toThrow(
      'Invalid allowed HTTP origin: https://*.newax.test',
    );
  });
});
