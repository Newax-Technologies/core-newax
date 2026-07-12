import { Controller, Get, Header, Inject, Query, Req } from '@nestjs/common';
import { HttpSecurityError } from '@newax/http-security';
import {
  AccountMembershipDiscoveryService,
  type TrustedAccountRequestContext,
} from '@newax/request-context';

import { AccountContextEndpoint } from '../http-security/http-security.decorators';
import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';
import { parseAccountMembershipHttpQuery } from './account-membership-query';

interface AccountMembershipResponseItem {
  readonly membership_id: string;
  readonly organization_id: string;
  readonly organization_display_name: string;
  readonly organization_type: string;
  readonly membership_type: string;
  readonly job_title: string | null;
  readonly start_date: string | null;
}

interface AccountMembershipListResponse {
  readonly success: true;
  readonly data: readonly AccountMembershipResponseItem[];
  readonly meta: {
    readonly page: number;
    readonly per_page: number;
    readonly total: number;
  };
}

@Controller('account/memberships')
export class AccountMembershipsController {
  constructor(
    @Inject(AccountMembershipDiscoveryService)
    private readonly discovery: AccountMembershipDiscoveryService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @AccountContextEndpoint()
  async list(
    @Req() request: HttpSecurityRequestAdapter,
    @Query() query: unknown,
  ): Promise<AccountMembershipListResponse> {
    const context = this.requireAccountContext(request);
    const parsed = parseAccountMembershipHttpQuery(query);
    const result = await this.discovery.list(context, parsed);

    return {
      success: true,
      data: result.items.map((item) => ({
        membership_id: item.membershipId,
        organization_id: item.organizationId,
        organization_display_name: item.organizationDisplayName,
        organization_type: item.organizationType,
        membership_type: item.membershipType,
        job_title: item.jobTitle,
        start_date: item.startDate === null ? null : item.startDate.toISOString().slice(0, 10),
      })),
      meta: {
        page: result.page,
        per_page: result.perPage,
        total: result.total,
      },
    };
  }

  private requireAccountContext(request: HttpSecurityRequestAdapter): TrustedAccountRequestContext {
    const context = request.trustedContext;
    if (context === undefined || context.scope !== 'account') {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'Trusted account context was not established.',
        500,
      );
    }
    return context;
  }
}
