export type PersonStatus = 'active' | 'suspended' | 'archived';

export interface PersonRecord {
  readonly id: string;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: string | null;
  readonly status: PersonStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface CurrentPersonRequestContext {
  readonly actorUserId: string;
  readonly personId: string;
}

export interface CurrentPersonProfile {
  readonly id: string;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly preferredName: string | null;
  readonly status: 'active';
}

export interface PersonIdentifierRecord {
  readonly id: string;
  readonly personId: string;
  readonly identifierType: string;
  readonly identifierValue: string;
  readonly issuingAuthority: string | null;
  readonly issuingCountryCode: string | null;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly isVerified: boolean;
  readonly verifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PeopleRequestContext {
  readonly actorUserId: string;
  readonly permissionCodes: ReadonlySet<string>;
}

export interface CreatePersonInput {
  readonly firstName: string;
  readonly middleName?: string | null;
  readonly lastName: string;
  readonly preferredName?: string | null;
  readonly dateOfBirth?: Date | null;
  readonly gender?: string | null;
}

export interface UpdatePersonInput {
  readonly firstName?: string;
  readonly middleName?: string | null;
  readonly lastName?: string;
  readonly preferredName?: string | null;
  readonly dateOfBirth?: Date | null;
  readonly gender?: string | null;
}

export interface PersonListQuery {
  readonly status?: PersonStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly afterId?: string;
}

export interface PersonPage {
  readonly items: readonly PersonRecord[];
  readonly nextCursor: string | null;
}

export interface AddPersonIdentifierInput {
  readonly identifierType: string;
  readonly identifierValue: string;
  readonly issuingAuthority?: string | null;
  readonly issuingCountryCode?: string | null;
  readonly validFrom?: Date | null;
  readonly validUntil?: Date | null;
}

export interface CreatePersonRecordInput {
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: string | null;
}

export interface UpdatePersonRecordInput {
  readonly firstName?: string;
  readonly middleName?: string | null;
  readonly lastName?: string;
  readonly preferredName?: string | null;
  readonly dateOfBirth?: Date | null;
  readonly gender?: string | null;
}

export interface CreatePersonIdentifierRecordInput {
  readonly personId: string;
  readonly identifierType: string;
  readonly identifierValue: string;
  readonly issuingAuthority: string | null;
  readonly issuingCountryCode: string | null;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
}

export type CreatePersonIdentifierResult =
  | {
      readonly status: 'created';
      readonly identifier: PersonIdentifierRecord;
    }
  | {
      readonly status: 'conflict';
      readonly existingPersonId: string;
    };
