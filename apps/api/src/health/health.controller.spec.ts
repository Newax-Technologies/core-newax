import { beforeEach, describe, expect, it } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('returns the stable health response contract', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'newax-api',
    });
  });

  it('does not expose process timing information', () => {
    expect(controller.getHealth()).not.toHaveProperty('timestamp');
    expect(controller.getHealth()).not.toHaveProperty('uptimeSeconds');
  });
});
