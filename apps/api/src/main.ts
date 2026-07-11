import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import type { ApplicationEnvironment } from './config/environment';

const API_PREFIX = 'api';

interface ExpressApplicationAdapter {
  set(name: string, value: unknown): void;
  disable(name: string): void;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configuration = app.get<ConfigService<ApplicationEnvironment, true>>(
    ConfigService,
  );
  const host = configuration.get('HOST', { infer: true });
  const port = configuration.get('PORT', { infer: true });
  const allowedOrigins = configuration.get('HTTP_ALLOWED_ORIGINS', {
    infer: true,
  });
  const trustProxyHops = configuration.get('HTTP_TRUST_PROXY_HOPS', {
    infer: true,
  });
  const express = app.getHttpAdapter().getInstance() as ExpressApplicationAdapter;

  express.set('trust proxy', trustProxyHops);
  express.disable('x-powered-by');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ): void => {
      if (origin === undefined || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('The request origin is not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'content-type',
      'x-newax-csrf',
      'x-newax-membership-id',
      'x-request-id',
    ],
    exposedHeaders: [
      'x-request-id',
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset',
    ],
    maxAge: 600,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  logger.log(
    `API listening on ${host}:${String(port)}/${API_PREFIX}; external HTTPS enforcement is ${
      configuration.get('HTTP_REQUIRE_HTTPS', { infer: true })
        ? 'enabled'
        : 'disabled'
    }.`,
  );
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const details =
    error instanceof Error ? (error.stack ?? error.message) : String(error);

  logger.error('API failed to start.', details);
  process.exitCode = 1;
});
