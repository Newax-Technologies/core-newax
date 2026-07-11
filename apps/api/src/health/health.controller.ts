import { Controller, Get, Header } from '@nestjs/common';

import { PublicEndpoint } from '../http-security/http-security.decorators';

interface HealthResponse {
  readonly status: 'ok';
  readonly service: 'newax-api';
  readonly timestamp: string;
  readonly uptimeSeconds: number;
}

@Controller('health')
@PublicEndpoint()
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'newax-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
