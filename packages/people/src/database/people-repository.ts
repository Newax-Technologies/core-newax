import type {
  CreatePersonIdentifierRecordInput,
  CreatePersonIdentifierResult,
  CreatePersonRecordInput,
  PersonIdentifierRecord,
  PersonListQuery,
  PersonPage,
  PersonRecord,
  UpdatePersonRecordInput,
} from '../types/person';

export interface PeopleRepository {
  archive(id: string, archivedAt: Date): Promise<PersonRecord>;
  create(input: CreatePersonRecordInput): Promise<PersonRecord>;
  createIdentifier(input: CreatePersonIdentifierRecordInput): Promise<CreatePersonIdentifierResult>;
  findById(id: string): Promise<PersonRecord | null>;
  findIdentifierById(id: string): Promise<PersonIdentifierRecord | null>;
  list(query: PersonListQuery): Promise<PersonPage>;
  listIdentifiers(personId: string): Promise<readonly PersonIdentifierRecord[]>;
  update(id: string, input: UpdatePersonRecordInput): Promise<PersonRecord>;
  verifyIdentifier(id: string, verifiedAt: Date): Promise<PersonIdentifierRecord>;
}
