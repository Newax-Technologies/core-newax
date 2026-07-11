import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type {
  HttpRateLimitInput,
  HttpRateLimitResult,
  HttpRateLimitStore,
  HttpSecurityClock,
  HttpSecurityCrypto,
} from '@newax/http-security';
import type { RequestIdFactory } from '@newax/request-context';

interface RateLimitBucket {
  count: number;
  resetAtMilliseconds: number;
}

@Injectable()
export class NodeHttpSecurityCrypto implements HttpSecurityCrypto {
  constructor(private readonly secret: string) {
    if (secret.length < 32) {
      throw new Error('HTTP CSRF secret must contain at least 32 characters.');
    }
  }

  issueRandomValue(bytes: number): string {
    if (!Number.isInteger(bytes) || bytes < 16 || bytes > 128) {
      throw new Error('Random value size must be between 16 and 128 bytes.');
    }
    return randomBytes(bytes).toString('base64url');
  }

  sign(domain: string, value: string): string {
    return createHmac('sha256', this.secret)
      .update(domain)
      .update('\0')
      .update(value)
      .digest('hex');
  }

  equals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      const dummy = Buffer.alloc(Math.max(leftBuffer.length, rightBuffer.length, 1));
      timingSafeEqual(dummy, dummy);
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}

@Injectable()
export class SystemHttpSecurityClock implements HttpSecurityClock {
  now(): Date {
    return new Date();
  }
}

@Injectable()
export class HttpRequestIdFactory implements RequestIdFactory {
  issue(): string {
    return randomUUID();
  }
}

@Injectable()
export class MemoryHttpRateLimitStore implements HttpRateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private operations = 0;

  async consume(input: HttpRateLimitInput): Promise<HttpRateLimitResult> {
    const occurredAtMilliseconds = input.occurredAt.getTime();
    this.operations += 1;
    if (this.operations % 1_000 === 0) {
      this.sweep(occurredAtMilliseconds);
    }

    const existing = this.buckets.get(input.key);
    const bucket =
      existing === undefined || existing.resetAtMilliseconds <= occurredAtMilliseconds
        ? {
            count: 0,
            resetAtMilliseconds:
              occurredAtMilliseconds + input.windowMilliseconds,
          }
        : existing;

    bucket.count += 1;
    this.buckets.set(input.key, bucket);
    this.enforceBoundedMemory();

    const remaining = Math.max(input.limit - bucket.count, 0);
    const retryAfterSeconds = Math.max(
      Math.ceil((bucket.resetAtMilliseconds - occurredAtMilliseconds) / 1_000),
      1,
    );
    return {
      allowed: bucket.count <= input.limit,
      remaining,
      retryAfterSeconds,
      resetAt: new Date(bucket.resetAtMilliseconds),
    };
  }

  private sweep(nowMilliseconds: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAtMilliseconds <= nowMilliseconds) {
        this.buckets.delete(key);
      }
    }
  }

  private enforceBoundedMemory(): void {
    const maximumBuckets = 100_000;
    while (this.buckets.size > maximumBuckets) {
      const oldestKey = this.buckets.keys().next().value as string | undefined;
      if (oldestKey === undefined) {
        return;
      }
      this.buckets.delete(oldestKey);
    }
  }
}
