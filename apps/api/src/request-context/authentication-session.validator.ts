import { Inject, Injectable } from '@nestjs/common';
import { AuthenticationService } from '@newax/auth';
import type { TrustedSessionRecord, TrustedSessionValidator } from '@newax/request-context';

@Injectable()
export class AuthenticationSessionValidator implements TrustedSessionValidator {
  constructor(
    @Inject(AuthenticationService)
    private readonly authentication: AuthenticationService,
  ) {}

  async validateSession(sessionToken: string): Promise<TrustedSessionRecord | null> {
    const session = await this.authentication.validateSession(sessionToken);
    return session === null
      ? null
      : {
          userId: session.userId,
          personId: session.personId,
          sessionId: session.sessionId,
          expiresAt: new Date(session.expiresAt.getTime()),
        };
  }
}
