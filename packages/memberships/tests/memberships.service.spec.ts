import { describe, expect, it } from 'vitest';

import type { MembershipsRepository } from '../src/database/memberships-repository';
import type {
  MembershipEvent,
  MembershipEventPublisher,
} from '../src/events/membership-event';
import { MEMBERSHIP_PERMISSIONS } from '../src/permissions/membership-permissions';
import type { MembershipReferenceDirectory } from '../src/services/membership-reference-directory';
import { MembershipsService } from '../src/services/memberships.service';
import type {
  CreateMembershipRecordInput,
  CreateMembershipResult,
  MembershipListQuery,
  MembershipPage,
  MembershipRecord,
  MembershipReferenceRecord,
  MembershipRequestContext,
  UpdateMembershipRecordInput,
} from '../src/types/membership';

const now = new Date('2026-07-11T00:00:00.000Z');

function membership(overrides: Partial<MembershipRecord> = {}): MembershipRecord {
  return {
    id: '00000000-0000-4000-8000-000000000100',
    personId: '00000000-0000-4000-8000-000000000001',
    organizationId: '00000000-0000-4000-8000-000000000010',
    membershipType: 'employee',
    referenceNumber: null,
    jobTitle: null,
    status: 'active',
    startDate: now,
    endDate: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeMembershipsRepository implements MembershipsRepository {
  readonly memberships = new Map<string, MembershipRecord>();
  conflictMembershipId: string | null = null;
  lastCreateInput: CreateMembershipRecordInput | null = null;

  async create(input: CreateMembershipRecordInput): Promise<CreateMembershipResult> {
    this.lastCreateInput = input;

    if (this.conflictMembershipId !== null) {
      return {
        status: 'conflict',
        existingMembershipId: this.conflictMembershipId,
      };
    }

    const created = membership({
      id: '00000000-0000-4000-8000-000000000200',
      ...input,
    });
    this.memberships.set(created.id, created);
    return { status: 'created', membership: created };
  }

  async findById(id: string): Promise<MembershipRecord | null> {
    return this.memberships.get(id) ?? null;
  }

  async list(
    organizationId: string,
    _query: MembershipListQuery,
  ): Promise<MembershipPage> {
    return {
      items: [...this.memberships.values()].filter(
        (current) => current.organizationId === organizationId,
      ),
      nextCursor: null,
    };
  }

  async remove(id: string, endedAt: Date): Promise<MembershipRecord> {
    const current = this.memberships.get(id);
    if (current === undefined) {
      throw new Error('Missing fake membership.');
    }

    const ended: MembershipRecord = {
      ...current,
      status: 'ended',
      endDate: endedAt,
      updatedAt: endedAt,
    };
    this.memberships.set(id, ended);
    return ended;
  }

  async update(
    id: string,
    input: UpdateMembershipRecordInput,
  ): Promise<MembershipRecord> {
    const current = this.memberships.get(id);
    if (current === undefined) {
      throw new Error('Missing fake membership.');
    }

    const updated: MembershipRecord = {
      ...current,
      referenceNumber:
        'referenceNumber' in input
          ? (input.referenceNumber ?? null)
          : current.referenceNumber,
      jobTitle: 'jobTitle' in input ? (input.jobTitle ?? null) : current.jobTitle,
      startDate: input.startDate ?? current.startDate,
      status: input.status ?? current.status,
      updatedAt: now,
    };
    this.memberships.set(id, updated);
    return updated;
  }
}

class FakeReferenceDirectory implements MembershipReferenceDirectory {
  readonly people = new Map<string, MembershipReferenceRecord>();
  readonly organizations = new Map<string, MembershipReferenceRecord>();

  async findOrganizationById(
    id: string,
  ): Promise<MembershipReferenceRecord | null> {
    return this.organizations.get(id) ?? null;
  }

  async findPersonById(id: string): Promise<MembershipReferenceRecord | null> {
    return this.people.get(id) ?? null;
  }
}

class RecordingMembershipEventPublisher implements MembershipEventPublisher {
  readonly events: MembershipEvent[] = [];

  async publish(event: MembershipEvent): Promise<void> {
    this.events.push(event);
  }
}

function context(...permissions: string[]): MembershipRequestContext {
  return {
    actorUserId: '00000000-0000-4000-8000-000000000999',
    organizationId: '00000000-0000-4000-8000-000000000010',
    permissionCodes: new Set(permissions),
  };
}

function activeReferences(directory: FakeReferenceDirectory): void {
  directory.people.set('00000000-0000-4000-8000-000000000001', {
    id: '00000000-0000-4000-8000-000000000001',
    status: 'active',
  });
  directory.organizations.set('00000000-0000-4000-8000-000000000010', {
    id: '00000000-0000-4000-8000-000000000010',
    status: 'active',
  });
}

describe('MembershipsService', () => {
  it('rejects operations without the required permission', async () => {
    const service = new MembershipsService(
      new FakeMembershipsRepository(),
      new FakeReferenceDirectory(),
      new RecordingMembershipEventPublisher(),
    );

    await expect(service.list(context())).rejects.toMatchObject({
      code: 'MEMBERSHIP_FORBIDDEN',
    });
  });

  it('normalizes membership input and emits membership.created', async () => {
    const repository = new FakeMembershipsRepository();
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    const publisher = new RecordingMembershipEventPublisher();
    const service = new MembershipsService(repository, references, publisher);

    const created = await service.create(context(MEMBERSHIP_PERMISSIONS.create), {
      personId: '00000000-0000-4000-8000-000000000001',
      membershipType: ' Staff Member ',
      referenceNumber: '  EMP-001  ',
      jobTitle: '  Operations Manager  ',
      startDate: new Date('2026-07-01T13:45:00.000Z'),
    });

    expect(created.membershipType).toBe('staff_member');
    expect(repository.lastCreateInput).toMatchObject({
      membershipType: 'staff_member',
      referenceNumber: 'EMP-001',
      jobTitle: 'Operations Manager',
      startDate: new Date('2026-07-01T00:00:00.000Z'),
    });
    expect(publisher.events[0]?.name).toBe('membership.created');
  });

  it('rejects membership creation for a suspended organization', async () => {
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    references.organizations.set('00000000-0000-4000-8000-000000000010', {
      id: '00000000-0000-4000-8000-000000000010',
      status: 'suspended',
    });

    const service = new MembershipsService(
      new FakeMembershipsRepository(),
      references,
      new RecordingMembershipEventPublisher(),
    );

    await expect(
      service.create(context(MEMBERSHIP_PERMISSIONS.create), {
        personId: '00000000-0000-4000-8000-000000000001',
        membershipType: 'employee',
      }),
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_ORGANIZATION_UNAVAILABLE' });
  });

  it('rejects duplicate active membership types', async () => {
    const repository = new FakeMembershipsRepository();
    repository.conflictMembershipId = '00000000-0000-4000-8000-000000000300';
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    const service = new MembershipsService(
      repository,
      references,
      new RecordingMembershipEventPublisher(),
    );

    await expect(
      service.create(context(MEMBERSHIP_PERMISSIONS.create), {
        personId: '00000000-0000-4000-8000-000000000001',
        membershipType: 'employee',
      }),
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_CONFLICT' });
  });

  it('does not expose memberships from another organization', async () => {
    const repository = new FakeMembershipsRepository();
    const foreign = membership({
      organizationId: '00000000-0000-4000-8000-000000000020',
    });
    repository.memberships.set(foreign.id, foreign);
    const service = new MembershipsService(
      repository,
      new FakeReferenceDirectory(),
      new RecordingMembershipEventPublisher(),
    );

    await expect(
      service.getById(context(MEMBERSHIP_PERMISSIONS.view), foreign.id),
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_NOT_FOUND' });
  });

  it('ends a membership without deleting it and emits membership.removed', async () => {
    const repository = new FakeMembershipsRepository();
    const record = membership();
    repository.memberships.set(record.id, record);
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    const publisher = new RecordingMembershipEventPublisher();
    const service = new MembershipsService(repository, references, publisher);

    const ended = await service.remove(
      context(MEMBERSHIP_PERMISSIONS.remove),
      record.id,
    );

    expect(ended.status).toBe('ended');
    expect(ended.endDate).not.toBeNull();
    expect(repository.memberships.has(record.id)).toBe(true);
    expect(publisher.events[0]?.name).toBe('membership.removed');
  });
});
