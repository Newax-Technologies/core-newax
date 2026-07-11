import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticationService,
  validateAuthenticationPolicy,
} from '@newax/auth';

import type { ApplicationEnvironment } from '../config/environment';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { LoggingAuthenticationEventPublisher } from './logging-authentication-event.publisher';
import {
  BaselinePasswordBlocklist,
  NodeLoginFingerprintService,
  NodePasswordHasher,
  NodeSessionTokenService,
  SystemAuthenticationClock,
} from './node-authentication-security';
import { PrismaAuthenticationRepository } from './prisma-authentication.repository';
import { UsersAuthenticationDirectory } from './users-authentication.directory';

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [
    PrismaAuthenticationRepository,
    UsersAuthenticationDirectory,
    LoggingAuthenticationEventPublisher,
    NodePasswordHasher,
    BaselinePasswordBlocklist,
    SystemAuthenticationClock,
    {
      provide: NodeSessionTokenService,
      inject: [ConfigService],
      useFactory: (
        configuration: ConfigService<ApplicationEnvironment, true>,
      ): NodeSessionTokenService =>
        new NodeSessionTokenService(
          configuration.get('AUTH_TOKEN_PEPPER', { infer: true }),
        ),
    },
    {
      provide: NodeLoginFingerprintService,
      inject: [ConfigService],
      useFactory: (
        configuration: ConfigService<ApplicationEnvironment, true>,
      ): NodeLoginFingerprintService =>
        new NodeLoginFingerprintService(
          configuration.get('AUTH_TOKEN_PEPPER', { infer: true }),
        ),
    },
    {
      provide: AuthenticationService,
      inject: [
        PrismaAuthenticationRepository,
        UsersAuthenticationDirectory,
        NodePasswordHasher,
        BaselinePasswordBlocklist,
        NodeSessionTokenService,
        NodeLoginFingerprintService,
        SystemAuthenticationClock,
        LoggingAuthenticationEventPublisher,
        ConfigService,
      ],
      useFactory: (
        repository: PrismaAuthenticationRepository,
        userDirectory: UsersAuthenticationDirectory,
        passwordHasher: NodePasswordHasher,
        passwordBlocklist: BaselinePasswordBlocklist,
        sessionTokenService: NodeSessionTokenService,
        loginFingerprintService: NodeLoginFingerprintService,
        clock: SystemAuthenticationClock,
        eventPublisher: LoggingAuthenticationEventPublisher,
        configuration: ConfigService<ApplicationEnvironment, true>,
      ): AuthenticationService =>
        new AuthenticationService(
          repository,
          userDirectory,
          passwordHasher,
          passwordBlocklist,
          sessionTokenService,
          loginFingerprintService,
          clock,
          eventPublisher,
          validateAuthenticationPolicy({
            passwordMinimumLength: configuration.get(
              'AUTH_PASSWORD_MINIMUM_LENGTH',
              { infer: true },
            ),
            passwordMaximumLength: configuration.get(
              'AUTH_PASSWORD_MAXIMUM_LENGTH',
              { infer: true },
            ),
            sessionTtlMinutes: configuration.get(
              'AUTH_SESSION_TTL_MINUTES',
              { infer: true },
            ),
            failedAttemptWindowMinutes: configuration.get(
              'AUTH_FAILED_ATTEMPT_WINDOW_MINUTES',
              { infer: true },
            ),
            maximumFailedAttempts: configuration.get(
              'AUTH_MAXIMUM_FAILED_ATTEMPTS',
              { infer: true },
            ),
            accountLockMinutes: configuration.get('AUTH_ACCOUNT_LOCK_MINUTES', {
              infer: true,
            }),
            sessionTouchIntervalMinutes: configuration.get(
              'AUTH_SESSION_TOUCH_INTERVAL_MINUTES',
              { infer: true },
            ),
          }),
        ),
    },
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
