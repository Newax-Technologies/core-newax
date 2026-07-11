import { describe, expect, it } from 'vitest';

import type { UsersRepository } from '../src/database/users-repository';
import type { UserEvent, UserEventPublisher } from '../src/events/user-event';
import { USER_PERMISSIONS } from '../src/permissions/user-permissions';
import type { UserReferenceDirectory } from '../src/services/user-reference-directory';
import { UserIdentityNormalizer } from '../src/services/user-identity-normalizer';
import { UsersService } from '../src/services/users.service';
import type {
  AddUserIdentityRecordInput,
  AddUserIdentityResult,
  AuthenticationUserRecord,
  CreateUserRecordInput,
  CreateUserResult,
  RemoveUserIdentityResult,
  UserIdentityRecord,
  UserIdentityType,
  UserListQuery,
  UserPage,
  UserRecord,
  UserReferenceRecord,
  UserRequestContext,
  UserStatus,
} from '../src/types/user';

const now = new Date('2026-07-11T00:00:00.000Z');

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: '00000000-0000-4000-8000-000000000100',
    personId: '00000000-0000-4000-8000-000000000001',
    status: 'invited',
    lastLoginAt: null,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function identity(overrides: Partial<UserIdentityRecord> = {}): UserIdentityRecord {
  return {
    id: '00000000-0000-4000-8000-000000000200',
    userId: '00000000-0000-4000-8000-000000000100',
    identityType: 'email',
    identityValue: 'person@example.com',
    normalizedValue: 'person@example.com',
    isPrimary: true,
    isVerified: false,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeUsersRepository implements UsersRepository {
  readonly users = new Map<string, UserRecord>();
  readonly identities = new Map<string, UserIdentityRecord>();
  createResult: CreateUserResult | null = null;
  lastCreateInput: CreateUserRecordInput | null = null;

  async addIdentity(
    input: AddUserIdentityRecordInput,
  ): Promise<AddUserIdentityResult> {
    const created = identity({
      id: '00000000-0000-4000-8000-000000000201',
      ...input,
      isPrimary: input.makePrimary,
    });
    this.identities.set(created.id, created);
    return { status: 'created', identity: created };
  }

  async create(input: CreateUserRecordInput): Promise<CreateUserResult> {
    this.lastCreateInput = input;
    if (this.createResult !== null) {
      return this.createResult;
    }
    const createdUser = user({ personId: input.personId });
    const createdIdentity = identity({
      userId: createdUser.id,
      identityType: input.identityType,
      identityValue: input.identityValue,
      normalizedValue: input.normalizedValue,
    });
    this.users.set(createdUser.id, createdUser);
    this.identities.set(createdIdentity.id, createdIdentity);
    return {
      status: 'created',
      user: createdUser,
      identity: createdIdentity,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async findByNormalizedIdentity(
    identityType: UserIdentityType,
    normalizedValue: string,
  ): Promise<AuthenticationUserRecord | null> {
    const found = [...this.identities.values()].find(
      (current) =>
        current.identityType === identityType &&
        current.normalizedValue === normalizedValue,
    );
    if (found === undefined) {
      return null;
    }
    const currentUser = this.users.get(found.userId);
    if (currentUser === undefined) {
      return null;
    }
    return {
      userId: currentUser.id,
      personId: currentUser.personId,
      userStatus: currentUser.status,
      lockedUntil: currentUser.lockedUntil,
      identityId: found.id,
      identityType: found.identityType,
      isVerified: found.isVerified,
    };
  }

  async list(
    _organizationId: string,
    _query: UserListQuery,
  ): Promise<UserPage> {
    return { items: [...this.users.values()], nextCursor: null };
  }

  async listIdentities(userId: string): Promise<readonly UserIdentityRecord[]> {
    return [...this.identities.values()].filter(
      (current) => current.userId === userId,
    );
  }

  async recordSuccessfulLogin(
    userId: string,
    occurredAt: Date,
  ): Promise<UserRecord | null> {
    const current = this.users.get(userId);
    if (current === undefined) {
      return null;
    }
    const updated = { ...current, lastLoginAt: occurredAt, lockedUntil: null };
    this.users.set(userId, updated);
    return updated;
  }

  async removeIdentity(
    _userId: string,
    identityId: string,
  ): Promise<RemoveUserIdentityResult> {
    if (!this.identities.has(identityId)) {
      return { status: 'not_found' };
    }
    this.identities.delete(identityId);
    return {
      status: 'removed',
      removedIdentityId: identityId,
      newPrimaryIdentityId: null,
    };
  }

  async setLockedUntil(
    userId: string,
    lockedUntil: Date | null,
  ): Promise<UserRecord | null> {
    const current = this.users.get(userId);
    if (current === undefined) {
      return null;
    }
    const updated = { ...current, lockedUntil };
    this.users.set(userId, updated);
    return updated;
  }

  async setPrimaryIdentity(
    userId: string,
    identityId: string,
  ): Promise<UserIdentityRecord | null> {
    const current = this.identities.get(identityId);
    if (current === undefined || current.userId !== userId) {
      return null;
    }
    const updated = { ...current, isPrimary: true };
    this.identities.set(identityId, updated);
    return updated;
  }

  async setStatus(id: string, status: UserStatus): Promise<UserRecord> {
    const current = this.users.get(id);
    if (current === undefined) {
      throw new Error('Missing fake user.');
    }
    const updated = { ...current, status };
    this.users.set(id, updated);
    return updated;
  }
}

class FakeReferenceDirectory implements UserReferenceDirectory {
  readonly people = new Map<string, UserReferenceRecord>();
  readonly organizations = new Map<string, UserReferenceRecord>();
  readonly memberships = new Map<string, UserReferenceRecord>();

  async findMembership(
    personId: string,
    organizationId: string,
  ): Promise<UserReferenceRecord | null> {
    return this.memberships.get(`${personId}|${organizationId}`) ?? null;
  }

  async findOrganizationById(
    organizationId: string,
  ): Promise<UserReferenceRecord | null> {
    return this.organizations.get(organizationId) ?? null;
  }

  async findPersonById(personId: string): Promise<UserReferenceRecord | null> {
    return this.people.get(personId) ?? null;
  }
}

class RecordingPublisher implements UserEventPublisher {
  readonly events: UserEvent[] = [];

  async publish(event: UserEvent): Promise<void> {
    this.events.push(event);
  }
}

function organizationContext(...permissions: string[]): UserRequestContext {
  return {
    actorUserId: '00000000-0000-4000-8000-000000000999',
    organizationId: '00000000-0000-4000-8000-000000000010',
    permissionCodes: new Set(permissions),
  };
}

function platformContext(...permissions: string[]): UserRequestContext {
  return {
    actorUserId: '00000000-0000-4000-8000-000000000999',
    organizationId: null,
    permissionCodes: new Set(permissions),
  };
}

function activeReferences(directory: FakeReferenceDirectory): void {
  const personId = '00000000-0000-4000-8000-000000000001';
  const organizationId = '00000000-0000-4000-8000-000000000010';
  directory.people.set(personId, {
    id: personId,
    personId,
    organizationId: null,
    status: 'active',
  });
  directory.organizations.set(organizationId, {
    id: organizationId,
    personId: null,
    organizationId,
    status: 'active',
  });
  directory.memberships.set(`${personId}|${organizationId}`, {
    id: '00000000-0000-4000-8000-000000000020',
    personId,
    organizationId,
    status: 'active',
  });
}

describe('UsersService', () => {
  it('requires explicit permissions', async () => {
    const service = new UsersService(
      new FakeUsersRepository(),
      new FakeReferenceDirectory(),
      new UserIdentityNormalizer(),
      new RecordingPublisher(),
    );

    await expect(service.list(organizationContext())).rejects.toMatchObject({
      code: 'USER_FORBIDDEN',
    });
  });

  it('creates an invited user only after person and membership validation', async () => {
    const repository = new FakeUsersRepository();
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    const publisher = new RecordingPublisher();
    const service = new UsersService(
      repository,
      references,
      new UserIdentityNormalizer(),
      publisher,
    );

    const created = await service.create(
      organizationContext(USER_PERMISSIONS.create),
      {
        personId: '00000000-0000-4000-8000-000000000001',
        primaryIdentity: {
          identityType: 'email',
          identityValue: ' PERSON@Example.COM ',
        },
      },
    );

    expect(created.status).toBe('invited');
    expect(repository.lastCreateInput?.normalizedValue).toBe(
      'person@example.com',
    );
    expect(publisher.events[0]?.name).toBe('user.created');
  });

  it('rejects creation without an active membership', async () => {
    const references = new FakeReferenceDirectory();
    activeReferences(references);
    references.memberships.clear();
    const service = new UsersService(
      new FakeUsersRepository(),
      references,
      new UserIdentityNormalizer(),
      new RecordingPublisher(),
    );

    await expect(
      service.create(organizationContext(USER_PERMISSIONS.create), {
        personId: '00000000-0000-4000-8000-000000000001',
        primaryIdentity: {
          identityType: 'email',
          identityValue: 'person@example.com',
        },
      }),
    ).rejects.toMatchObject({ code: 'USER_MEMBERSHIP_NOT_FOUND' });
  });

  it('requires platform context for account-wide suspension', async () => {
    const repository = new FakeUsersRepository();
    const current = user({ status: 'active' });
    repository.users.set(current.id, current);
    const service = new UsersService(
      repository,
      new FakeReferenceDirectory(),
      new UserIdentityNormalizer(),
      new RecordingPublisher(),
    );

    await expect(
      service.suspend(
        organizationContext(USER_PERMISSIONS.suspend),
        current.id,
      ),
    ).rejects.toMatchObject({ code: 'USER_PLATFORM_CONTEXT_REQUIRED' });

    const suspended = await service.suspend(
      platformContext(USER_PERMISSIONS.suspend),
      current.id,
    );
    expect(suspended.status).toBe('suspended');
  });

  it('conceals users outside the selected organization', async () => {
    const repository = new FakeUsersRepository();
    const current = user();
    repository.users.set(current.id, current);
    const service = new UsersService(
      repository,
      new FakeReferenceDirectory(),
      new UserIdentityNormalizer(),
      new RecordingPublisher(),
    );

    await expect(
      service.getById(
        organizationContext(USER_PERMISSIONS.view),
        current.id,
      ),
    ).rejects.toMatchObject({ code: 'USER_ACCOUNT_NOT_FOUND' });
  });
});
