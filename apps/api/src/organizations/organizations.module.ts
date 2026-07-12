import { Module } from '@nestjs/common';
import { OrganizationsService } from '@newax/organizations';

import { DatabaseModule } from '../database/database.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { CurrentOrganizationController } from './current-organization.controller';
import { LoggingOrganizationEventPublisher } from './logging-organization-event.publisher';
import { PrismaOrganizationRepository } from './prisma-organization.repository';

@Module({
  imports: [DatabaseModule, RequestContextModule],
  controllers: [CurrentOrganizationController],
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
