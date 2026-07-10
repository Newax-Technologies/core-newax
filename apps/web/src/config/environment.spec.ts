import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readWebEnvironment } from './environment';

describe('readWebEnvironment', () => {
  it('applies safe defaults when configuration is absent', () => {
    assert.deepEqual(readWebEnvironment({}), {
      HOSTNAME: '0.0.0.0',
      PORT: 3001,
      SEARCH_INDEXING_ENABLED: false,
    });
  });

  it('normalizes valid configuration values', () => {
    assert.deepEqual(
      readWebEnvironment({
        HOSTNAME: ' 127.0.0.1 ',
        PORT: ' 4100 ',
        SEARCH_INDEXING_ENABLED: ' true ',
      }),
      {
        HOSTNAME: '127.0.0.1',
        PORT: 4100,
        SEARCH_INDEXING_ENABLED: true,
      },
    );
  });

  it('rejects an empty hostname', () => {
    assert.throws(
      () => readWebEnvironment({ HOSTNAME: '   ' }),
      /HOSTNAME must not be empty\./,
    );
  });

  for (const invalidPort of ['', '0', '65536', '1.5', 'not-a-port']) {
    it(`rejects invalid port value ${JSON.stringify(invalidPort)}`, () => {
      assert.throws(
        () => readWebEnvironment({ PORT: invalidPort }),
        invalidPort.trim().length === 0
          ? /PORT must not be empty\./
          : /PORT must be an integer between 1 and 65535\./,
      );
    });
  }

  it('accepts an explicit false indexing value', () => {
    assert.equal(
      readWebEnvironment({ SEARCH_INDEXING_ENABLED: 'false' }).SEARCH_INDEXING_ENABLED,
      false,
    );
  });

  for (const invalidBoolean of ['', 'TRUE', '1', 'yes']) {
    it(`rejects invalid indexing value ${JSON.stringify(invalidBoolean)}`, () => {
      assert.throws(
        () => readWebEnvironment({ SEARCH_INDEXING_ENABLED: invalidBoolean }),
        /SEARCH_INDEXING_ENABLED must be either true or false\./,
      );
    });
  }
});
