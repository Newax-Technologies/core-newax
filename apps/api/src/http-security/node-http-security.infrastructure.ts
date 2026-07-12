import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { HttpSecurityClock, HttpSecurityCrypto } from '@newax/http-security';
import type { RequestIdFactory } from '@newax/request-context';

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
