import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const API_PREFIX = 'api';
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;

function resolvePort(value: string | undefined): number {
  const port = value === undefined ? DEFAULT_PORT : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const host = process.env.HOST?.trim() || DEFAULT_HOST;
  const port = resolvePort(process.env.PORT);

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://${host}:${port}/${API_PREFIX}`);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const details = error instanceof Error ? error.stack ?? error.message : String(error);

  logger.error('API failed to start.', details);
  process.exitCode = 1;
});
