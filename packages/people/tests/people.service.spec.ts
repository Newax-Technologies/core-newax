import { describe, expect, it } from 'vitest';

import type { PeopleRepository } from '../src/database/people-repository';
import type { PersonEvent, PersonEventPublisher } from '../src/events/person-event';
import { PEOPLE_PERMISSIONS } from '../src/permissions/people-permissions';
import { PeopleService } from '../src/services/people.service';
import type {
  CreatePersonIdentifierRecordInput,
  CreatePersonIdentifierResult,
  CreatePersonRecordInput,
  PersonIdentifierRecord,
  PersonListQuery,
  PersonPage,
  PersonRecord,
  PeopleRequestContext,
  UpdatePersonRecordInput,
} from '../src/types/person';

const now = new Date('2026-07-11T00:00:00.000Z');

function person(overrides: Partial<PersonRecord> = {}): PersonRecord {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    firstName: 'Nadeem',
    middleName: null,
    lastName: 'Murtaza',
    preferredName: null,
    dateOfBirth: null,
    gender: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function identifier(overrides: Partial<PersonIdentifierRecord> = {}): PersonIdentifierRecord {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    personId: '00000000-0000-4000-8000-000000000001',
    identifierType: 'national_id',
    identifierValue: '3520212345671',
    issuingAuthority: 'NADRA',
    issuingCountryCode: 'PK',
    validFrom: null,
    validUntil: null,
    isVerified: false,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakePeopleRepository implements PeopleRepository {
  readonly people = new Map<string, PersonRecord>();
  readonly identifiers = new Map<string, PersonIdentifierRecord>();
  conflictPersonId: string | null = null;
  lastCreateInput: CreatePersonRecordInput | null = null;
  lastIdentifierInput: CreatePersonIdentifierRecordInput | null = null;

  async archive(id: string, archivedAt: Date): Promise<PersonRecord> {
    const current = this.people.get(id);
    if (current === undefined) {
      throw new Error('Missing fake person.');
    }

    const archived: PersonRecord = {
      ...current,
      status: 'archived',
      deletedAt: archivedAt,
      updatedAt: archivedAt,
    };
    this.people.set(id, archived);
    return archived;
  }

  async create(input: CreatePersonRecordInput): Promise<PersonRecord> {
    this.lastCreateInput = input;
    const created = person({
      id: '00000000-0000-4000-8000-000000000020',
      ...input,
    });
    this.people.set(created.id, created);
    return created;
  }

  async createIdentifier(
    input: CreatePersonIdentifierRecordInput,
  ): Promise<CreatePersonIdentifierResult> {
    this.lastIdentifierInput = input;

    if (this.conflictPersonId !== null) {
      return { status: 'conflict', existingPersonId: this.conflictPersonId };
    }

    const created = identifier({
      id: '00000000-0000-4000-8000-000000000030',
      ...input,
    });
    this.identifiers.set(created.id, created);
    return { status: 'created', identifier: created };
  }

  async findById(id: string): Promise<PersonRecord | null> {
    return this.people.get(id) ?? null;
  }

  async findIdentifierById(id: string): Promise<PersonIdentifierRecord | null> {
    return this.identifiers.get(id) ?? null;
  }

  async list(_query: PersonListQuery): Promise<PersonPage> {
    return { items: [...this.people.values()], nextCursor: null };
  }

  async listIdentifiers(personId: string): Promise<readonly PersonIdentifierRecord[]> {
    return [...this.identifiers.values()].filter(
      (currentIdentifier) => currentIdentifier.personId === personId,
    );
  }

  async update(id: string, input: UpdatePersonRecordInput): Promise<PersonRecord> {
    const current = this.people.get(id);
    if (current === undefined) {
      throw new Error('Missing fake person.');
    }

    const updated: PersonRecord = {
      ...current,
      firstName: input.firstName ?? current.firstName,
      middleName: 'middleName' in input ? (input.middleName ?? null) : current.middleName,
      lastName: input.lastName ?? current.lastName,
      preferredName:
        'preferredName' in input ? (input.preferredName ?? null) : current.preferredName,
      dateOfBirth: 'dateOfBirth' in input ? (input.dateOfBirth ?? null) : current.dateOfBirth,
      gender: 'gender' in input ? (input.gender ?? null) : current.gender,
      updatedAt: now,
    };
    this.people.set(id, updated);
    return updated;
  }

  async verifyIdentifier(id: string, verifiedAt: Date): Promise<PersonIdentifierRecord> {
    const current = this.identifiers.get(id);
    if (current === undefined) {
      throw new Error('Missing fake identifier.');
    }

    const verified: PersonIdentifierRecord = {
      ...current,
      isVerified: true,
      verifiedAt,
      updatedAt: verifiedAt,
    };
    this.identifiers.set(id, verified);
    return verified;
  }
}

class RecordingPersonEventPublisher implements PersonEventPublisher {
  readonly events: PersonEvent[] = [];

  async publish(event: PersonEvent): Promise<void> {
    this.events.push(event);
  }
}

function context(...permissions: string[]): PeopleRequestContext {
  return {
    actorUserId: '00000000-0000-4000-8000-000000000099',
    permissionCodes: new Set(permissions),
  };
}

describe('PeopleService', () => {
  it('rejects operations without the required permission', async () => {
    const service = new PeopleService(
      new FakePeopleRepository(),
      new RecordingPersonEventPublisher(),
    );

    await expect(service.list(context())).rejects.toMatchObject({
      code: 'PERSON_FORBIDDEN',
    });
  });

  it('normalizes person input and emits person.created', async () => {
    const repository = new FakePeopleRepository();
    const publisher = new RecordingPersonEventPublisher();
    const service = new PeopleService(repository, publisher);

    const created = await service.create(context(PEOPLE_PERMISSIONS.create), {
      firstName: '  Nadeem  ',
      middleName: '  ',
      lastName: '  Murtaza  ',
      preferredName: '  Nadeem  ',
      gender: '  male  ',
    });

    expect(created.firstName).toBe('Nadeem');
    expect(repository.lastCreateInput).toEqual({
      firstName: 'Nadeem',
      middleName: null,
      lastName: 'Murtaza',
      preferredName: 'Nadeem',
      dateOfBirth: null,
      gender: 'male',
    });
    expect(publisher.events[0]?.name).toBe('person.created');
  });

  it('rejects a future date of birth', async () => {
    const service = new PeopleService(
      new FakePeopleRepository(),
      new RecordingPersonEventPublisher(),
    );

    await expect(
      service.create(context(PEOPLE_PERMISSIONS.create), {
        firstName: 'Future',
        lastName: 'Person',
        dateOfBirth: new Date('2999-01-01T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'PERSON_INVALID_INPUT' });
  });

  it('normalizes identifiers and rejects cross-person conflicts', async () => {
    const repository = new FakePeopleRepository();
    const record = person();
    repository.people.set(record.id, record);
    repository.conflictPersonId = '00000000-0000-4000-8000-000000000002';

    const service = new PeopleService(repository, new RecordingPersonEventPublisher());

    await expect(
      service.addIdentifier(context(PEOPLE_PERMISSIONS.identifiersManage), record.id, {
        identifierType: ' National ID ',
        identifierValue: '35202-1234567-1',
        issuingAuthority: ' nadra ',
        issuingCountryCode: 'pk',
      }),
    ).rejects.toMatchObject({ code: 'PERSON_IDENTIFIER_CONFLICT' });

    expect(repository.lastIdentifierInput).toMatchObject({
      identifierType: 'national_id',
      identifierValue: '3520212345671',
      issuingAuthority: 'NADRA',
      issuingCountryCode: 'PK',
    });
  });

  it('verifies an identifier and emits person.identifier_verified', async () => {
    const repository = new FakePeopleRepository();
    const record = person();
    const personIdentifier = identifier({ personId: record.id });
    repository.people.set(record.id, record);
    repository.identifiers.set(personIdentifier.id, personIdentifier);
    const publisher = new RecordingPersonEventPublisher();
    const service = new PeopleService(repository, publisher);

    const verified = await service.verifyIdentifier(
      context(PEOPLE_PERMISSIONS.identifiersManage),
      record.id,
      personIdentifier.id,
    );

    expect(verified.isVerified).toBe(true);
    expect(publisher.events[0]?.name).toBe('person.identifier_verified');
  });
});
