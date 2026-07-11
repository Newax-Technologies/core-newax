import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import type { ApplicationEnvironment } from './config/environment';

const API_PREFIX = 'api';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configuration = app.get<ConfigService<ApplicationEnvironment, true>>(ConfigService);
  const host = configuration.get('HOST', { infer: true });
  const port = configuration.get('PORT', { infer: true });

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://${host}:${port}/${API_PREFIX}`);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const details = error instanceof Error ? (error.stack ?? error.message) : String(error);

  logger.error('API failed to start.', details);
  process.exitCode = 1;
});
