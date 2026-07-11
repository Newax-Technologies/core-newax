import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { OrganizationsModule } from './organizations/organizations.module';
import { PeopleModule } from './people/people.module';

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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
