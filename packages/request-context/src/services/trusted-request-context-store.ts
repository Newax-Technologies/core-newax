import type { TrustedRequestContext } from '../types/request-context';

export interface TrustedRequestContextStore {
  get(): TrustedRequestContext | null;
  require(): TrustedRequestContext;
  run<Result>(
    context: TrustedRequestContext,
    operation: () => Result | Promise<Result>,
  ): Promise<Result>;
}
