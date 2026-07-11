import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import type { ApplicationEnvironment } from '../config/environment';
import { PrismaService } from './prisma.service';

type ApplicationConfigService = ConfigService<ApplicationEnvironment, true>;

function createConfigService(databaseUrl?: string): ApplicationConfigService {
  return {
    get: vi.fn().mockReturnValue(databaseUrl),
  } as unknown as ApplicationConfigService;
}

describe('PrismaService', () => {
  it('requires a database connection URL', () => {
    expect(() => new PrismaService(createConfigService())).toThrow(
      'DATABASE_URL is required to initialize the database connection.',
    );
  });

  it('initializes the Prisma client with validated configuration', () => {
    const configService = createConfigService('postgresql://newax:secret@localhost:5432/newax');

    const service = new PrismaService(configService);

    expect(service).toBeTruthy();
    expect(configService.get).toHaveBeenCalledWith('DATABASE_URL', { infer: true });
  });

  it('connects when the NestJS module initializes', async () => {
    const connect = vi.fn().mockResolvedValue(undefined);
    const service = { $connect: connect } as unknown as PrismaService;

    await PrismaService.prototype.onModuleInit.call(service);

    expect(connect).toHaveBeenCalledOnce();
  });

  it('disconnects when the NestJS module is destroyed', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const service = { $disconnect: disconnect } as unknown as PrismaService;

    await PrismaService.prototype.onModuleDestroy.call(service);

    expect(disconnect).toHaveBeenCalledOnce();
  });
});
