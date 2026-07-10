import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from './app.module';
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
});
