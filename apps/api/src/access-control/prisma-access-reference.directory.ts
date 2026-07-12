import { Inject, Injectable } from '@nestjs/common';
import type {
  AccessReferenceDirectory,
  AccessReferenceRecord,
  AccessReferenceStatus,
} from '@newax/access-control';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaAccessReferenceDirectory implements AccessReferenceDirectory {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMembershipById(id: string): Promise<AccessReferenceRecord | null> {
    const record = await this.prisma.coreMembership.findUnique({
      where: { id },
      select: { id: true, organizationId: true, status: true },
    });
    return record === null
      ? null
      : {
          id: record.id,
          organizationId: record.organizationId,
          status: this.mapStatus(record.status),
        };
  }

  async findOrganizationById(id: string): Promise<AccessReferenceRecord | null> {
    const record = await this.prisma.coreOrganization.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    return record === null
      ? null
      : {
          id: record.id,
          organizationId: record.id,
          status: this.mapStatus(record.status),
        };
  }

  private mapStatus(value: string): AccessReferenceStatus {
    if (value === 'active' || value === 'suspended' || value === 'archived' || value === 'ended') {
      return value;
    }
    throw new Error(`Unsupported access reference status: ${value}`);
  }
}
