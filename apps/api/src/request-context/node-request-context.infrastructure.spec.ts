import { describe, expect, it } from 'vitest';

import type { TrustedAccountRequestContext } from '@newax/request-context';

import { AsyncLocalStorageTrustedRequestContextStore } from './node-request-context.infrastructure';

function accountContext(
  requestId: string,
): TrustedAccountRequestContext {
  return {
    scope: 'account',
    requestId,
    userId: `user-${requestId}`,
    personId: `person-${requestId}`,
    sessionId: `session-${requestId}`,
    sessionExpiresAt: new Date('2026-07-12T08:00:00.000Z'),
  };
}

describe('AsyncLocalStorageTrustedRequestContextStore', () => {
  it('does not expose context outside an established operation', () => {
    const store = new AsyncLocalStorageTrustedRequestContextStore();

    expect(store.get()).toBeNull();
    expect(() => store.require()).toThrowError(
      expect.objectContaining({ code: 'REQUEST_CONTEXT_NOT_ESTABLISHED' }),
    );
  });

  it('isolates concurrent request contexts', async () => {
    const store = new AsyncLocalStorageTrustedRequestContextStore();
    const first = accountContext('first');
    const second = accountContext('second');

    const results = await Promise.all([
      store.run(first, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return store.require().requestId;
      }),
      store.run(second, async () => {
        await Promise.resolve();
        return store.require().requestId;
      }),
    ]);

    expect(results).toEqual(['first', 'second']);
    expect(store.get()).toBeNull();
  });
});
