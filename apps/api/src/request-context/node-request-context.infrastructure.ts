import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import {
  RequestContextError,
  type RequestIdFactory,
  type TrustedContextClock,
  type TrustedRequestContext,
  type TrustedRequestContextStore,
} from '@newax/request-context';

@Injectable()
export class NodeRequestIdFactory implements RequestIdFactory {
  issue(): string {
    return randomUUID();
  }
}

@Injectable()
export class SystemTrustedContextClock implements TrustedContextClock {
  now(): Date {
    return new Date();
  }
}

@Injectable()
export class AsyncLocalStorageTrustedRequestContextStore
  implements TrustedRequestContextStore
{
  private readonly storage = new AsyncLocalStorage<TrustedRequestContext>();

  get(): TrustedRequestContext | null {
    return this.storage.getStore() ?? null;
  }

  require(): TrustedRequestContext {
    const context = this.get();
    if (context === null) {
      throw new RequestContextError(
        'REQUEST_CONTEXT_NOT_ESTABLISHED',
        'A trusted request context has not been established.',
      );
    }
    return context;
  }

  async run<Result>(
    context: TrustedRequestContext,
    operation: () => Result | Promise<Result>,
  ): Promise<Result> {
    return await this.storage.run(context, operation);
  }
}
