import { Inject, Injectable } from '@nestjs/common';
import type { HttpAuditRecord, HttpSecurityAuditSink } from '@newax/http-security';

import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class PrismaHttpSecurityAuditSink implements HttpSecurityAuditSink {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(record: HttpAuditRecord): Promise<void> {
    await this.prisma.coreAuditLog.create({
      data: {
        organizationId: record.organizationId,
        actorUserId: record.actorUserId,
        moduleCode: 'http-security',
        action: record.action.slice(0, 160),
        entityType: 'http_route',
        entityId: record.routeKey.slice(0, 128),
        outcome: record.outcome,
        sensitivity: 'security',
        metadata: {
          ...record.metadata,
          method: record.method,
          statusCode: record.statusCode,
        } as Prisma.InputJsonValue,
        requestId: record.requestId.slice(0, 128),
        ipAddress: record.ipAddress?.slice(0, 64) ?? null,
        userAgent: record.userAgent?.slice(0, 1_024) ?? null,
        createdAt: record.occurredAt,
      },
    });
  }
}
