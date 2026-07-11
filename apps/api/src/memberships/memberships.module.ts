import { Module } from '@nestjs/common';
import { MembershipsService } from '@newax/memberships';

import { DatabaseModule } from '../database/database.module';
import { LoggingMembershipEventPublisher } from './logging-membership-event.publisher';
import { PrismaMembershipReferenceDirectory } from './prisma-membership-reference.directory';
import { PrismaMembershipsRepository } from './prisma-memberships.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaMembershipsRepository,
    PrismaMembershipReferenceDirectory,
    LoggingMembershipEventPublisher,
    {
      provide: MembershipsService,
      inject: [
        PrismaMembershipsRepository,
        PrismaMembershipReferenceDirectory,
        LoggingMembershipEventPublisher,
      ],
      useFactory: (
        repository: PrismaMembershipsRepository,
        referenceDirectory: PrismaMembershipReferenceDirectory,
        eventPublisher: LoggingMembershipEventPublisher,
      ): MembershipsService =>
        new MembershipsService(repository, referenceDirectory, eventPublisher),
    },
  ],
  exports: [MembershipsService],
})
export class MembershipsModule {}
