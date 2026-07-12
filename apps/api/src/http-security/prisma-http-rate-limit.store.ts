import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  HttpRateLimitInput,
  HttpRateLimitResult,
  HttpRateLimitStore,
} from '@newax/http-security';

import { PrismaService } from '../database/prisma.service';
import { NodeHttpSecurityCrypto } from './node-http-security.infrastructure';

const RATE_LIMIT_KEY_DOMAIN = 'newax-http-rate-limit-v1';
const CLEANUP_INTERVAL = 1_000;
const EXPIRED_BUCKET_RETENTION_MILLISECONDS = 86_400_000;

interface RateLimitRow {
  readonly request_count: number;
  readonly reset_at: Date;
}

@Injectable()
export class PrismaHttpRateLimitStore implements HttpRateLimitStore {
  private readonly logger = new Logger(PrismaHttpRateLimitStore.name);
  private operations = 0;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NodeHttpSecurityCrypto)
    private readonly crypto: NodeHttpSecurityCrypto,
  ) {}

  async consume(input: HttpRateLimitInput): Promise<HttpRateLimitResult> {
    this.validateInput(input);
    const keyHash = this.crypto.sign(RATE_LIMIT_KEY_DOMAIN, input.key);
    const resetAt = new Date(input.occurredAt.getTime() + input.windowMilliseconds);

    const rows = await this.prisma.$queryRaw<readonly RateLimitRow[]>`
      INSERT INTO "core_http_rate_limit_buckets" (
        "key_hash",
        "request_count",
        "reset_at",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${keyHash},
        1,
        ${resetAt},
        ${input.occurredAt},
        ${input.occurredAt}
      )
      ON CONFLICT ("key_hash") DO UPDATE SET
        "request_count" = CASE
          WHEN "core_http_rate_limit_buckets"."reset_at" <= ${input.occurredAt}
            THEN 1
          ELSE "core_http_rate_limit_buckets"."request_count" + 1
        END,
        "reset_at" = CASE
          WHEN "core_http_rate_limit_buckets"."reset_at" <= ${input.occurredAt}
            THEN ${resetAt}
          ELSE "core_http_rate_limit_buckets"."reset_at"
        END,
        "updated_at" = ${input.occurredAt}
      RETURNING "request_count", "reset_at"
    `;
    const row = rows[0];
    if (row === undefined) {
      throw new Error('HTTP rate-limit persistence returned no result.');
    }

    this.operations += 1;
    if (this.operations % CLEANUP_INTERVAL === 0) {
      await this.cleanupExpiredBuckets(input.occurredAt);
    }

    const remaining = Math.max(input.limit - row.request_count, 0);
    const retryAfterSeconds = Math.max(
      Math.ceil((row.reset_at.getTime() - input.occurredAt.getTime()) / 1_000),
      1,
    );
    return {
      allowed: row.request_count <= input.limit,
      remaining,
      retryAfterSeconds,
      resetAt: new Date(row.reset_at.getTime()),
    };
  }

  private validateInput(input: HttpRateLimitInput): void {
    if (input.key.length === 0 || input.key.length > 512) {
      throw new Error('HTTP rate-limit key is invalid.');
    }
    if (!Number.isInteger(input.limit) || input.limit < 1) {
      throw new Error('HTTP rate-limit maximum must be a positive integer.');
    }
    if (!Number.isInteger(input.windowMilliseconds) || input.windowMilliseconds < 1_000) {
      throw new Error('HTTP rate-limit window must be at least one second.');
    }
    if (!(input.occurredAt instanceof Date) || Number.isNaN(input.occurredAt.getTime())) {
      throw new Error('HTTP rate-limit timestamp is invalid.');
    }
  }

  private async cleanupExpiredBuckets(occurredAt: Date): Promise<void> {
    const cutoff = new Date(occurredAt.getTime() - EXPIRED_BUCKET_RETENTION_MILLISECONDS);
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "core_http_rate_limit_buckets"
        WHERE "reset_at" < ${cutoff}
      `;
    } catch (error: unknown) {
      this.logger.error({
        event: 'http.rate_limit.cleanup_failed',
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }
}
