import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from './app.module';
import type { ApplicationEnvironment } from './config/environment';
import { HealthController } from './health/health.controller';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles the application composition root', () => {
    expect(moduleRef).toBeDefined();
  });

  it('registers the health controller', () => {
    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
  });

  it('registers validated configuration globally', () => {
    const configuration = moduleRef.get<ConfigService<ApplicationEnvironment, true>>(ConfigService);
    const nodeEnvironment = configuration.get('NODE_ENV', { infer: true });
    const host = configuration.get('HOST', { infer: true });
    const port = configuration.get('PORT', { infer: true });

    expect(['development', 'test', 'production']).toContain(nodeEnvironment);
    expect(host.trim().length).toBeGreaterThan(0);
    expect(Number.isInteger(port)).toBe(true);
    expect(port).toBeGreaterThanOrEqual(1);
    expect(port).toBeLessThanOrEqual(65_535);
  });
});
