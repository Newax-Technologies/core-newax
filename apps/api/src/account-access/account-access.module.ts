import { Module } from '@nestjs/common';

import { RequestContextModule } from '../request-context/request-context.module';
import { AccountMembershipsController } from './account-memberships.controller';

@Module({
  imports: [RequestContextModule],
  controllers: [AccountMembershipsController],
})
export class AccountAccessModule {}
