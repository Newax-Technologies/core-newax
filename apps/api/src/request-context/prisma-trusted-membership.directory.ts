import { Inject, Injectable } from '@nestjs/common';
import type {
  TrustedMembershipDirectory,
  TrustedMembershipRecord,
  TrustedMembershipStatus,
  TrustedOrganizationStatus,
} from '@newax/request-context';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaTrustedMembershipDirectory
  implements TrustedMembershipDirectory
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMembershipById(
    membershipId: string,
  ): Promise<TrustedMembershipRecord | null> {
    const record = await this.prisma.coreMembership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        personId: true,
        organizationId: true,
        status: true,
        organization: { select: { status: true } },
      },
    });

    return record === null
      ? null
      : {
          id: record.id,
          personId: record.personId,
          organizationId: record.organizationId,
          membershipStatus: this.mapMembershipStatus(record.status),
          organizationStatus: this.mapOrganizationStatus(
            record.organization.status,
          ),
        };
  }

  private mapMembershipStatus(value: string): TrustedMembershipStatus {
    if (value === 'active' || value === 'suspended' || value === 'ended') {
      return value;
    }
    throw new Error(`Unsupported membership status: ${value}`);
  }

  private mapOrganizationStatus(value: string): TrustedOrganizationStatus {
    if (value === 'active' || value === 'suspended' || value === 'archived') {
      return value;
    }
    throw new Error(`Unsupported organization status: ${value}`);
  }
}
