import type {
  HttpAuditRecord,
  HttpRateLimitInput,
  HttpRateLimitResult,
} from '../types/http-security';

export interface HttpSecurityCrypto {
  issueRandomValue(bytes: number): string;
  sign(domain: string, value: string): string;
  equals(left: string, right: string): boolean;
}

export interface HttpRateLimitStore {
  consume(input: HttpRateLimitInput): Promise<HttpRateLimitResult>;
}

export interface HttpSecurityAuditSink {
  record(record: HttpAuditRecord): Promise<void>;
}

export interface HttpSecurityClock {
  now(): Date;
}
