import type { PeopleRepository } from '../database/people-repository';
import type { PersonEventPublisher } from '../events/person-event';
import { PeopleModuleError } from '../errors/people-module-error';
import { PEOPLE_PERMISSIONS, type PeoplePermission } from '../permissions/people-permissions';
import type {
  AddPersonIdentifierInput,
  CreatePersonInput,
  PersonIdentifierRecord,
  PersonListQuery,
  PersonPage,
  PersonRecord,
  PeopleRequestContext,
  UpdatePersonInput,
  UpdatePersonRecordInput,
} from '../types/person';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_NAME_LENGTH = 128;
const MAX_IDENTIFIER_LENGTH = 255;

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

export class PeopleService {
  constructor(
    private readonly repository: PeopleRepository,
    private readonly eventPublisher: PersonEventPublisher,
  ) {}

  async create(context: PeopleRequestContext, input: CreatePersonInput): Promise<PersonRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.create);

    const person = await this.repository.create({
      firstName: this.requireText(input.firstName, 'firstName', MAX_NAME_LENGTH),
      middleName: this.normalizeNullableText(input.middleName, 'middleName', MAX_NAME_LENGTH),
      lastName: this.requireText(input.lastName, 'lastName', MAX_NAME_LENGTH),
      preferredName: this.normalizeNullableText(
        input.preferredName,
        'preferredName',
        MAX_NAME_LENGTH,
      ),
      dateOfBirth: this.normalizeDateOfBirth(input.dateOfBirth),
      gender: this.normalizeNullableText(input.gender, 'gender', 32),
    });

    await this.eventPublisher.publish({
      name: 'person.created',
      actorUserId: context.actorUserId,
      personId: person.id,
      occurredAt: new Date(),
      person,
    });

    return person;
  }

  async getById(context: PeopleRequestContext, personId: string): Promise<PersonRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.view);
    return this.requirePerson(personId);
  }

  async list(context: PeopleRequestContext, query: PersonListQuery = {}): Promise<PersonPage> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.view);

    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        `limit must be an integer between 1 and ${String(MAX_PAGE_SIZE)}.`,
        { field: 'limit' },
      );
    }

    const normalizedQuery: Mutable<PersonListQuery> = { limit };

    if (query.status !== undefined) {
      normalizedQuery.status = query.status;
    }

    if (query.search !== undefined) {
      const search = this.requireText(query.search, 'search', 255);
      normalizedQuery.search = search;
    }

    if (query.afterId !== undefined) {
      normalizedQuery.afterId = this.requireText(query.afterId, 'afterId', 128);
    }

    return this.repository.list(normalizedQuery);
  }

  async update(
    context: PeopleRequestContext,
    personId: string,
    input: UpdatePersonInput,
  ): Promise<PersonRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.update);
    const current = await this.requirePerson(personId);

    if (current.status === 'archived') {
      throw new PeopleModuleError('PERSON_ARCHIVED', 'Archived people cannot be updated.', {
        personId,
      });
    }

    const update: Mutable<UpdatePersonRecordInput> = {};

    if (input.firstName !== undefined) {
      update.firstName = this.requireText(input.firstName, 'firstName', MAX_NAME_LENGTH);
    }

    if ('middleName' in input) {
      update.middleName = this.normalizeNullableText(
        input.middleName,
        'middleName',
        MAX_NAME_LENGTH,
      );
    }

    if (input.lastName !== undefined) {
      update.lastName = this.requireText(input.lastName, 'lastName', MAX_NAME_LENGTH);
    }

    if ('preferredName' in input) {
      update.preferredName = this.normalizeNullableText(
        input.preferredName,
        'preferredName',
        MAX_NAME_LENGTH,
      );
    }

    if ('dateOfBirth' in input) {
      update.dateOfBirth = this.normalizeDateOfBirth(input.dateOfBirth);
    }

    if ('gender' in input) {
      update.gender = this.normalizeNullableText(input.gender, 'gender', 32);
    }

    if (Object.keys(update).length === 0) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'At least one person field must be supplied for update.',
      );
    }

    const person = await this.repository.update(personId, update);

    await this.eventPublisher.publish({
      name: 'person.updated',
      actorUserId: context.actorUserId,
      personId: person.id,
      occurredAt: new Date(),
      person,
    });

    return person;
  }

  async archive(context: PeopleRequestContext, personId: string): Promise<PersonRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.archive);
    const current = await this.requirePerson(personId);

    if (current.status === 'archived') {
      return current;
    }

    const person = await this.repository.archive(personId, new Date());

    await this.eventPublisher.publish({
      name: 'person.archived',
      actorUserId: context.actorUserId,
      personId: person.id,
      occurredAt: new Date(),
      person,
    });

    return person;
  }

  async addIdentifier(
    context: PeopleRequestContext,
    personId: string,
    input: AddPersonIdentifierInput,
  ): Promise<PersonIdentifierRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.identifiersManage);
    const person = await this.requirePerson(personId);

    if (person.status === 'archived') {
      throw new PeopleModuleError(
        'PERSON_ARCHIVED',
        'Identifiers cannot be added to an archived person.',
        { personId },
      );
    }

    const validFrom = this.normalizeOptionalDate(input.validFrom, 'validFrom');
    const validUntil = this.normalizeOptionalDate(input.validUntil, 'validUntil');
    this.validateDateRange(validFrom, validUntil);

    const result = await this.repository.createIdentifier({
      personId,
      identifierType: this.normalizeIdentifierType(input.identifierType),
      identifierValue: this.normalizeIdentifierValue(input.identifierValue),
      issuingAuthority: this.normalizeNullableText(
        input.issuingAuthority,
        'issuingAuthority',
        255,
        true,
      ),
      issuingCountryCode: this.normalizeCountryCode(input.issuingCountryCode),
      validFrom,
      validUntil,
    });

    if (result.status === 'conflict') {
      throw new PeopleModuleError(
        'PERSON_IDENTIFIER_CONFLICT',
        'The identifier is already assigned and cannot be duplicated.',
        {
          personId,
          existingPersonId: result.existingPersonId,
        },
      );
    }

    await this.eventPublisher.publish({
      name: 'person.identifier_added',
      actorUserId: context.actorUserId,
      personId,
      occurredAt: new Date(),
      identifier: result.identifier,
    });

    return result.identifier;
  }

  async listIdentifiers(
    context: PeopleRequestContext,
    personId: string,
  ): Promise<readonly PersonIdentifierRecord[]> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.identifiersView);
    await this.requirePerson(personId);
    return this.repository.listIdentifiers(personId);
  }

  async verifyIdentifier(
    context: PeopleRequestContext,
    personId: string,
    identifierId: string,
  ): Promise<PersonIdentifierRecord> {
    this.requirePermission(context, PEOPLE_PERMISSIONS.identifiersManage);
    await this.requirePerson(personId);

    const identifier = await this.repository.findIdentifierById(
      this.requireText(identifierId, 'identifierId', 128),
    );

    if (identifier === null || identifier.personId !== personId) {
      throw new PeopleModuleError(
        'PERSON_IDENTIFIER_NOT_FOUND',
        'The identifier does not exist for this person.',
        { personId, identifierId },
      );
    }

    if (identifier.isVerified) {
      return identifier;
    }

    const verified = await this.repository.verifyIdentifier(identifier.id, new Date());

    await this.eventPublisher.publish({
      name: 'person.identifier_verified',
      actorUserId: context.actorUserId,
      personId,
      occurredAt: new Date(),
      identifier: verified,
    });

    return verified;
  }

  private requirePermission(context: PeopleRequestContext, permission: PeoplePermission): void {
    if (context.actorUserId.trim().length === 0) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'actorUserId is required for people operations.',
      );
    }

    if (!context.permissionCodes.has(permission)) {
      throw new PeopleModuleError(
        'PERSON_FORBIDDEN',
        `The operation requires the ${permission} permission.`,
        { permission },
      );
    }
  }

  private async requirePerson(personId: string): Promise<PersonRecord> {
    const id = this.requireText(personId, 'personId', 128);
    const person = await this.repository.findById(id);

    if (person === null) {
      throw new PeopleModuleError('PERSON_NOT_FOUND', 'The person does not exist.', {
        personId: id,
      });
    }

    return person;
  }

  private normalizeDateOfBirth(value: Date | null | undefined): Date | null {
    const date = this.normalizeOptionalDate(value, 'dateOfBirth');

    if (date !== null && date.getTime() > Date.now()) {
      throw new PeopleModuleError('PERSON_INVALID_INPUT', 'dateOfBirth cannot be in the future.', {
        field: 'dateOfBirth',
      });
    }

    return date;
  }

  private normalizeOptionalDate(value: Date | null | undefined, field: string): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new PeopleModuleError('PERSON_INVALID_INPUT', `${field} must be a valid date.`, {
        field,
      });
    }

    return new Date(value.getTime());
  }

  private validateDateRange(validFrom: Date | null, validUntil: Date | null): void {
    if (validFrom !== null && validUntil !== null && validUntil < validFrom) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'validUntil cannot be earlier than validFrom.',
        { field: 'validUntil' },
      );
    }
  }

  private normalizeIdentifierType(value: string): string {
    const normalized = this.requireText(value, 'identifierType', 64)
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'identifierType may contain only lowercase letters, numbers, dots, underscores, and hyphens.',
        { field: 'identifierType' },
      );
    }

    return normalized;
  }

  private normalizeIdentifierValue(value: string): string {
    const normalized = this.requireText(value, 'identifierValue', MAX_IDENTIFIER_LENGTH)
      .toUpperCase()
      .replace(/[\s-]+/g, '');

    if (normalized.length === 0) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'identifierValue must contain at least one non-separator character.',
        { field: 'identifierValue' },
      );
    }

    return normalized;
  }

  private normalizeCountryCode(value: string | null | undefined): string | null {
    const normalized = this.normalizeNullableText(value, 'issuingCountryCode', 2, true);

    if (normalized !== null && !/^[A-Z]{2}$/.test(normalized)) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        'issuingCountryCode must be a two-letter country code.',
        { field: 'issuingCountryCode' },
      );
    }

    return normalized;
  }

  private requireText(value: string, field: string, maxLength: number): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new PeopleModuleError('PERSON_INVALID_INPUT', `${field} must not be empty.`, {
        field,
      });
    }

    if (normalized.length > maxLength) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        `${field} must not exceed ${String(maxLength)} characters.`,
        { field, maxLength },
      );
    }

    return normalized;
  }

  private normalizeNullableText(
    value: string | null | undefined,
    field: string,
    maxLength: number,
    uppercase = false,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new PeopleModuleError(
        'PERSON_INVALID_INPUT',
        `${field} must not exceed ${String(maxLength)} characters.`,
        { field, maxLength },
      );
    }

    return uppercase ? normalized.toUpperCase() : normalized;
  }
}
