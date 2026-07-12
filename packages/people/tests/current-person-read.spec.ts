import { describe, expect, it } from 'vitest';

import type { PeopleRepository } from '../src/database/people-repository';
import type { PersonEvent, PersonEventPublisher } from '../src/events/person-event';
import { PeopleService } from '../src/services/people.service';
import type { CurrentPersonRequestContext, PersonRecord } from '../src/types/person';

const USER_ID = '00000000-0000-4000-8000-000000000001';
const PERSON_ID = '00000000-0000-4000-8000-000000000002';
const OTHER_PERSON_ID = '00000000-0000-4000-8000-000000000003';
const NOW = new Date('2026-07-12T00:00:00.000Z');

function person(overrides: Partial<PersonRecord> = {}): PersonRecord {
  return {
    id: PERSON_ID,
    firstName: 'Nadeem',
    middleName: 'Muhammad',
    lastName: 'Murtaza',
    preferredName: 'Nadeem',
    dateOfBirth: new Date('1995-01-01T00:00:00.000Z'),
    gender: 'male',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

class FakePeopleRepository {
  requestedId: string | null = null;
  record: PersonRecord | null = person();

  async findById(id: string): Promise<PersonRecord | null> {
    this.requestedId = id;
    return this.record;
  }
}

class NoopPersonEventPublisher implements PersonEventPublisher {
  async publish(_event: PersonEvent): Promise<void> {}
}

function createService(repository: FakePeopleRepository): PeopleService {
  return new PeopleService(
    repository as unknown as PeopleRepository,
    new NoopPersonEventPublisher(),
  );
}

function context(
  overrides: Partial<CurrentPersonRequestContext> = {},
): CurrentPersonRequestContext {
  return {
    actorUserId: USER_ID,
    personId: PERSON_ID,
    ...overrides,
  };
}

describe('PeopleService.getCurrent', () => {
  it('returns the bounded active profile without requiring people.view', async () => {
    const repository = new FakePeopleRepository();
    const profile = await createService(repository).getCurrent(context());

    expect(repository.requestedId).toBe(PERSON_ID);
    expect(profile).toEqual({
      id: PERSON_ID,
      firstName: 'Nadeem',
      middleName: 'Muhammad',
      lastName: 'Murtaza',
      preferredName: 'Nadeem',
      status: 'active',
    });
    expect(profile).not.toHaveProperty('dateOfBirth');
    expect(profile).not.toHaveProperty('gender');
    expect(profile).not.toHaveProperty('createdAt');
    expect(profile).not.toHaveProperty('updatedAt');
    expect(profile).not.toHaveProperty('deletedAt');
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it('rejects a malformed trusted actor UUID before persistence access', async () => {
    const repository = new FakePeopleRepository();

    await expect(
      createService(repository).getCurrent(context({ actorUserId: 'not-a-uuid' })),
    ).rejects.toMatchObject({ code: 'PERSON_INTEGRITY_FAILURE' });
    expect(repository.requestedId).toBeNull();
  });

  it('rejects an account context without a linked person', async () => {
    const repository = new FakePeopleRepository();
    const missingPersonContext = {
      actorUserId: USER_ID,
    } as unknown as CurrentPersonRequestContext;

    await expect(createService(repository).getCurrent(missingPersonContext)).rejects.toMatchObject({
      code: 'PERSON_INTEGRITY_FAILURE',
    });
    expect(repository.requestedId).toBeNull();
  });

  it('rejects a malformed linked person UUID before persistence access', async () => {
    const repository = new FakePeopleRepository();

    await expect(
      createService(repository).getCurrent(context({ personId: 'invalid-person' })),
    ).rejects.toMatchObject({ code: 'PERSON_INTEGRITY_FAILURE' });
    expect(repository.requestedId).toBeNull();
  });

  it('conceals a missing current person record', async () => {
    const repository = new FakePeopleRepository();
    repository.record = null;

    await expect(createService(repository).getCurrent(context())).rejects.toMatchObject({
      code: 'PERSON_NOT_FOUND',
      message: 'The current person profile is unavailable.',
    });
  });

  it.each([
    person({ status: 'suspended' }),
    person({ status: 'archived' }),
    person({ deletedAt: NOW }),
  ])('conceals an inactive or deleted current person', async (record) => {
    const repository = new FakePeopleRepository();
    repository.record = record;

    await expect(createService(repository).getCurrent(context())).rejects.toMatchObject({
      code: 'PERSON_NOT_FOUND',
      message: 'The current person profile is unavailable.',
    });
  });

  it('rejects a repository result outside the trusted person boundary', async () => {
    const repository = new FakePeopleRepository();
    repository.record = person({ id: OTHER_PERSON_ID });

    await expect(createService(repository).getCurrent(context())).rejects.toMatchObject({
      code: 'PERSON_INTEGRITY_FAILURE',
    });
  });

  it('rejects malformed persisted profile fields', async () => {
    const repository = new FakePeopleRepository();
    repository.record = person({ firstName: ' Nadeem' });

    await expect(createService(repository).getCurrent(context())).rejects.toMatchObject({
      code: 'PERSON_INTEGRITY_FAILURE',
    });
  });
});
