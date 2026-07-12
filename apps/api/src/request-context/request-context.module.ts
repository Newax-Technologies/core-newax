import { Module } from '@nestjs/common';
import {
  AccountMembershipDiscoveryService,
  ContextAuthorizer,
  OrganizationContextConfirmationService,
  TrustedRequestContextService,
} from '@newax/request-context';

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
import { PrismaAccountMembershipDiscoveryDirectory } from './prisma-account-membership-discovery.directory';
import { PrismaOrganizationContextConfirmationDirectory } from './prisma-organization-context-confirmation.directory';
import { PrismaTrustedMembershipDirectory } from './prisma-trusted-membership.directory';

@Module({
  imports: [DatabaseModule, AuthenticationModule, AccessControlModule],
  providers: [
    AuthenticationSessionValidator,
    PrismaTrustedMembershipDirectory,
    PrismaAccountMembershipDiscoveryDirectory,
    PrismaOrganizationContextConfirmationDirectory,
    AccessControlPermissionEvaluator,
    NodeRequestIdFactory,
    SystemTrustedContextClock,
    AsyncLocalStorageTrustedRequestContextStore,
    ContextAuthorizer,
    {
      provide: AccountMembershipDiscoveryService,
      inject: [PrismaAccountMembershipDiscoveryDirectory],
      useFactory: (
        directory: PrismaAccountMembershipDiscoveryDirectory,
      ): AccountMembershipDiscoveryService =>
        new AccountMembershipDiscoveryService(directory),
    },
    {
      provide: OrganizationContextConfirmationService,
      inject: [PrismaOrganizationContextConfirmationDirectory],
      useFactory: (
        directory: PrismaOrganizationContextConfirmationDirectory,
      ): OrganizationContextConfirmationService =>
        new OrganizationContextConfirmationService(directory),
    },
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
    AccountMembershipDiscoveryService,
    OrganizationContextConfirmationService,
    TrustedRequestContextService,
    ContextAuthorizer,
    AsyncLocalStorageTrustedRequestContextStore,
  ],
})
export class RequestContextModule {}
