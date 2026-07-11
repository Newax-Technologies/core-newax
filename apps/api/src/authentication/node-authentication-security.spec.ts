import { describe, expect, it } from 'vitest';

import {
  BaselinePasswordBlocklist,
  NodeLoginFingerprintService,
  NodePasswordHasher,
  NodeSessionTokenService,
} from './node-authentication-security';

const pepper =
  'test-authentication-pepper-with-more-than-thirty-two-characters';

describe('BaselinePasswordBlocklist', () => {
  it('rejects complete common and context-specific password values', async () => {
    const blocklist = new BaselinePasswordBlocklist();

    await expect(blocklist.contains('PasswordPassword')).resolves.toBe(true);
    await expect(blocklist.contains('newax-newax-newax')).resolves.toBe(true);
    await expect(
      blocklist.contains('a distinct passphrase for this account'),
    ).resolves.toBe(false);
  });
});

describe('NodePasswordHasher', () => {
  it('hashes and verifies passwords without retaining plaintext', async () => {
    const hasher = new NodePasswordHasher();
    const password = 'Correct-password-1!';

    const secretHash = await hasher.hash(password);
    const verified = await hasher.verifyOrBurn(password, secretHash);
    const rejected = await hasher.verifyOrBurn(
      'Wrong-password-1!',
      secretHash,
    );

    expect(secretHash).not.toContain(password);
    expect(verified).toEqual({ verified: true, needsRehash: false });
    expect(rejected.verified).toBe(false);
  });

  it('performs a safe dummy verification for missing hashes', async () => {
    const result = await new NodePasswordHasher().verifyOrBurn(
      'Some-password-1!',
      null,
    );
    expect(result).toEqual({ verified: false, needsRehash: false });
  });
});

describe('NodeSessionTokenService', () => {
  it('issues opaque tokens and stable keyed hashes', () => {
    const service = new NodeSessionTokenService(pepper);
    const issued = service.issue();

    expect(issued.token).not.toBe(issued.tokenHash);
    expect(issued.tokenHash).toHaveLength(64);
    expect(service.hash(issued.token)).toBe(issued.tokenHash);
  });
});

describe('NodeLoginFingerprintService', () => {
  it('creates stable keyed fingerprints without exposing the identity', () => {
    const service = new NodeLoginFingerprintService(pepper);
    const first = service.fingerprint('email', ' Person@Example.com ');
    const second = service.fingerprint('email', 'person@example.com');

    expect(first).toBe(second);
    expect(first).not.toContain('person@example.com');
    expect(first).toHaveLength(64);
  });
});
