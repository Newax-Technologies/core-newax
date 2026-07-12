import { Module } from '@nestjs/common';

import { RequestContextModule } from '../request-context/request-context.module';
import { AccountMembershipsController } from './account-memberships.controller';
import { OrganizationContextController } from './organization-context.controller';

@Module({
  imports: [RequestContextModule],
  controllers: [
    AccountMembershipsController,
    OrganizationContextController,
  ],
})
export class AccountAccessModule {}
