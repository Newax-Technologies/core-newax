import { Module } from '@nestjs/common';
import { ObjectsService } from '@newax/objects';

import { DatabaseModule } from '../database/database.module';
import { LoggingObjectEventPublisher } from './logging-object-event.publisher';
import { PrismaObjectsRepository } from './prisma-objects.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaObjectsRepository,
    LoggingObjectEventPublisher,
    {
      provide: ObjectsService,
      inject: [PrismaObjectsRepository, LoggingObjectEventPublisher],
      useFactory: (
        repository: PrismaObjectsRepository,
        eventPublisher: LoggingObjectEventPublisher,
      ): ObjectsService => new ObjectsService(repository, eventPublisher),
    },
  ],
  exports: [ObjectsService],
})
export class ObjectsModule {}
