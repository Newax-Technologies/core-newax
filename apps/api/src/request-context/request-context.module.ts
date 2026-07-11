import { Module } from '@nestjs/common';
import { ContextAuthorizer, TrustedRequestContextService } from '@newax/request-context';

import { AccessControlModule } from '../access-control/access-control.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { DatabaseModule } from '../database/database.module';
import { AccessControlPermissionEvaluator } from './access-control-permission.evaluator';
import { AuthenticationSessionValidator } from './authentication-session.validator';
import {
  AsyncLocalStorageTrustedRequestContextStore,
  NodeRequestIdFactory,
  SystemTrustedContextClock,
} from './node-request-context.infrastructure';
import { PrismaTrustedMembershipDirectory } from './prisma-trusted-membership.directory';

@Module({
  imports: [DatabaseModule, AuthenticationModule, AccessControlModule],
  providers: [
    AuthenticationSessionValidator,
    PrismaTrustedMembershipDirectory,
    AccessControlPermissionEvaluator,
    NodeRequestIdFactory,
    SystemTrustedContextClock,
    AsyncLocalStorageTrustedRequestContextStore,
    ContextAuthorizer,
    {
      provide: TrustedRequestContextService,
      inject: [
        AuthenticationSessionValidator,
        PrismaTrustedMembershipDirectory,
        AccessControlPermissionEvaluator,
        SystemTrustedContextClock,
        NodeRequestIdFactory,
      ],
      useFactory: (
        sessionValidator: AuthenticationSessionValidator,
        membershipDirectory: PrismaTrustedMembershipDirectory,
        permissionEvaluator: AccessControlPermissionEvaluator,
        clock: SystemTrustedContextClock,
        requestIdFactory: NodeRequestIdFactory,
      ): TrustedRequestContextService =>
        new TrustedRequestContextService(
          sessionValidator,
          membershipDirectory,
          permissionEvaluator,
          clock,
          requestIdFactory,
        ),
    },
  ],
  exports: [
    TrustedRequestContextService,
    ContextAuthorizer,
    AsyncLocalStorageTrustedRequestContextStore,
  ],
})
export class RequestContextModule {}
