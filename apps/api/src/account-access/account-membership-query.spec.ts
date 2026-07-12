import { describe, expect, it } from 'vitest';

import { parseAccountMembershipHttpQuery } from './account-membership-query';

describe('parseAccountMembershipHttpQuery', () => {
  it('uses bounded defaults', () => {
    expect(parseAccountMembershipHttpQuery({})).toEqual({ page: 1, perPage: 25 });
  });

  it('parses supported pagination fields', () => {
    expect(parseAccountMembershipHttpQuery({ page: '2', per_page: '50' })).toEqual({
      page: 2,
      perPage: 50,
    });
  });

  it('rejects unknown query fields', () => {
    expect(() => parseAccountMembershipHttpQuery({ organization_id: 'untrusted' })).toThrowError(
      expect.objectContaining({
        code: 'HTTP_SECURITY_INVALID_INPUT',
        statusCode: 400,
      }),
    );
  });

  it('rejects duplicate or malformed pagination values', () => {
    expect(() => parseAccountMembershipHttpQuery({ page: ['1', '2'] })).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }),
    );
    expect(() => parseAccountMembershipHttpQuery({ per_page: '0' })).toThrowError(
      expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }),
    );
  });
});
