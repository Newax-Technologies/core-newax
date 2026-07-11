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
        action: record.action,
        entityType: 'http_route',
        entityId: record.routeKey.slice(0, 128),
        outcome: record.outcome,
        sensitivity: 'security',
        metadata: {
          method: record.method,
          statusCode: record.statusCode,
          ...record.metadata,
        } as Prisma.InputJsonValue,
        requestId: record.requestId,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
        createdAt: record.occurredAt,
      },
    });
  }
}
