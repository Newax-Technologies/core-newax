import { Module } from '@nestjs/common';
import { OrganizationsService } from '@newax/organizations';

import { DatabaseModule } from '../database/database.module';
import { LoggingOrganizationEventPublisher } from './logging-organization-event.publisher';
import { PrismaOrganizationRepository } from './prisma-organization.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaOrganizationRepository,
    LoggingOrganizationEventPublisher,
    {
      provide: OrganizationsService,
      inject: [PrismaOrganizationRepository, LoggingOrganizationEventPublisher],
      useFactory: (
        repository: PrismaOrganizationRepository,
        eventPublisher: LoggingOrganizationEventPublisher,
      ): OrganizationsService => new OrganizationsService(repository, eventPublisher),
    },
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
