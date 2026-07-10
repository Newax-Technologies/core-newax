import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('returns the stable health response contract', () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-07-10T00:00:00.000Z');
    vi.spyOn(process, 'uptime').mockReturnValue(123.9);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'newax-api',
      timestamp: '2026-07-10T00:00:00.000Z',
      uptimeSeconds: 123,
    });
  });

  it('does not expose fractional uptime values', () => {
    vi.spyOn(process, 'uptime').mockReturnValue(42.99);

    expect(controller.getHealth().uptimeSeconds).toBe(42);
  });
});
