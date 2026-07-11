import { Module } from '@nestjs/common';
import { PeopleService } from '@newax/people';

import { DatabaseModule } from '../database/database.module';
import { LoggingPersonEventPublisher } from './logging-person-event.publisher';
import { PrismaPeopleRepository } from './prisma-people.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaPeopleRepository,
    LoggingPersonEventPublisher,
    {
      provide: PeopleService,
      inject: [PrismaPeopleRepository, LoggingPersonEventPublisher],
      useFactory: (
        repository: PrismaPeopleRepository,
        eventPublisher: LoggingPersonEventPublisher,
      ): PeopleService => new PeopleService(repository, eventPublisher),
    },
  ],
  exports: [PeopleService],
})
export class PeopleModule {}
