import { describe, expect, it } from 'vitest';

import {
  AccountMembershipDiscoveryService,
  type AccountMembershipCandidate,
  type AccountMembershipDirectory,
  type AccountMembershipDirectoryPage,
  type TrustedAccountRequestContext,
} from '../src';

const USER_ID = '00000000-0000-4000-8000-000000000001';
const PERSON_ID = '00000000-0000-4000-8000-000000000002';
const SESSION_ID = '00000000-0000-4000-8000-000000000003';
const MEMBERSHIP_ID = '00000000-0000-4000-8000-000000000004';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000005';

const CONTEXT: TrustedAccountRequestContext = {
  scope: 'account',
  requestId: 'request-1',
  userId: USER_ID,
  personId: PERSON_ID,
  sessionId: SESSION_ID,
  sessionExpiresAt: new Date('2026-07-12T12:00:00.000Z'),
};

function candidate(
  overrides: Partial<AccountMembershipCandidate> = {},
): AccountMembershipCandidate {
  return {
    membershipId: MEMBERSHIP_ID,
    personId: PERSON_ID,
    organizationId: ORGANIZATION_ID,
    organizationDisplayName: 'NEWAX Academy',
    organizationType: 'education',
    organizationStatus: 'active',
    membershipType: 'lecturer',
    membershipStatus: 'active',
    jobTitle: 'Senior Lecturer',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

class FakeDirectory implements AccountMembershipDirectory {
  personId: string | null = null;
  offset: number | null = null;
  limit: number | null = null;

  constructor(private readonly result: AccountMembershipDirectoryPage) {}

  async listAvailableMemberships(
    personId: string,
    offset: number,
    limit: number,
  ): Promise<AccountMembershipDirectoryPage> {
    this.personId = personId;
    this.offset = offset;
    this.limit = limit;
    return this.result;
  }
}

describe('AccountMembershipDiscoveryService', () => {
  it('returns a bounded account-owned membership page', async () => {
    const directory = new FakeDirectory({ items: [candidate()], total: 1 });
    const service = new AccountMembershipDiscoveryService(directory);

    const result = await service.list(CONTEXT, { page: 1, perPage: 25 });

    expect(directory).toMatchObject({ personId: PERSON_ID, offset: 0, limit: 25 });
    expect(result).toEqual({
      items: [
        {
          membershipId: MEMBERSHIP_ID,
          organizationId: ORGANIZATION_ID,
          organizationDisplayName: 'NEWAX Academy',
          organizationType: 'education',
          membershipType: 'lecturer',
          jobTitle: 'Senior Lecturer',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      page: 1,
      perPage: 25,
      total: 1,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.items)).toBe(true);
  });

  it('normalizes trusted UUID casing before persistence and ownership checks', async () => {
    const lowercasePersonId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const directory = new FakeDirectory({
      items: [candidate({ personId: lowercasePersonId })],
      total: 1,
    });
    const service = new AccountMembershipDiscoveryService(directory);

    await expect(
      service.list({ ...CONTEXT, personId: lowercasePersonId.toUpperCase() }),
    ).resolves.toMatchObject({ total: 1 });
    expect(directory.personId).toBe(lowercasePersonId);
  });

  it('rejects memberships that do not belong to the trusted person', async () => {
    const directory = new FakeDirectory({
      items: [candidate({ personId: '00000000-0000-4000-8000-000000000099' })],
      total: 1,
    });
    const service = new AccountMembershipDiscoveryService(directory);

    await expect(service.list(CONTEXT)).rejects.toMatchObject({
      code: 'REQUEST_CONTEXT_INTEGRITY_FAILURE',
    });
  });

  it('rejects inactive memberships and organizations returned by persistence', async () => {
    const directory = new FakeDirectory({
      items: [candidate({ organizationStatus: 'suspended' })],
      total: 1,
    });
    const service = new AccountMembershipDiscoveryService(directory);

    await expect(service.list(CONTEXT)).rejects.toMatchObject({
      code: 'REQUEST_CONTEXT_INTEGRITY_FAILURE',
    });
  });

  it('rejects duplicate membership identifiers', async () => {
    const directory = new FakeDirectory({ items: [candidate(), candidate()], total: 2 });
    const service = new AccountMembershipDiscoveryService(directory);

    await expect(service.list(CONTEXT)).rejects.toMatchObject({
      code: 'REQUEST_CONTEXT_INTEGRITY_FAILURE',
    });
  });

  it('rejects invalid pagination before persistence access', async () => {
    const directory = new FakeDirectory({ items: [], total: 0 });
    const service = new AccountMembershipDiscoveryService(directory);

    await expect(service.list(CONTEXT, { page: 0 })).rejects.toMatchObject({
      code: 'REQUEST_CONTEXT_INVALID_INPUT',
      details: { field: 'page' },
    });
    expect(directory.personId).toBeNull();
  });
});
