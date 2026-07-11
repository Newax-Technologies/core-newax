import type { TrustedRequestContext } from '@newax/request-context';

export interface HttpSecurityRequestAdapter {
  readonly method: string;
  readonly originalUrl?: string;
  readonly path?: string;
  readonly ip?: string;
  readonly secure?: boolean;
  readonly protocol?: string;
  readonly headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  newaxRequestId?: string;
  newaxRouteKey?: string;
  trustedContext?: TrustedRequestContext;
}

export interface HttpSecurityResponseAdapter {
  setHeader(name: string, value: string | readonly string[]): void;
  status(code: number): HttpSecurityResponseAdapter;
  json(body: unknown): void;
  end(): void;
}
