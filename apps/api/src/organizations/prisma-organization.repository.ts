import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateOrganizationRecordInput,
  OrganizationListQuery,
  OrganizationPage,
  OrganizationRecord,
  OrganizationRepository,
  OrganizationStatus,
  UpdateOrganizationRecordInput,
} from '@newax/organizations';

import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

interface OrganizationDatabaseRecord {
  readonly id: string;
  readonly parentOrganizationId: string | null;
  readonly legalName: string;
  readonly displayName: string;
  readonly organizationType: string;
  readonly registrationNumber: string | null;
  readonly taxNumber: string | null;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

interface OrganizationParentLookup {
  readonly parentOrganizationId: string | null;
}

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async archive(id: string, archivedAt: Date): Promise<OrganizationRecord> {
    const record = await this.prisma.coreOrganization.update({
      where: { id },
      data: {
        status: 'archived',
        deletedAt: archivedAt,
      },
    });

    return this.mapRecord(record);
  }

  async create(input: CreateOrganizationRecordInput): Promise<OrganizationRecord> {
    const data: Prisma.CoreOrganizationUncheckedCreateInput = {
      parentOrganizationId: input.parentOrganizationId,
      legalName: input.legalName,
      displayName: input.displayName,
      organizationType: input.organizationType,
      registrationNumber: input.registrationNumber,
      taxNumber: input.taxNumber,
    };

    const record = await this.prisma.coreOrganization.create({ data });
    return this.mapRecord(record);
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const record = await this.prisma.coreOrganization.findUnique({ where: { id } });
    return record === null ? null : this.mapRecord(record);
  }

  async hasActiveChildren(id: string): Promise<boolean> {
    const count = await this.prisma.coreOrganization.count({
      where: {
        parentOrganizationId: id,
        deletedAt: null,
        status: { not: 'archived' },
      },
    });

    return count > 0;
  }

  async list(query: OrganizationListQuery): Promise<OrganizationPage> {
    const limit = query.limit ?? 50;
    const where: Prisma.CoreOrganizationWhereInput = {};

    if ('parentOrganizationId' in query) {
      where.parentOrganizationId = query.parentOrganizationId ?? null;
    }

    if (query.status !== undefined) {
      where.status = query.status;
    } else {
      where.deletedAt = null;
    }

    if (query.search !== undefined) {
      where.OR = [
        { legalName: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.coreOrganization.findMany({
      where,
      orderBy: { id: 'asc' },
      take: limit + 1,
      ...(query.afterId === undefined ? {} : { cursor: { id: query.afterId }, skip: 1 }),
    });

    const hasMore = records.length > limit;
    const pageRecords = hasMore ? records.slice(0, limit) : records;
    const lastRecord = pageRecords.at(-1);

    return {
      items: pageRecords.map((record) => this.mapRecord(record)),
      nextCursor: hasMore && lastRecord !== undefined ? lastRecord.id : null,
    };
  }

  async update(id: string, input: UpdateOrganizationRecordInput): Promise<OrganizationRecord> {
    const data: Prisma.CoreOrganizationUncheckedUpdateInput = {};

    if ('parentOrganizationId' in input) {
      data.parentOrganizationId = input.parentOrganizationId ?? null;
    }

    if (input.legalName !== undefined) {
      data.legalName = input.legalName;
    }

    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }

    if (input.organizationType !== undefined) {
      data.organizationType = input.organizationType;
    }

    if ('registrationNumber' in input) {
      data.registrationNumber = input.registrationNumber ?? null;
    }

    if ('taxNumber' in input) {
      data.taxNumber = input.taxNumber ?? null;
    }

    const record = await this.prisma.coreOrganization.update({ where: { id }, data });
    return this.mapRecord(record);
  }

  async wouldCreateCycle(organizationId: string, candidateParentId: string): Promise<boolean> {
    let currentId: string | null = candidateParentId;

    for (let depth = 0; depth < 100 && currentId !== null; depth += 1) {
      if (currentId === organizationId) {
        return true;
      }

      const current: OrganizationParentLookup | null =
        await this.prisma.coreOrganization.findUnique({
          where: { id: currentId },
          select: { parentOrganizationId: true },
        });

      if (current === null) {
        return false;
      }

      currentId = current.parentOrganizationId;
    }

    return currentId !== null;
  }

  private mapRecord(record: OrganizationDatabaseRecord): OrganizationRecord {
    return {
      ...record,
      status: this.mapStatus(record.status),
    };
  }

  private mapStatus(status: string): OrganizationStatus {
    if (status === 'active' || status === 'suspended' || status === 'archived') {
      return status;
    }

    throw new Error(`Unsupported organization status: ${status}`);
  }
}
