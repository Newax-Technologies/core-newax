import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { SensitiveResponseRedactor } from '@newax/http-security';
import { from, lastValueFrom, map, type Observable } from 'rxjs';

import { AsyncLocalStorageTrustedRequestContextStore } from '../request-context/node-request-context.infrastructure';
import type { HttpSecurityRequestAdapter } from './http-security-request';

@Injectable()
export class HttpSecurityInterceptor implements NestInterceptor {
  constructor(
    private readonly contextStore: AsyncLocalStorageTrustedRequestContextStore,
    private readonly redactor: SensitiveResponseRedactor,
  ) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = executionContext
      .switchToHttp()
      .getRequest<HttpSecurityRequestAdapter>();
    const context = request.trustedContext;

    if (context === undefined) {
      return next.handle().pipe(map((value) => this.redactor.redact(value)));
    }

    return from(
      this.contextStore.run(context, async () => await lastValueFrom(next.handle())),
    ).pipe(map((value) => this.redactor.redact(value)));
  }
}
