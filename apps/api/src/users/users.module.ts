import { Module } from '@nestjs/common';
import { UserAuthenticationGateway, UserIdentityNormalizer, UsersService } from '@newax/users';

import { DatabaseModule } from '../database/database.module';
import { LoggingUserEventPublisher } from './logging-user-event.publisher';
import { PrismaUserReferenceDirectory } from './prisma-user-reference.directory';
import { PrismaUsersRepository } from './prisma-users.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaUsersRepository,
    PrismaUserReferenceDirectory,
    LoggingUserEventPublisher,
    UserIdentityNormalizer,
    {
      provide: UsersService,
      inject: [
        PrismaUsersRepository,
        PrismaUserReferenceDirectory,
        UserIdentityNormalizer,
        LoggingUserEventPublisher,
      ],
      useFactory: (
        repository: PrismaUsersRepository,
        referenceDirectory: PrismaUserReferenceDirectory,
        identityNormalizer: UserIdentityNormalizer,
        eventPublisher: LoggingUserEventPublisher,
      ): UsersService =>
        new UsersService(repository, referenceDirectory, identityNormalizer, eventPublisher),
    },
    {
      provide: UserAuthenticationGateway,
      inject: [PrismaUsersRepository, UserIdentityNormalizer],
      useFactory: (
        repository: PrismaUsersRepository,
        identityNormalizer: UserIdentityNormalizer,
      ): UserAuthenticationGateway => new UserAuthenticationGateway(repository, identityNormalizer),
    },
  ],
  exports: [UsersService, UserAuthenticationGateway],
})
export class UsersModule {}
