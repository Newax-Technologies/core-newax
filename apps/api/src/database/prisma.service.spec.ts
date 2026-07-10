import { ConfigService } from '@nestjs/config';
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

    expect(service).toBeInstanceOf(PrismaService);
    expect(configService.get).toHaveBeenCalledWith('DATABASE_URL', { infer: true });
  });

  it('connects when the NestJS module initializes', async () => {
    const service = new PrismaService(
      createConfigService('postgresql://newax:secret@localhost:5432/newax'),
    );
    const connect = vi.spyOn(service, '$connect').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledOnce();
  });

  it('disconnects when the NestJS module is destroyed', async () => {
    const service = new PrismaService(
      createConfigService('postgresql://newax:secret@localhost:5432/newax'),
    );
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledOnce();
  });
});
