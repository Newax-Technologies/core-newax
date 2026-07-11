import { Inject, Injectable } from '@nestjs/common';
import type {
  MembershipReferenceDirectory,
  MembershipReferenceRecord,
  MembershipReferenceStatus,
} from '@newax/memberships';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaMembershipReferenceDirectory
  implements MembershipReferenceDirectory
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findOrganizationById(
    id: string,
  ): Promise<MembershipReferenceRecord | null> {
    const organization = await this.prisma.coreOrganization.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    return organization === null
      ? null
      : {
          id: organization.id,
          status: this.mapStatus(organization.status),
        };
  }

  async findPersonById(id: string): Promise<MembershipReferenceRecord | null> {
    const person = await this.prisma.corePerson.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    return person === null
      ? null
      : {
          id: person.id,
          status: this.mapStatus(person.status),
        };
  }

  private mapStatus(status: string): MembershipReferenceStatus {
    if (status === 'active' || status === 'suspended' || status === 'archived') {
      return status;
    }

    throw new Error(`Unsupported membership reference status: ${status}`);
  }
}
