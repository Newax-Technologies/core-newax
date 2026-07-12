import { describe, expect, it } from 'vitest';

import type {
  AccountMembershipDiscoveryPage,
  AccountMembershipDiscoveryQuery,
  AccountMembershipDiscoveryService,
  TrustedAccountRequestContext,
} from '@newax/request-context';

import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';
import { AccountMembershipsController } from './account-memberships.controller';

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

class FakeDiscoveryService {
  context: TrustedAccountRequestContext | null = null;
  query: AccountMembershipDiscoveryQuery | null = null;

  async list(
    context: TrustedAccountRequestContext,
    query: AccountMembershipDiscoveryQuery,
  ): Promise<AccountMembershipDiscoveryPage> {
    this.context = context;
    this.query = query;
    return {
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
      page: query.page ?? 1,
      perPage: query.perPage ?? 25,
      total: 1,
    };
  }
}

function request(context?: TrustedAccountRequestContext): HttpSecurityRequestAdapter {
  return {
    method: 'GET',
    headers: {},
    ...(context === undefined ? {} : { trustedContext: context }),
  };
}

describe('AccountMembershipsController', () => {
  it('returns only account-owned membership selection data', async () => {
    const discovery = new FakeDiscoveryService();
    const controller = new AccountMembershipsController(
      discovery as unknown as AccountMembershipDiscoveryService,
    );

    const result = await controller.list(request(CONTEXT), { page: '1', per_page: '25' });

    expect(discovery.context).toBe(CONTEXT);
    expect(discovery.query).toEqual({ page: 1, perPage: 25 });
    expect(result).toEqual({
      success: true,
      data: [
        {
          membership_id: MEMBERSHIP_ID,
          organization_id: ORGANIZATION_ID,
          organization_display_name: 'NEWAX Academy',
          organization_type: 'education',
          membership_type: 'lecturer',
          job_title: 'Senior Lecturer',
          start_date: '2026-01-01',
        },
      ],
      meta: { page: 1, per_page: 25, total: 1 },
    });
    expect(result.data[0]).not.toHaveProperty('person_id');
    expect(result.data[0]).not.toHaveProperty('reference_number');
  });

  it('fails closed without trusted account context', async () => {
    const controller = new AccountMembershipsController(
      new FakeDiscoveryService() as unknown as AccountMembershipDiscoveryService,
    );

    await expect(controller.list(request(), {})).rejects.toMatchObject({
      code: 'HTTP_SECURITY_INVALID_INPUT',
      statusCode: 500,
    });
  });
});
