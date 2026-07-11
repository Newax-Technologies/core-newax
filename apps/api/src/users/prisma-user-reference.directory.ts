import { Inject, Injectable } from '@nestjs/common';
import type {
  UserReferenceDirectory,
  UserReferenceRecord,
  UserReferenceStatus,
} from '@newax/users';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaUserReferenceDirectory implements UserReferenceDirectory {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMembership(
    personId: string,
    organizationId: string,
  ): Promise<UserReferenceRecord | null> {
    const record = await this.prisma.coreMembership.findFirst({
      where: { personId, organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        personId: true,
        organizationId: true,
        status: true,
      },
    });
    return record === null
      ? null
      : {
          id: record.id,
          personId: record.personId,
          organizationId: record.organizationId,
          status: this.mapStatus(record.status),
        };
  }

  async findOrganizationById(organizationId: string): Promise<UserReferenceRecord | null> {
    const record = await this.prisma.coreOrganization.findUnique({
      where: { id: organizationId },
      select: { id: true, status: true },
    });
    return record === null
      ? null
      : {
          id: record.id,
          personId: null,
          organizationId: record.id,
          status: this.mapStatus(record.status),
        };
  }

  async findPersonById(personId: string): Promise<UserReferenceRecord | null> {
    const record = await this.prisma.corePerson.findUnique({
      where: { id: personId },
      select: { id: true, status: true },
    });
    return record === null
      ? null
      : {
          id: record.id,
          personId: record.id,
          organizationId: null,
          status: this.mapStatus(record.status),
        };
  }

  private mapStatus(value: string): UserReferenceStatus {
    if (
      value === 'active' ||
      value === 'suspended' ||
      value === 'disabled' ||
      value === 'archived' ||
      value === 'ended'
    ) {
      return value;
    }
    throw new Error(`Unsupported user reference status: ${value}`);
  }
}
