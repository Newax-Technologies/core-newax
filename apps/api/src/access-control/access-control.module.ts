import { Module } from '@nestjs/common';
import {
  AccessControlService,
  PermissionEvaluator,
} from '@newax/access-control';

import { DatabaseModule } from '../database/database.module';
import { LoggingAccessControlEventPublisher } from './logging-access-control-event.publisher';
import { PrismaAccessControlRepository } from './prisma-access-control.repository';
import { PrismaAccessReferenceDirectory } from './prisma-access-reference.directory';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaAccessControlRepository,
    PrismaAccessReferenceDirectory,
    LoggingAccessControlEventPublisher,
    {
      provide: AccessControlService,
      inject: [
        PrismaAccessControlRepository,
        PrismaAccessReferenceDirectory,
        LoggingAccessControlEventPublisher,
      ],
      useFactory: (
        repository: PrismaAccessControlRepository,
        referenceDirectory: PrismaAccessReferenceDirectory,
        eventPublisher: LoggingAccessControlEventPublisher,
      ): AccessControlService =>
        new AccessControlService(repository, referenceDirectory, eventPublisher),
    },
    {
      provide: PermissionEvaluator,
      inject: [PrismaAccessControlRepository, PrismaAccessReferenceDirectory],
      useFactory: (
        repository: PrismaAccessControlRepository,
        referenceDirectory: PrismaAccessReferenceDirectory,
      ): PermissionEvaluator => new PermissionEvaluator(repository, referenceDirectory),
    },
  ],
  exports: [AccessControlService, PermissionEvaluator],
})
export class AccessControlModule {}
