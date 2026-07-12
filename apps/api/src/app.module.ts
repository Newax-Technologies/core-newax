import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AccessControlModule } from './access-control/access-control.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PeopleModule } from './people/people.module';
import { RequestContextModule } from './request-context/request-context.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    OrganizationsModule,
    PeopleModule,
    MembershipsModule,
    AccessControlModule,
    UsersModule,
    AuthenticationModule,
    RequestContextModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
