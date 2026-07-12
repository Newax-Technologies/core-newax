import { describe, expect, it } from 'vitest';

import { parseAuthenticationLoginRequest } from './authentication-http-input';

describe('parseAuthenticationLoginRequest', () => {
  it('accepts the exact supported login contract', () => {
    expect(
      parseAuthenticationLoginRequest({
        identityType: 'email',
        identityValue: 'person@example.test',
        password: 'correct horse battery staple',
      }),
    ).toEqual({
      identityType: 'email',
      identityValue: 'person@example.test',
      password: 'correct horse battery staple',
    });
  });

  it('rejects unknown properties and unsupported identity types', () => {
    expect(() =>
      parseAuthenticationLoginRequest({
        identityType: 'email',
        identityValue: 'person@example.test',
        password: 'correct horse battery staple',
        organizationId: 'client-controlled-tenant',
      }),
    ).toThrowError(expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }));

    expect(() =>
      parseAuthenticationLoginRequest({
        identityType: 'external-provider',
        identityValue: 'person@example.test',
        password: 'correct horse battery staple',
      }),
    ).toThrowError(expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }));
  });

  it('rejects malformed objects and blank identities', () => {
    for (const value of [null, [], 'login', { identityType: 'email' }]) {
      expect(() => parseAuthenticationLoginRequest(value)).toThrowError(
        expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }),
      );
    }

    expect(() =>
      parseAuthenticationLoginRequest({
        identityType: 'username',
        identityValue: '   ',
        password: 'correct horse battery staple',
      }),
    ).toThrowError(expect.objectContaining({ code: 'HTTP_SECURITY_INVALID_INPUT' }));
  });
});
