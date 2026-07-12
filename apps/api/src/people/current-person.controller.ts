import { Controller, Get, Header, Inject, Query, Req } from '@nestjs/common';
import { HttpSecurityError } from '@newax/http-security';
import { PeopleService } from '@newax/people';
import type { TrustedAccountRequestContext } from '@newax/request-context';

import { AccountContextEndpoint } from '../http-security/http-security.decorators';
import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';

interface CurrentPersonResponse {
  readonly success: true;
  readonly data: {
    readonly id: string;
    readonly first_name: string;
    readonly middle_name: string | null;
    readonly last_name: string;
    readonly preferred_name: string | null;
    readonly status: 'active';
  };
}

@Controller('core/people/current')
export class CurrentPersonController {
  constructor(
    @Inject(PeopleService)
    private readonly people: PeopleService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @AccountContextEndpoint()
  async get(
    @Req() request: HttpSecurityRequestAdapter,
    @Query() query: unknown,
  ): Promise<CurrentPersonResponse> {
    this.assertEmptyQuery(query);
    const context = this.requireAccountContext(request);
    const person = await this.people.getCurrent({
      actorUserId: context.userId,
      personId: context.personId,
    });

    return {
      success: true,
      data: {
        id: person.id,
        first_name: person.firstName,
        middle_name: person.middleName,
        last_name: person.lastName,
        preferred_name: person.preferredName,
        status: person.status,
      },
    };
  }

  private assertEmptyQuery(query: unknown): void {
    if (
      typeof query !== 'object' ||
      query === null ||
      Array.isArray(query) ||
      Object.keys(query).length > 0
    ) {
      throw new HttpSecurityError(
        'HTTP_SECURITY_INVALID_INPUT',
        'The current person endpoint does not accept query parameters.',
        400,
      );
    }
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
