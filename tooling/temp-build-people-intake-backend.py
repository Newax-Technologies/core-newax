from pathlib import Path
import json
import textwrap


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip())


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


write(
    "packages/people-intake/package.json",
    '''
    {
      "name": "@newax/people-intake",
      "version": "0.1.0",
      "private": true,
      "description": "Reusable NEWAX People Intake and verification workflow foundation module.",
      "license": "UNLICENSED",
      "main": "dist/index.js",
      "types": "dist/index.d.ts",
      "files": ["dist", "README.md", "CHANGELOG.md", "VERSION"],
      "engines": {
        "node": "24.18.0",
        "pnpm": "11.11.0"
      },
      "scripts": {
        "build": "tsc --project tsconfig.json",
        "clean": "rm -rf dist coverage",
        "test": "vitest run",
        "typecheck": "tsc --project tsconfig.json --noEmit && tsc --project tsconfig.spec.json --noEmit"
      },
      "devDependencies": {
        "@types/node": "24.10.1",
        "typescript": "6.0.3",
        "vitest": "4.1.10"
      }
    }
    ''',
)
write("packages/people-intake/VERSION", "0.1.0\n")
write(
    "packages/people-intake/CHANGELOG.md",
    '''
    # Changelog

    ## 0.1.0 - 2026-07-16

    ### Added

    - Tenant- and Organization-scoped People Intake drafts.
    - Versioned proposed-person, identifier, and relationship payloads.
    - Draft creation, editing, listing, reading, submission, approval, and rejection contracts.
    - Independent-review protection that prevents creators from reviewing their own submissions.
    - Strict payload validation, duplicate-identifier detection, and parentage-cycle detection.
    - Explicit view, create, update, submit, and review permissions.
    - PostgreSQL state, scope, review, immutability, and transition constraints.

    ### Security

    - Draft intake records remain separate from canonical People Registry data.
    - Submitted payloads become immutable.
    - Rejected submissions require a nonblank reviewer note.
    - No real client or family data is included in fixtures or seeds.
    ''',
)
write(
    "packages/people-intake/tsconfig.json",
    '''
    {
      "$schema": "https://json.schemastore.org/tsconfig",
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "rootDir": "./src",
        "outDir": "./dist",
        "noEmit": false,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "incremental": true,
        "types": ["node"],
        "tsBuildInfoFile": "./dist/.tsbuildinfo"
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules", "dist", "tests", "**/*.spec.ts"]
    }
    ''',
)
write(
    "packages/people-intake/tsconfig.spec.json",
    '''
    {
      "$schema": "https://json.schemastore.org/tsconfig",
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "noEmit": true,
        "types": ["node", "vitest/globals"]
      },
      "include": ["src/**/*.ts", "tests/**/*.ts"]
    }
    ''',
)
write(
    "packages/people-intake/src/permissions/people-intake-permissions.ts",
    '''
    export const PEOPLE_INTAKE_PERMISSIONS = {
      view: 'people_intake.view',
      create: 'people_intake.create',
      update: 'people_intake.update',
      submit: 'people_intake.submit',
      review: 'people_intake.review',
    } as const;

    export type PeopleIntakePermission =
      (typeof PEOPLE_INTAKE_PERMISSIONS)[keyof typeof PEOPLE_INTAKE_PERMISSIONS];
    ''',
)
write(
    "packages/people-intake/src/errors/people-intake-module-error.ts",
    '''
    export type PeopleIntakeErrorCode =
      | 'PEOPLE_INTAKE_CONFLICT'
      | 'PEOPLE_INTAKE_CURSOR_INVALID'
      | 'PEOPLE_INTAKE_FORBIDDEN'
      | 'PEOPLE_INTAKE_INTEGRITY_FAILURE'
      | 'PEOPLE_INTAKE_INVALID_INPUT'
      | 'PEOPLE_INTAKE_NOT_FOUND'
      | 'PEOPLE_INTAKE_ORGANIZATION_UNAVAILABLE'
      | 'PEOPLE_INTAKE_STATE_CONFLICT';

    export class PeopleIntakeModuleError extends Error {
      readonly code: PeopleIntakeErrorCode;
      readonly details: Readonly<Record<string, unknown>>;

      constructor(
        code: PeopleIntakeErrorCode,
        message: string,
        details: Readonly<Record<string, unknown>> = {},
      ) {
        super(message);
        this.name = 'PeopleIntakeModuleError';
        this.code = code;
        this.details = details;
      }
    }
    ''',
)
write(
    "packages/people-intake/src/types/people-intake.ts",
    '''
    export type PeopleIntakeStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
    export type PeopleIntakeReviewDecision = 'approved' | 'rejected';

    export interface ProposedPersonIdentifierInput {
      readonly identifierType: string;
      readonly identifierValue: string;
      readonly issuingAuthority?: string | null;
      readonly issuingCountryCode?: string | null;
    }

    export interface ProposedPersonInput {
      readonly clientKey: string;
      readonly firstName: string;
      readonly middleName?: string | null;
      readonly lastName: string;
      readonly preferredName?: string | null;
      readonly dateOfBirth?: string | null;
      readonly gender?: string | null;
      readonly identifiers?: readonly ProposedPersonIdentifierInput[];
    }

    export interface ProposedPersonRelationshipInput {
      readonly sourcePersonKey: string;
      readonly targetPersonKey: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
    }

    export interface PeopleIntakePayloadInput {
      readonly schemaVersion: 1;
      readonly people: readonly ProposedPersonInput[];
      readonly relationships: readonly ProposedPersonRelationshipInput[];
    }

    export interface ProposedPersonIdentifier {
      readonly identifierType: string;
      readonly identifierValue: string;
      readonly issuingAuthority: string | null;
      readonly issuingCountryCode: string | null;
    }

    export interface ProposedPerson {
      readonly clientKey: string;
      readonly firstName: string;
      readonly middleName: string | null;
      readonly lastName: string;
      readonly preferredName: string | null;
      readonly dateOfBirth: string | null;
      readonly gender: string | null;
      readonly identifiers: readonly ProposedPersonIdentifier[];
    }

    export interface ProposedPersonRelationship {
      readonly sourcePersonKey: string;
      readonly targetPersonKey: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
    }

    export interface PeopleIntakePayload {
      readonly schemaVersion: 1;
      readonly people: readonly ProposedPerson[];
      readonly relationships: readonly ProposedPersonRelationship[];
    }

    export interface PeopleIntakeRequestContext {
      readonly actorUserId: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly permissionCodes: ReadonlySet<string>;
    }

    export interface PeopleIntakeSummary {
      readonly id: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly title: string;
      readonly sourceType: string;
      readonly sourceReference: string | null;
      readonly status: PeopleIntakeStatus;
      readonly personCount: number;
      readonly relationshipCount: number;
      readonly version: number;
      readonly createdByUserId: string;
      readonly submittedAt: Date | null;
      readonly reviewedAt: Date | null;
      readonly reviewedByUserId: string | null;
      readonly reviewDecision: PeopleIntakeReviewDecision | null;
      readonly reviewNotes: string | null;
      readonly createdAt: Date;
      readonly updatedAt: Date;
    }

    export interface PeopleIntakeRecord extends PeopleIntakeSummary {
      readonly payload: PeopleIntakePayload;
    }

    export interface StoredPeopleIntakeRecord extends PeopleIntakeSummary {
      readonly payload: unknown;
    }

    export interface CreatePeopleIntakeDraftInput {
      readonly title: string;
      readonly sourceType: string;
      readonly sourceReference?: string | null;
      readonly payload: PeopleIntakePayloadInput;
    }

    export interface UpdatePeopleIntakeDraftInput extends CreatePeopleIntakeDraftInput {
      readonly expectedVersion: number;
    }

    export interface SubmitPeopleIntakeInput {
      readonly expectedVersion: number;
    }

    export interface ReviewPeopleIntakeInput {
      readonly expectedVersion: number;
      readonly decision: PeopleIntakeReviewDecision;
      readonly notes?: string | null;
    }

    export interface PeopleIntakeListQuery {
      readonly status?: PeopleIntakeStatus;
      readonly limit?: number;
      readonly afterId?: string;
    }

    export interface PeopleIntakePage {
      readonly items: readonly PeopleIntakeSummary[];
      readonly nextCursor: string | null;
    }

    export interface CreatePeopleIntakeRecordInput {
      readonly tenantId: string;
      readonly organizationId: string;
      readonly actorUserId: string;
      readonly title: string;
      readonly sourceType: string;
      readonly sourceReference: string | null;
      readonly payload: PeopleIntakePayload;
      readonly personCount: number;
      readonly relationshipCount: number;
    }

    export interface UpdatePeopleIntakeRecordInput
      extends Omit<CreatePeopleIntakeRecordInput, 'actorUserId'> {
      readonly id: string;
      readonly actorUserId: string;
      readonly expectedVersion: number;
    }

    export interface PeopleIntakeIdentityInput {
      readonly id: string;
      readonly tenantId: string;
      readonly organizationId: string;
    }

    export interface SubmitPeopleIntakeRecordInput extends PeopleIntakeIdentityInput {
      readonly actorUserId: string;
      readonly expectedVersion: number;
      readonly submittedAt: Date;
    }

    export interface ReviewPeopleIntakeRecordInput extends PeopleIntakeIdentityInput {
      readonly reviewerUserId: string;
      readonly expectedVersion: number;
      readonly decision: PeopleIntakeReviewDecision;
      readonly notes: string | null;
      readonly reviewedAt: Date;
    }

    export interface ListPeopleIntakesRecordInput {
      readonly tenantId: string;
      readonly organizationId: string;
      readonly status?: PeopleIntakeStatus;
      readonly limit: number;
      readonly afterId?: string;
    }

    export type CreatePeopleIntakeRecordResult =
      | { readonly status: 'created'; readonly intake: StoredPeopleIntakeRecord }
      | { readonly status: 'organization_unavailable' };

    export type UpdatePeopleIntakeRecordResult =
      | { readonly status: 'updated'; readonly intake: StoredPeopleIntakeRecord }
      | { readonly status: 'not_found' }
      | { readonly status: 'version_conflict' }
      | { readonly status: 'state_conflict' }
      | { readonly status: 'creator_mismatch' };

    export type SubmitPeopleIntakeRecordResult =
      | { readonly status: 'submitted'; readonly intake: StoredPeopleIntakeRecord }
      | { readonly status: 'not_found' }
      | { readonly status: 'version_conflict' }
      | { readonly status: 'state_conflict' }
      | { readonly status: 'creator_mismatch' };

    export type ReviewPeopleIntakeRecordResult =
      | { readonly status: 'reviewed'; readonly intake: StoredPeopleIntakeRecord }
      | { readonly status: 'not_found' }
      | { readonly status: 'version_conflict' }
      | { readonly status: 'state_conflict' }
      | { readonly status: 'self_review' };

    export type ListPeopleIntakesRecordResult =
      | {
          readonly status: 'available';
          readonly items: readonly PeopleIntakeSummary[];
          readonly nextCursor: string | null;
        }
      | { readonly status: 'cursor_invalid' }
      | { readonly status: 'organization_unavailable' };
    ''',
)
write(
    "packages/people-intake/src/database/people-intake-repository.ts",
    '''
    import type {
      CreatePeopleIntakeRecordInput,
      CreatePeopleIntakeRecordResult,
      ListPeopleIntakesRecordInput,
      ListPeopleIntakesRecordResult,
      PeopleIntakeIdentityInput,
      ReviewPeopleIntakeRecordInput,
      ReviewPeopleIntakeRecordResult,
      StoredPeopleIntakeRecord,
      SubmitPeopleIntakeRecordInput,
      SubmitPeopleIntakeRecordResult,
      UpdatePeopleIntakeRecordInput,
      UpdatePeopleIntakeRecordResult,
    } from '../types/people-intake';

    export interface PeopleIntakeRepository {
      createDraft(input: CreatePeopleIntakeRecordInput): Promise<CreatePeopleIntakeRecordResult>;
      findById(input: PeopleIntakeIdentityInput): Promise<StoredPeopleIntakeRecord | null>;
      list(input: ListPeopleIntakesRecordInput): Promise<ListPeopleIntakesRecordResult>;
      updateDraft(input: UpdatePeopleIntakeRecordInput): Promise<UpdatePeopleIntakeRecordResult>;
      submit(input: SubmitPeopleIntakeRecordInput): Promise<SubmitPeopleIntakeRecordResult>;
      review(input: ReviewPeopleIntakeRecordInput): Promise<ReviewPeopleIntakeRecordResult>;
    }
    ''',
)
write(
    "packages/people-intake/src/services/people-intake-validator.ts",
    '''
    import { PeopleIntakeModuleError } from '../errors/people-intake-module-error';
    import type {
      PeopleIntakePayload,
      PeopleIntakePayloadInput,
      ProposedPerson,
      ProposedPersonIdentifier,
      ProposedPersonInput,
      ProposedPersonRelationship,
      ProposedPersonRelationshipInput,
    } from '../types/people-intake';

    const MAX_PEOPLE = 50;
    const MAX_RELATIONSHIPS = 100;
    const MAX_IDENTIFIERS_PER_PERSON = 8;
    const CLIENT_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/u;
    const CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;
    const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

    export class PeopleIntakeValidator {
      normalizePayload(input: PeopleIntakePayloadInput): PeopleIntakePayload {
        if (input.schemaVersion !== 1) {
          this.invalid('payload.schemaVersion', 'schemaVersion must be 1.');
        }
        if (!Array.isArray(input.people) || input.people.length < 1 || input.people.length > MAX_PEOPLE) {
          this.invalid('payload.people', `people must contain between 1 and ${String(MAX_PEOPLE)} records.`);
        }
        if (!Array.isArray(input.relationships) || input.relationships.length > MAX_RELATIONSHIPS) {
          this.invalid(
            'payload.relationships',
            `relationships must contain no more than ${String(MAX_RELATIONSHIPS)} records.`,
          );
        }

        const keys = new Set<string>();
        const identifierKeys = new Set<string>();
        const people = input.people.map((person, index) => {
          const normalized = this.normalizePerson(person, index, identifierKeys);
          if (keys.has(normalized.clientKey)) {
            this.invalid(`payload.people[${String(index)}].clientKey`, 'clientKey must be unique within the intake.');
          }
          keys.add(normalized.clientKey);
          return normalized;
        });

        const relationshipKeys = new Set<string>();
        const relationships = input.relationships.map((relationship, index) => {
          const normalized = this.normalizeRelationship(relationship, index, keys);
          const key = [
            normalized.sourcePersonKey,
            normalized.targetPersonKey,
            normalized.relationshipType,
            normalized.relationshipRole,
            normalized.relationshipBasis,
          ].join('|');
          if (relationshipKeys.has(key)) {
            this.invalid(
              `payload.relationships[${String(index)}]`,
              'The same proposed relationship cannot be repeated.',
            );
          }
          relationshipKeys.add(key);
          return normalized;
        });

        this.assertNoParentCycle(relationships);
        return { schemaVersion: 1, people, relationships };
      }

      private normalizePerson(
        input: ProposedPersonInput,
        index: number,
        identifierKeys: Set<string>,
      ): ProposedPerson {
        const field = `payload.people[${String(index)}]`;
        const clientKey = this.code(input.clientKey, `${field}.clientKey`, 64, CLIENT_KEY_PATTERN);
        const identifiersInput = input.identifiers ?? [];
        if (!Array.isArray(identifiersInput) || identifiersInput.length > MAX_IDENTIFIERS_PER_PERSON) {
          this.invalid(
            `${field}.identifiers`,
            `identifiers must contain no more than ${String(MAX_IDENTIFIERS_PER_PERSON)} records.`,
          );
        }
        const identifiers = identifiersInput.map((identifier, identifierIndex) => {
          const normalized = this.normalizeIdentifier(identifier, `${field}.identifiers[${String(identifierIndex)}]`);
          const duplicateKey = [
            normalized.identifierType,
            normalized.issuingCountryCode ?? '',
            normalized.issuingAuthority?.toUpperCase() ?? '',
            normalized.identifierValue.toUpperCase().replace(/[\s-]/gu, ''),
          ].join('|');
          if (identifierKeys.has(duplicateKey)) {
            this.invalid(
              `${field}.identifiers[${String(identifierIndex)}].identifierValue`,
              'An official identifier cannot be repeated within the intake.',
            );
          }
          identifierKeys.add(duplicateKey);
          return normalized;
        });

        return {
          clientKey,
          firstName: this.text(input.firstName, `${field}.firstName`, 128),
          middleName: this.nullableText(input.middleName, `${field}.middleName`, 128),
          lastName: this.text(input.lastName, `${field}.lastName`, 128),
          preferredName: this.nullableText(input.preferredName, `${field}.preferredName`, 128),
          dateOfBirth: this.date(input.dateOfBirth, `${field}.dateOfBirth`),
          gender: this.nullableCode(input.gender, `${field}.gender`, 32),
          identifiers,
        };
      }

      private normalizeIdentifier(
        input: {
          readonly identifierType: string;
          readonly identifierValue: string;
          readonly issuingAuthority?: string | null;
          readonly issuingCountryCode?: string | null;
        },
        field: string,
      ): ProposedPersonIdentifier {
        return {
          identifierType: this.code(input.identifierType, `${field}.identifierType`, 64, CODE_PATTERN),
          identifierValue: this.text(input.identifierValue, `${field}.identifierValue`, 255),
          issuingAuthority: this.nullableText(input.issuingAuthority, `${field}.issuingAuthority`, 255),
          issuingCountryCode: this.country(input.issuingCountryCode, `${field}.issuingCountryCode`),
        };
      }

      private normalizeRelationship(
        input: ProposedPersonRelationshipInput,
        index: number,
        personKeys: ReadonlySet<string>,
      ): ProposedPersonRelationship {
        const field = `payload.relationships[${String(index)}]`;
        const sourcePersonKey = this.code(
          input.sourcePersonKey,
          `${field}.sourcePersonKey`,
          64,
          CLIENT_KEY_PATTERN,
        );
        const targetPersonKey = this.code(
          input.targetPersonKey,
          `${field}.targetPersonKey`,
          64,
          CLIENT_KEY_PATTERN,
        );
        if (!personKeys.has(sourcePersonKey) || !personKeys.has(targetPersonKey)) {
          this.invalid(field, 'Relationship endpoints must reference people in the same intake.');
        }
        if (sourcePersonKey === targetPersonKey) {
          this.invalid(field, 'A proposed relationship must connect two different people.');
        }
        return {
          sourcePersonKey,
          targetPersonKey,
          relationshipType: this.code(
            input.relationshipType,
            `${field}.relationshipType`,
            64,
            CODE_PATTERN,
          ),
          relationshipRole: this.code(
            input.relationshipRole,
            `${field}.relationshipRole`,
            64,
            CODE_PATTERN,
          ),
          relationshipBasis: this.code(
            input.relationshipBasis,
            `${field}.relationshipBasis`,
            64,
            CODE_PATTERN,
          ),
        };
      }

      private assertNoParentCycle(relationships: readonly ProposedPersonRelationship[]): void {
        const graph = new Map<string, string[]>();
        for (const relationship of relationships) {
          if (relationship.relationshipType !== 'parent_of') {
            continue;
          }
          const targets = graph.get(relationship.sourcePersonKey) ?? [];
          targets.push(relationship.targetPersonKey);
          graph.set(relationship.sourcePersonKey, targets);
        }
        const visiting = new Set<string>();
        const visited = new Set<string>();
        const visit = (key: string): void => {
          if (visiting.has(key)) {
            this.invalid('payload.relationships', 'Proposed parent relationships cannot form an ancestry cycle.');
          }
          if (visited.has(key)) {
            return;
          }
          visiting.add(key);
          for (const target of graph.get(key) ?? []) {
            visit(target);
          }
          visiting.delete(key);
          visited.add(key);
        };
        for (const key of graph.keys()) {
          visit(key);
        }
      }

      private text(value: string, field: string, maximum: number): string {
        if (typeof value !== 'string') {
          this.invalid(field, `${field} must be text.`);
        }
        const normalized = value.trim();
        if (normalized.length < 1 || normalized.length > maximum) {
          this.invalid(field, `${field} must contain between 1 and ${String(maximum)} characters.`);
        }
        return normalized;
      }

      private nullableText(
        value: string | null | undefined,
        field: string,
        maximum: number,
      ): string | null {
        if (value === null || value === undefined) {
          return null;
        }
        return this.text(value, field, maximum);
      }

      private code(value: string, field: string, maximum: number, pattern: RegExp): string {
        const normalized = this.text(value, field, maximum).toLowerCase();
        if (!pattern.test(normalized)) {
          this.invalid(field, `${field} must use a stable lowercase machine-readable code.`);
        }
        return normalized;
      }

      private nullableCode(
        value: string | null | undefined,
        field: string,
        maximum: number,
      ): string | null {
        if (value === null || value === undefined) {
          return null;
        }
        return this.code(value, field, maximum, CODE_PATTERN);
      }

      private country(value: string | null | undefined, field: string): string | null {
        if (value === null || value === undefined) {
          return null;
        }
        const normalized = value.trim().toUpperCase();
        if (!/^[A-Z]{2}$/u.test(normalized)) {
          this.invalid(field, `${field} must contain a two-letter country code.`);
        }
        return normalized;
      }

      private date(value: string | null | undefined, field: string): string | null {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
          this.invalid(field, `${field} must use YYYY-MM-DD format.`);
        }
        const date = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
          this.invalid(field, `${field} must be a real calendar date.`);
        }
        const today = new Date().toISOString().slice(0, 10);
        if (value > today) {
          this.invalid(field, `${field} cannot be in the future.`);
        }
        return value;
      }

      private invalid(field: string, message: string): never {
        throw new PeopleIntakeModuleError('PEOPLE_INTAKE_INVALID_INPUT', message, { field });
      }
    }
    ''',
)
write(
    "packages/people-intake/src/services/people-intake.service.ts",
    '''
    import type { PeopleIntakeRepository } from '../database/people-intake-repository';
    import { PeopleIntakeModuleError } from '../errors/people-intake-module-error';
    import {
      PEOPLE_INTAKE_PERMISSIONS,
      type PeopleIntakePermission,
    } from '../permissions/people-intake-permissions';
    import type {
      CreatePeopleIntakeDraftInput,
      PeopleIntakeListQuery,
      PeopleIntakePage,
      PeopleIntakeRecord,
      PeopleIntakeRequestContext,
      PeopleIntakeReviewDecision,
      PeopleIntakeStatus,
      PeopleIntakeSummary,
      ReviewPeopleIntakeInput,
      StoredPeopleIntakeRecord,
      SubmitPeopleIntakeInput,
      UpdatePeopleIntakeDraftInput,
    } from '../types/people-intake';
    import { PeopleIntakeValidator } from './people-intake-validator';

    const DEFAULT_PAGE_SIZE = 25;
    const MAX_PAGE_SIZE = 100;
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
    const CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;
    const STATUSES: ReadonlySet<string> = new Set(['draft', 'submitted', 'approved', 'rejected']);

    export class PeopleIntakeService {
      private readonly validator = new PeopleIntakeValidator();

      constructor(private readonly repository: PeopleIntakeRepository) {}

      async createDraft(
        context: PeopleIntakeRequestContext,
        input: CreatePeopleIntakeDraftInput,
      ): Promise<PeopleIntakeRecord> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.create);
        const scoped = this.scope(context);
        const payload = this.validator.normalizePayload(input.payload);
        const result = await this.repository.createDraft({
          ...scoped,
          actorUserId: scoped.actorUserId,
          title: this.text(input.title, 'title', 128),
          sourceType: this.code(input.sourceType, 'sourceType', 64),
          sourceReference: this.nullableText(input.sourceReference, 'sourceReference', 255),
          payload,
          personCount: payload.people.length,
          relationshipCount: payload.relationships.length,
        });
        if (result.status === 'organization_unavailable') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_ORGANIZATION_UNAVAILABLE',
            'The current organization is unavailable for People Intake.',
          );
        }
        return this.record(result.intake);
      }

      async get(
        context: PeopleIntakeRequestContext,
        intakeId: string,
      ): Promise<PeopleIntakeRecord> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.view);
        const scoped = this.scope(context);
        const record = await this.repository.findById({
          id: this.uuid(intakeId, 'intakeId'),
          tenantId: scoped.tenantId,
          organizationId: scoped.organizationId,
        });
        if (record === null) {
          throw new PeopleIntakeModuleError('PEOPLE_INTAKE_NOT_FOUND', 'The intake does not exist.');
        }
        return this.record(record);
      }

      async list(
        context: PeopleIntakeRequestContext,
        query: PeopleIntakeListQuery = {},
      ): Promise<PeopleIntakePage> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.view);
        const scoped = this.scope(context);
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
          this.invalid('limit', `limit must be between 1 and ${String(MAX_PAGE_SIZE)}.`);
        }
        const input: {
          tenantId: string;
          organizationId: string;
          limit: number;
          status?: PeopleIntakeStatus;
          afterId?: string;
        } = {
          tenantId: scoped.tenantId,
          organizationId: scoped.organizationId,
          limit,
        };
        if (query.status !== undefined) {
          input.status = this.status(query.status);
        }
        if (query.afterId !== undefined) {
          input.afterId = this.uuid(query.afterId, 'afterId');
        }
        const result = await this.repository.list(input);
        if (result.status === 'organization_unavailable') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_ORGANIZATION_UNAVAILABLE',
            'The current organization is unavailable for People Intake.',
          );
        }
        if (result.status === 'cursor_invalid') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_CURSOR_INVALID',
            'The intake cursor is invalid for the current organization.',
          );
        }
        return {
          items: result.items.map((item) => this.summary(item)),
          nextCursor: result.nextCursor,
        };
      }

      async updateDraft(
        context: PeopleIntakeRequestContext,
        intakeId: string,
        input: UpdatePeopleIntakeDraftInput,
      ): Promise<PeopleIntakeRecord> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.update);
        const scoped = this.scope(context);
        const payload = this.validator.normalizePayload(input.payload);
        const result = await this.repository.updateDraft({
          id: this.uuid(intakeId, 'intakeId'),
          ...scoped,
          actorUserId: scoped.actorUserId,
          expectedVersion: this.version(input.expectedVersion),
          title: this.text(input.title, 'title', 128),
          sourceType: this.code(input.sourceType, 'sourceType', 64),
          sourceReference: this.nullableText(input.sourceReference, 'sourceReference', 255),
          payload,
          personCount: payload.people.length,
          relationshipCount: payload.relationships.length,
        });
        return this.changed(result);
      }

      async submit(
        context: PeopleIntakeRequestContext,
        intakeId: string,
        input: SubmitPeopleIntakeInput,
      ): Promise<PeopleIntakeRecord> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.submit);
        const scoped = this.scope(context);
        const result = await this.repository.submit({
          id: this.uuid(intakeId, 'intakeId'),
          tenantId: scoped.tenantId,
          organizationId: scoped.organizationId,
          actorUserId: scoped.actorUserId,
          expectedVersion: this.version(input.expectedVersion),
          submittedAt: new Date(),
        });
        if (result.status === 'submitted') {
          return this.record(result.intake);
        }
        return this.transitionError(result.status);
      }

      async review(
        context: PeopleIntakeRequestContext,
        intakeId: string,
        input: ReviewPeopleIntakeInput,
      ): Promise<PeopleIntakeRecord> {
        this.requirePermission(context, PEOPLE_INTAKE_PERMISSIONS.review);
        const scoped = this.scope(context);
        const decision = this.decision(input.decision);
        const notes = this.nullableText(input.notes, 'notes', 2_000);
        if (decision === 'rejected' && notes === null) {
          this.invalid('notes', 'A rejection requires reviewer notes.');
        }
        const result = await this.repository.review({
          id: this.uuid(intakeId, 'intakeId'),
          tenantId: scoped.tenantId,
          organizationId: scoped.organizationId,
          reviewerUserId: scoped.actorUserId,
          expectedVersion: this.version(input.expectedVersion),
          decision,
          notes,
          reviewedAt: new Date(),
        });
        if (result.status === 'reviewed') {
          return this.record(result.intake);
        }
        if (result.status === 'self_review') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            'The creator of an intake cannot review the same submission.',
          );
        }
        return this.transitionError(result.status);
      }

      private changed(
        result:
          | { readonly status: 'updated'; readonly intake: StoredPeopleIntakeRecord }
          | { readonly status: 'not_found' }
          | { readonly status: 'version_conflict' }
          | { readonly status: 'state_conflict' }
          | { readonly status: 'creator_mismatch' },
      ): PeopleIntakeRecord {
        if (result.status === 'updated') {
          return this.record(result.intake);
        }
        if (result.status === 'creator_mismatch') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            'Only the intake creator can edit the draft.',
          );
        }
        return this.transitionError(result.status);
      }

      private transitionError(
        status: 'not_found' | 'version_conflict' | 'state_conflict' | 'creator_mismatch',
      ): never {
        if (status === 'not_found') {
          throw new PeopleIntakeModuleError('PEOPLE_INTAKE_NOT_FOUND', 'The intake does not exist.');
        }
        if (status === 'creator_mismatch') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            'Only the intake creator can submit the draft.',
          );
        }
        if (status === 'version_conflict') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_CONFLICT',
            'The intake changed after it was loaded. Reload before continuing.',
          );
        }
        throw new PeopleIntakeModuleError(
          'PEOPLE_INTAKE_STATE_CONFLICT',
          'The intake is not in the required workflow state.',
        );
      }

      private record(stored: StoredPeopleIntakeRecord): PeopleIntakeRecord {
        const summary = this.summary(stored);
        const payload = this.validator.normalizePayload(stored.payload as never);
        if (
          payload.people.length !== summary.personCount ||
          payload.relationships.length !== summary.relationshipCount
        ) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            'The stored intake counts do not match its payload.',
          );
        }
        return { ...summary, payload };
      }

      private summary(summary: PeopleIntakeSummary): PeopleIntakeSummary {
        this.uuid(summary.id, 'intake.id');
        this.uuid(summary.tenantId, 'intake.tenantId');
        this.uuid(summary.organizationId, 'intake.organizationId');
        this.uuid(summary.createdByUserId, 'intake.createdByUserId');
        if (summary.reviewedByUserId !== null) {
          this.uuid(summary.reviewedByUserId, 'intake.reviewedByUserId');
        }
        this.status(summary.status);
        this.text(summary.title, 'intake.title', 128);
        this.code(summary.sourceType, 'intake.sourceType', 64);
        this.version(summary.version);
        if (
          !Number.isInteger(summary.personCount) ||
          summary.personCount < 1 ||
          summary.personCount > 50 ||
          !Number.isInteger(summary.relationshipCount) ||
          summary.relationshipCount < 0 ||
          summary.relationshipCount > 100
        ) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            'The stored intake counts are invalid.',
          );
        }
        return summary;
      }

      private scope(context: PeopleIntakeRequestContext): {
        actorUserId: string;
        tenantId: string;
        organizationId: string;
      } {
        return {
          actorUserId: this.uuid(context.actorUserId, 'context.actorUserId'),
          tenantId: this.uuid(context.tenantId, 'context.tenantId'),
          organizationId: this.uuid(context.organizationId, 'context.organizationId'),
        };
      }

      private requirePermission(
        context: PeopleIntakeRequestContext,
        permission: PeopleIntakePermission,
      ): void {
        if (!context.permissionCodes.has(permission)) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            `The operation requires the ${permission} permission.`,
            { permission },
          );
        }
      }

      private status(value: PeopleIntakeStatus): PeopleIntakeStatus {
        if (!STATUSES.has(value)) {
          this.invalid('status', 'status is not supported.');
        }
        return value;
      }

      private decision(value: PeopleIntakeReviewDecision): PeopleIntakeReviewDecision {
        if (value !== 'approved' && value !== 'rejected') {
          this.invalid('decision', 'decision must be approved or rejected.');
        }
        return value;
      }

      private version(value: number): number {
        if (!Number.isInteger(value) || value < 1) {
          this.invalid('expectedVersion', 'expectedVersion must be a positive integer.');
        }
        return value;
      }

      private uuid(value: string, field: string): string {
        if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            `${field} must be a UUID.`,
            { field },
          );
        }
        return value.toLowerCase();
      }

      private text(value: string, field: string, maximum: number): string {
        if (typeof value !== 'string') {
          this.invalid(field, `${field} must be text.`);
        }
        const normalized = value.trim();
        if (normalized.length < 1 || normalized.length > maximum) {
          this.invalid(field, `${field} must contain between 1 and ${String(maximum)} characters.`);
        }
        return normalized;
      }

      private nullableText(
        value: string | null | undefined,
        field: string,
        maximum: number,
      ): string | null {
        if (value === null || value === undefined) {
          return null;
        }
        return this.text(value, field, maximum);
      }

      private code(value: string, field: string, maximum: number): string {
        const normalized = this.text(value, field, maximum).toLowerCase();
        if (!CODE_PATTERN.test(normalized)) {
          this.invalid(field, `${field} must be a lowercase machine-readable code.`);
        }
        return normalized;
      }

      private invalid(field: string, message: string): never {
        throw new PeopleIntakeModuleError('PEOPLE_INTAKE_INVALID_INPUT', message, { field });
      }
    }
    ''',
)
write(
    "packages/people-intake/src/index.ts",
    '''
    export type { PeopleIntakeRepository } from './database/people-intake-repository';
    export {
      PeopleIntakeModuleError,
      type PeopleIntakeErrorCode,
    } from './errors/people-intake-module-error';
    export {
      PEOPLE_INTAKE_PERMISSIONS,
      type PeopleIntakePermission,
    } from './permissions/people-intake-permissions';
    export { PeopleIntakeService } from './services/people-intake.service';
    export type {
      CreatePeopleIntakeDraftInput,
      CreatePeopleIntakeRecordInput,
      CreatePeopleIntakeRecordResult,
      ListPeopleIntakesRecordInput,
      ListPeopleIntakesRecordResult,
      PeopleIntakeIdentityInput,
      PeopleIntakeListQuery,
      PeopleIntakePage,
      PeopleIntakePayload,
      PeopleIntakePayloadInput,
      PeopleIntakeRecord,
      PeopleIntakeRequestContext,
      PeopleIntakeReviewDecision,
      PeopleIntakeStatus,
      PeopleIntakeSummary,
      ProposedPerson,
      ProposedPersonIdentifier,
      ProposedPersonIdentifierInput,
      ProposedPersonInput,
      ProposedPersonRelationship,
      ProposedPersonRelationshipInput,
      ReviewPeopleIntakeInput,
      ReviewPeopleIntakeRecordInput,
      ReviewPeopleIntakeRecordResult,
      StoredPeopleIntakeRecord,
      SubmitPeopleIntakeInput,
      SubmitPeopleIntakeRecordInput,
      SubmitPeopleIntakeRecordResult,
      UpdatePeopleIntakeDraftInput,
      UpdatePeopleIntakeRecordInput,
      UpdatePeopleIntakeRecordResult,
    } from './types/people-intake';
    ''',
)
write(
    "packages/people-intake/src/services/people-intake.service.spec.ts",
    '''
    import { describe, expect, it } from 'vitest';

    import type { PeopleIntakeRepository } from '../database/people-intake-repository';
    import { PeopleIntakeModuleError } from '../errors/people-intake-module-error';
    import { PEOPLE_INTAKE_PERMISSIONS } from '../permissions/people-intake-permissions';
    import type {
      CreatePeopleIntakeRecordInput,
      PeopleIntakeRequestContext,
      StoredPeopleIntakeRecord,
    } from '../types/people-intake';
    import { PeopleIntakeService } from './people-intake.service';

    const actorUserId = '11111111-1111-4111-8111-111111111111';
    const tenantId = '22222222-2222-4222-8222-222222222222';
    const organizationId = '33333333-3333-4333-8333-333333333333';
    const intakeId = '44444444-4444-4444-8444-444444444444';

    function context(...permissions: string[]): PeopleIntakeRequestContext {
      return { actorUserId, tenantId, organizationId, permissionCodes: new Set(permissions) };
    }

    function payload() {
      return {
        schemaVersion: 1 as const,
        people: [
          {
            clientKey: 'parent',
            firstName: 'Amina',
            lastName: 'Khan',
            identifiers: [
              {
                identifierType: 'cnic',
                identifierValue: '12345-1234567-1',
                issuingCountryCode: 'PK',
                issuingAuthority: 'NADRA',
              },
            ],
          },
          {
            clientKey: 'child',
            firstName: 'Sara',
            lastName: 'Khan',
            dateOfBirth: '2015-01-10',
          },
        ],
        relationships: [
          {
            sourcePersonKey: 'parent',
            targetPersonKey: 'child',
            relationshipType: 'parent_of',
            relationshipRole: 'mother',
            relationshipBasis: 'biological',
          },
        ],
      };
    }

    function stored(input: CreatePeopleIntakeRecordInput): StoredPeopleIntakeRecord {
      const now = new Date('2026-07-16T00:00:00.000Z');
      return {
        id: intakeId,
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        title: input.title,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        status: 'draft',
        payload: input.payload,
        personCount: input.personCount,
        relationshipCount: input.relationshipCount,
        version: 1,
        createdByUserId: input.actorUserId,
        submittedAt: null,
        reviewedAt: null,
        reviewedByUserId: null,
        reviewDecision: null,
        reviewNotes: null,
        createdAt: now,
        updatedAt: now,
      };
    }

    function repository(): PeopleIntakeRepository {
      return {
        async createDraft(input) {
          return { status: 'created', intake: stored(input) };
        },
        async findById() {
          return null;
        },
        async list() {
          return { status: 'available', items: [], nextCursor: null };
        },
        async updateDraft() {
          return { status: 'not_found' };
        },
        async submit() {
          return { status: 'not_found' };
        },
        async review() {
          return { status: 'not_found' };
        },
      };
    }

    describe('PeopleIntakeService', () => {
      it('creates a normalized draft without mutating canonical People records', async () => {
        const service = new PeopleIntakeService(repository());
        const result = await service.createDraft(context(PEOPLE_INTAKE_PERMISSIONS.create), {
          title: ' Family certificate review ',
          sourceType: ' NADRA_CRC ',
          sourceReference: ' CRC-42 ',
          payload: payload(),
        });
        expect(result.title).toBe('Family certificate review');
        expect(result.sourceType).toBe('nadra_crc');
        expect(result.personCount).toBe(2);
        expect(result.relationshipCount).toBe(1);
        expect(result.payload.people[0]?.identifiers[0]?.issuingCountryCode).toBe('PK');
      });

      it('rejects duplicate identifiers inside a draft', async () => {
        const service = new PeopleIntakeService(repository());
        const duplicate = payload();
        duplicate.people[1] = {
          ...duplicate.people[1],
          identifiers: [
            {
              identifierType: 'cnic',
              identifierValue: '1234512345671',
              issuingCountryCode: 'PK',
              issuingAuthority: 'NADRA',
            },
          ],
        };
        await expect(
          service.createDraft(context(PEOPLE_INTAKE_PERMISSIONS.create), {
            title: 'Duplicate test',
            sourceType: 'manual',
            payload: duplicate,
          }),
        ).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_INVALID_INPUT' });
      });

      it('rejects a proposed parentage cycle', async () => {
        const service = new PeopleIntakeService(repository());
        const cyclic = payload();
        cyclic.relationships.push({
          sourcePersonKey: 'child',
          targetPersonKey: 'parent',
          relationshipType: 'parent_of',
          relationshipRole: 'parent',
          relationshipBasis: 'declared',
        });
        await expect(
          service.createDraft(context(PEOPLE_INTAKE_PERMISSIONS.create), {
            title: 'Cycle test',
            sourceType: 'manual',
            payload: cyclic,
          }),
        ).rejects.toBeInstanceOf(PeopleIntakeModuleError);
      });

      it('requires an explicit create permission', async () => {
        const service = new PeopleIntakeService(repository());
        await expect(
          service.createDraft(context(), {
            title: 'Forbidden',
            sourceType: 'manual',
            payload: payload(),
          }),
        ).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_FORBIDDEN' });
      });
    });
    ''',
)

schema_path = Path("apps/api/prisma/schema.prisma")
schema = schema_path.read_text()
schema = replace_once(
    schema,
    "  personRelationships       CorePersonRelationship[]\n  objects                   CoreObject[]",
    "  personRelationships       CorePersonRelationship[]\n  peopleIntakes             CorePeopleIntake[]\n  objects                   CoreObject[]",
    "tenant intake relation",
)
schema = replace_once(
    schema,
    "  externalReferences    CoreExternalReference[]\n\n  @@unique([tenantId, id])",
    "  externalReferences    CoreExternalReference[]\n  peopleIntakes         CorePeopleIntake[]\n\n  @@unique([tenantId, id])",
    "organization intake relation",
)
schema = replace_once(
    schema,
    "  personRelationshipsVerified CorePersonRelationship[]    @relation(\"PersonRelationshipVerifiedBy\")\n\n  @@index([status])",
    "  personRelationshipsVerified CorePersonRelationship[]    @relation(\"PersonRelationshipVerifiedBy\")\n  peopleIntakesCreated        CorePeopleIntake[]          @relation(\"PeopleIntakeCreatedBy\")\n  peopleIntakesReviewed       CorePeopleIntake[]          @relation(\"PeopleIntakeReviewedBy\")\n\n  @@index([status])",
    "user intake relations",
)
intake_model = '''model CorePeopleIntake {
  id                String    @id @default(uuid()) @db.Uuid
  tenantId          String    @map("tenant_id") @db.Uuid
  organizationId    String    @map("organization_id") @db.Uuid
  title             String    @db.VarChar(128)
  sourceType        String    @map("source_type") @db.VarChar(64)
  sourceReference   String?   @map("source_reference") @db.VarChar(255)
  status            String    @default("draft") @db.VarChar(32)
  payload           Json      @db.JsonB
  personCount       Int       @map("person_count")
  relationshipCount Int       @map("relationship_count")
  version           Int       @default(1)
  createdByUserId   String    @map("created_by_user_id") @db.Uuid
  submittedAt       DateTime? @map("submitted_at") @db.Timestamptz(6)
  reviewedAt        DateTime? @map("reviewed_at") @db.Timestamptz(6)
  reviewedByUserId  String?   @map("reviewed_by_user_id") @db.Uuid
  reviewDecision    String?   @map("review_decision") @db.VarChar(16)
  reviewNotes       String?   @map("review_notes") @db.VarChar(2000)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  tenant         CoreTenant       @relation(fields: [tenantId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  organization   CoreOrganization @relation(fields: [tenantId, organizationId], references: [tenantId, id], onDelete: Restrict, onUpdate: Cascade)
  createdByUser  CoreUser         @relation("PeopleIntakeCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  reviewedByUser CoreUser?        @relation("PeopleIntakeReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)

  // Workflow state, four-eye review, immutable submission, payload shape,
  // and transition integrity are enforced by migration-owned PostgreSQL constraints.
  @@index([tenantId, organizationId, status, submittedAt, id])
  @@index([createdByUserId, status])
  @@index([reviewedByUserId, reviewedAt])
  @@map("core_people_intakes")
}

'''
schema = replace_once(schema, "model CoreUser {", intake_model + "model CoreUser {", "intake model")
schema_path.write_text(schema)

migration_dir = Path("apps/api/prisma/migrations/20260716213000_add_people_intake_verification")
migration_dir.mkdir(parents=True, exist_ok=False)
write(
    str(migration_dir / "migration.sql"),
    '''
    CREATE TABLE "core_people_intakes" (
      "id" UUID NOT NULL,
      "tenant_id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "title" VARCHAR(128) NOT NULL,
      "source_type" VARCHAR(64) NOT NULL,
      "source_reference" VARCHAR(255),
      "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
      "payload" JSONB NOT NULL,
      "person_count" INTEGER NOT NULL,
      "relationship_count" INTEGER NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "created_by_user_id" UUID NOT NULL,
      "submitted_at" TIMESTAMPTZ(6),
      "reviewed_at" TIMESTAMPTZ(6),
      "reviewed_by_user_id" UUID,
      "review_decision" VARCHAR(16),
      "review_notes" VARCHAR(2000),
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "core_people_intakes_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "core_people_intakes_title_check" CHECK (btrim("title") <> ''),
      CONSTRAINT "core_people_intakes_source_type_check" CHECK (btrim("source_type") <> ''),
      CONSTRAINT "core_people_intakes_source_reference_check"
        CHECK ("source_reference" IS NULL OR btrim("source_reference") <> ''),
      CONSTRAINT "core_people_intakes_status_check"
        CHECK ("status" IN ('draft', 'submitted', 'approved', 'rejected')),
      CONSTRAINT "core_people_intakes_payload_check" CHECK (jsonb_typeof("payload") = 'object'),
      CONSTRAINT "core_people_intakes_people_count_check" CHECK ("person_count" BETWEEN 1 AND 50),
      CONSTRAINT "core_people_intakes_relationship_count_check"
        CHECK ("relationship_count" BETWEEN 0 AND 100),
      CONSTRAINT "core_people_intakes_version_check" CHECK ("version" >= 1),
      CONSTRAINT "core_people_intakes_reviewer_check"
        CHECK ("reviewed_by_user_id" IS NULL OR "reviewed_by_user_id" <> "created_by_user_id"),
      CONSTRAINT "core_people_intakes_review_notes_check"
        CHECK ("review_notes" IS NULL OR btrim("review_notes") <> ''),
      CONSTRAINT "core_people_intakes_state_check" CHECK (
        ("status" = 'draft'
          AND "submitted_at" IS NULL
          AND "reviewed_at" IS NULL
          AND "reviewed_by_user_id" IS NULL
          AND "review_decision" IS NULL
          AND "review_notes" IS NULL)
        OR
        ("status" = 'submitted'
          AND "submitted_at" IS NOT NULL
          AND "reviewed_at" IS NULL
          AND "reviewed_by_user_id" IS NULL
          AND "review_decision" IS NULL
          AND "review_notes" IS NULL)
        OR
        ("status" = 'approved'
          AND "submitted_at" IS NOT NULL
          AND "reviewed_at" IS NOT NULL
          AND "reviewed_by_user_id" IS NOT NULL
          AND "review_decision" = 'approved')
        OR
        ("status" = 'rejected'
          AND "submitted_at" IS NOT NULL
          AND "reviewed_at" IS NOT NULL
          AND "reviewed_by_user_id" IS NOT NULL
          AND "review_decision" = 'rejected'
          AND "review_notes" IS NOT NULL
          AND btrim("review_notes") <> '')
      )
    );

    CREATE INDEX "core_people_intakes_scope_queue_idx"
      ON "core_people_intakes"("tenant_id", "organization_id", "status", "submitted_at", "id");
    CREATE INDEX "core_people_intakes_creator_idx"
      ON "core_people_intakes"("created_by_user_id", "status");
    CREATE INDEX "core_people_intakes_reviewer_idx"
      ON "core_people_intakes"("reviewed_by_user_id", "reviewed_at");

    ALTER TABLE "core_people_intakes"
      ADD CONSTRAINT "core_people_intakes_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "core_tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "core_people_intakes"
      ADD CONSTRAINT "core_people_intakes_organization_scope_fkey"
      FOREIGN KEY ("tenant_id", "organization_id")
      REFERENCES "core_organizations"("tenant_id", "id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "core_people_intakes"
      ADD CONSTRAINT "core_people_intakes_created_by_user_id_fkey"
      FOREIGN KEY ("created_by_user_id") REFERENCES "core_users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "core_people_intakes"
      ADD CONSTRAINT "core_people_intakes_reviewed_by_user_id_fkey"
      FOREIGN KEY ("reviewed_by_user_id") REFERENCES "core_users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    CREATE FUNCTION "core_enforce_people_intake_transition"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF OLD."status" IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Reviewed People Intake records are immutable'
          USING ERRCODE = '23514';
      END IF;

      IF OLD."status" = 'submitted' AND NEW."status" NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Submitted People Intake records may only be approved or rejected'
          USING ERRCODE = '23514';
      END IF;

      IF OLD."status" = 'draft' AND NEW."status" NOT IN ('draft', 'submitted') THEN
        RAISE EXCEPTION 'Draft People Intake records must be submitted before review'
          USING ERRCODE = '23514';
      END IF;

      IF OLD."status" <> 'draft' AND (
        NEW."tenant_id" IS DISTINCT FROM OLD."tenant_id"
        OR NEW."organization_id" IS DISTINCT FROM OLD."organization_id"
        OR NEW."title" IS DISTINCT FROM OLD."title"
        OR NEW."source_type" IS DISTINCT FROM OLD."source_type"
        OR NEW."source_reference" IS DISTINCT FROM OLD."source_reference"
        OR NEW."payload" IS DISTINCT FROM OLD."payload"
        OR NEW."person_count" IS DISTINCT FROM OLD."person_count"
        OR NEW."relationship_count" IS DISTINCT FROM OLD."relationship_count"
        OR NEW."created_by_user_id" IS DISTINCT FROM OLD."created_by_user_id"
      ) THEN
        RAISE EXCEPTION 'Submitted People Intake content is immutable'
          USING ERRCODE = '23514';
      END IF;

      IF NEW."version" <> OLD."version" + 1 THEN
        RAISE EXCEPTION 'People Intake updates must increment version exactly once'
          USING ERRCODE = '23514';
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER "core_people_intakes_transition_trigger"
    BEFORE UPDATE ON "core_people_intakes"
    FOR EACH ROW EXECUTE FUNCTION "core_enforce_people_intake_transition"();
    ''',
)

write(
    "apps/api/src/people-intake/prisma-people-intake.repository.ts",
    '''
    import { Inject, Injectable } from '@nestjs/common';
    import type {
      CreatePeopleIntakeRecordInput,
      CreatePeopleIntakeRecordResult,
      ListPeopleIntakesRecordInput,
      ListPeopleIntakesRecordResult,
      PeopleIntakeIdentityInput,
      PeopleIntakeRepository,
      PeopleIntakeReviewDecision,
      PeopleIntakeStatus,
      PeopleIntakeSummary,
      ReviewPeopleIntakeRecordInput,
      ReviewPeopleIntakeRecordResult,
      StoredPeopleIntakeRecord,
      SubmitPeopleIntakeRecordInput,
      SubmitPeopleIntakeRecordResult,
      UpdatePeopleIntakeRecordInput,
      UpdatePeopleIntakeRecordResult,
    } from '@newax/people-intake';

    import { PrismaService } from '../database/prisma.service';
    import type { Prisma } from '../generated/prisma/client';

    interface DatabaseIntakeRecord {
      readonly id: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly title: string;
      readonly sourceType: string;
      readonly sourceReference: string | null;
      readonly status: string;
      readonly payload: unknown;
      readonly personCount: number;
      readonly relationshipCount: number;
      readonly version: number;
      readonly createdByUserId: string;
      readonly submittedAt: Date | null;
      readonly reviewedAt: Date | null;
      readonly reviewedByUserId: string | null;
      readonly reviewDecision: string | null;
      readonly reviewNotes: string | null;
      readonly createdAt: Date;
      readonly updatedAt: Date;
    }

    @Injectable()
    export class PrismaPeopleIntakeRepository implements PeopleIntakeRepository {
      constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

      async createDraft(
        input: CreatePeopleIntakeRecordInput,
      ): Promise<CreatePeopleIntakeRecordResult> {
        return this.prisma.$transaction(async (transaction) => {
          if (!(await this.organizationAvailable(transaction, input.tenantId, input.organizationId))) {
            return { status: 'organization_unavailable' };
          }
          const record = await transaction.corePeopleIntake.create({
            data: {
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              title: input.title,
              sourceType: input.sourceType,
              sourceReference: input.sourceReference,
              status: 'draft',
              payload: input.payload as unknown as Prisma.InputJsonValue,
              personCount: input.personCount,
              relationshipCount: input.relationshipCount,
              createdByUserId: input.actorUserId,
            },
          });
          return { status: 'created', intake: this.mapRecord(record) };
        });
      }

      async findById(input: PeopleIntakeIdentityInput): Promise<StoredPeopleIntakeRecord | null> {
        const record = await this.prisma.corePeopleIntake.findFirst({
          where: {
            id: input.id,
            tenantId: input.tenantId,
            organizationId: input.organizationId,
          },
        });
        return record === null ? null : this.mapRecord(record);
      }

      async list(input: ListPeopleIntakesRecordInput): Promise<ListPeopleIntakesRecordResult> {
        return this.prisma.$transaction(async (transaction) => {
          if (!(await this.organizationAvailable(transaction, input.tenantId, input.organizationId))) {
            return { status: 'organization_unavailable' };
          }
          if (input.afterId !== undefined) {
            const cursor = await transaction.corePeopleIntake.findFirst({
              where: {
                id: input.afterId,
                tenantId: input.tenantId,
                organizationId: input.organizationId,
              },
              select: { id: true },
            });
            if (cursor === null) {
              return { status: 'cursor_invalid' };
            }
          }
          const records = await transaction.corePeopleIntake.findMany({
            where: {
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              ...(input.status === undefined ? {} : { status: input.status }),
            },
            orderBy: { id: 'asc' },
            take: input.limit + 1,
            ...(input.afterId === undefined ? {} : { cursor: { id: input.afterId }, skip: 1 }),
          });
          const hasMore = records.length > input.limit;
          const page = hasMore ? records.slice(0, input.limit) : records;
          return {
            status: 'available',
            items: page.map((record) => this.mapSummary(record)),
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
          };
        });
      }

      async updateDraft(
        input: UpdatePeopleIntakeRecordInput,
      ): Promise<UpdatePeopleIntakeRecordResult> {
        return this.prisma.$transaction(async (transaction) => {
          await this.lock(transaction, input.tenantId, input.organizationId, input.id);
          const current = await transaction.corePeopleIntake.findFirst({
            where: { id: input.id, tenantId: input.tenantId, organizationId: input.organizationId },
          });
          if (current === null) {
            return { status: 'not_found' };
          }
          if (current.createdByUserId !== input.actorUserId) {
            return { status: 'creator_mismatch' };
          }
          if (current.status !== 'draft') {
            return { status: 'state_conflict' };
          }
          if (current.version !== input.expectedVersion) {
            return { status: 'version_conflict' };
          }
          const record = await transaction.corePeopleIntake.update({
            where: { id: input.id },
            data: {
              title: input.title,
              sourceType: input.sourceType,
              sourceReference: input.sourceReference,
              payload: input.payload as unknown as Prisma.InputJsonValue,
              personCount: input.personCount,
              relationshipCount: input.relationshipCount,
              version: { increment: 1 },
            },
          });
          return { status: 'updated', intake: this.mapRecord(record) };
        });
      }

      async submit(
        input: SubmitPeopleIntakeRecordInput,
      ): Promise<SubmitPeopleIntakeRecordResult> {
        return this.prisma.$transaction(async (transaction) => {
          await this.lock(transaction, input.tenantId, input.organizationId, input.id);
          const current = await transaction.corePeopleIntake.findFirst({
            where: { id: input.id, tenantId: input.tenantId, organizationId: input.organizationId },
          });
          if (current === null) {
            return { status: 'not_found' };
          }
          if (current.createdByUserId !== input.actorUserId) {
            return { status: 'creator_mismatch' };
          }
          if (current.status !== 'draft') {
            return { status: 'state_conflict' };
          }
          if (current.version !== input.expectedVersion) {
            return { status: 'version_conflict' };
          }
          const record = await transaction.corePeopleIntake.update({
            where: { id: input.id },
            data: {
              status: 'submitted',
              submittedAt: input.submittedAt,
              version: { increment: 1 },
            },
          });
          return { status: 'submitted', intake: this.mapRecord(record) };
        });
      }

      async review(
        input: ReviewPeopleIntakeRecordInput,
      ): Promise<ReviewPeopleIntakeRecordResult> {
        return this.prisma.$transaction(async (transaction) => {
          await this.lock(transaction, input.tenantId, input.organizationId, input.id);
          const current = await transaction.corePeopleIntake.findFirst({
            where: { id: input.id, tenantId: input.tenantId, organizationId: input.organizationId },
          });
          if (current === null) {
            return { status: 'not_found' };
          }
          if (current.createdByUserId === input.reviewerUserId) {
            return { status: 'self_review' };
          }
          if (current.status !== 'submitted') {
            return { status: 'state_conflict' };
          }
          if (current.version !== input.expectedVersion) {
            return { status: 'version_conflict' };
          }
          const record = await transaction.corePeopleIntake.update({
            where: { id: input.id },
            data: {
              status: input.decision,
              reviewedAt: input.reviewedAt,
              reviewedByUserId: input.reviewerUserId,
              reviewDecision: input.decision,
              reviewNotes: input.notes,
              version: { increment: 1 },
            },
          });
          return { status: 'reviewed', intake: this.mapRecord(record) };
        });
      }

      private async organizationAvailable(
        transaction: Prisma.TransactionClient,
        tenantId: string,
        organizationId: string,
      ): Promise<boolean> {
        const organization = await transaction.coreOrganization.findFirst({
          where: {
            id: organizationId,
            tenantId,
            status: 'active',
            deletedAt: null,
            tenant: { is: { status: 'active', deletedAt: null } },
          },
          select: { id: true },
        });
        return organization !== null;
      }

      private async lock(
        transaction: Prisma.TransactionClient,
        tenantId: string,
        organizationId: string,
        intakeId: string,
      ): Promise<void> {
        const key = `people-intake|${tenantId}|${organizationId}|${intakeId}`;
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
        `;
      }

      private mapRecord(record: DatabaseIntakeRecord): StoredPeopleIntakeRecord {
        return { ...this.mapSummary(record), payload: record.payload };
      }

      private mapSummary(record: DatabaseIntakeRecord): PeopleIntakeSummary {
        return {
          id: record.id,
          tenantId: record.tenantId,
          organizationId: record.organizationId,
          title: record.title,
          sourceType: record.sourceType,
          sourceReference: record.sourceReference,
          status: this.status(record.status),
          personCount: record.personCount,
          relationshipCount: record.relationshipCount,
          version: record.version,
          createdByUserId: record.createdByUserId,
          submittedAt: record.submittedAt,
          reviewedAt: record.reviewedAt,
          reviewedByUserId: record.reviewedByUserId,
          reviewDecision: this.decision(record.reviewDecision),
          reviewNotes: record.reviewNotes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      }

      private status(value: string): PeopleIntakeStatus {
        if (value === 'draft' || value === 'submitted' || value === 'approved' || value === 'rejected') {
          return value;
        }
        throw new Error(`Unsupported People Intake status: ${value}`);
      }

      private decision(value: string | null): PeopleIntakeReviewDecision | null {
        if (value === null || value === 'approved' || value === 'rejected') {
          return value;
        }
        throw new Error(`Unsupported People Intake review decision: ${value}`);
      }
    }
    ''',
)
write(
    "apps/api/src/people-intake/people-intake.module.ts",
    '''
    import { Module } from '@nestjs/common';
    import { PeopleIntakeService } from '@newax/people-intake';

    import { DatabaseModule } from '../database/database.module';
    import { RequestContextModule } from '../request-context/request-context.module';
    import { CurrentOrganizationPeopleIntakesController } from './current-organization-people-intakes.controller';
    import { PrismaPeopleIntakeRepository } from './prisma-people-intake.repository';

    @Module({
      imports: [DatabaseModule, RequestContextModule],
      controllers: [CurrentOrganizationPeopleIntakesController],
      providers: [
        PrismaPeopleIntakeRepository,
        {
          provide: PeopleIntakeService,
          inject: [PrismaPeopleIntakeRepository],
          useFactory: (repository: PrismaPeopleIntakeRepository): PeopleIntakeService =>
            new PeopleIntakeService(repository),
        },
      ],
      exports: [PeopleIntakeService],
    })
    export class PeopleIntakeModule {}
    ''',
)
write(
    "apps/api/src/people-intake/current-organization-people-intakes.input.ts",
    '''
    import type {
      CreatePeopleIntakeDraftInput,
      PeopleIntakeListQuery,
      PeopleIntakePayloadInput,
      ReviewPeopleIntakeInput,
      SubmitPeopleIntakeInput,
      UpdatePeopleIntakeDraftInput,
    } from '@newax/people-intake';
    import { HttpSecurityError } from '@newax/http-security';

    type ObjectValue = Record<string, unknown>;

    export function parsePeopleIntakeListQuery(query: unknown): PeopleIntakeListQuery {
      const object = objectValue(query, 'query');
      allowed(object, ['status', 'limit', 'after_id'], 'query');
      const result: { status?: 'draft' | 'submitted' | 'approved' | 'rejected'; limit?: number; afterId?: string } = {};
      if (object.status !== undefined) {
        const value = stringValue(object.status, 'status');
        if (value !== 'draft' && value !== 'submitted' && value !== 'approved' && value !== 'rejected') {
          invalid('status must be draft, submitted, approved, or rejected.');
        }
        result.status = value;
      }
      if (object.limit !== undefined) {
        const value = Number(stringValue(object.limit, 'limit'));
        if (!Number.isInteger(value)) {
          invalid('limit must be an integer.');
        }
        result.limit = value;
      }
      if (object.after_id !== undefined) {
        result.afterId = stringValue(object.after_id, 'after_id');
      }
      return result;
    }

    export function parseCreatePeopleIntakeBody(body: unknown): CreatePeopleIntakeDraftInput {
      const object = objectValue(body, 'body');
      allowed(object, ['title', 'source_type', 'source_reference', 'payload'], 'body');
      const result: {
        title: string;
        sourceType: string;
        sourceReference?: string | null;
        payload: PeopleIntakePayloadInput;
      } = {
        title: stringValue(object.title, 'title'),
        sourceType: stringValue(object.source_type, 'source_type'),
        payload: payloadValue(object.payload),
      };
      if ('source_reference' in object) {
        result.sourceReference = nullableString(object.source_reference, 'source_reference');
      }
      return result;
    }

    export function parseUpdatePeopleIntakeBody(body: unknown): UpdatePeopleIntakeDraftInput {
      const object = objectValue(body, 'body');
      allowed(
        object,
        ['expected_version', 'title', 'source_type', 'source_reference', 'payload'],
        'body',
      );
      const base = parseCreatePeopleIntakeBody({
        title: object.title,
        source_type: object.source_type,
        source_reference: object.source_reference,
        payload: object.payload,
      });
      return { ...base, expectedVersion: integerValue(object.expected_version, 'expected_version') };
    }

    export function parseSubmitPeopleIntakeBody(body: unknown): SubmitPeopleIntakeInput {
      const object = objectValue(body, 'body');
      allowed(object, ['expected_version'], 'body');
      return { expectedVersion: integerValue(object.expected_version, 'expected_version') };
    }

    export function parseReviewPeopleIntakeBody(body: unknown): ReviewPeopleIntakeInput {
      const object = objectValue(body, 'body');
      allowed(object, ['expected_version', 'decision', 'notes'], 'body');
      const decision = stringValue(object.decision, 'decision');
      if (decision !== 'approved' && decision !== 'rejected') {
        invalid('decision must be approved or rejected.');
      }
      const result: { expectedVersion: number; decision: 'approved' | 'rejected'; notes?: string | null } = {
        expectedVersion: integerValue(object.expected_version, 'expected_version'),
        decision,
      };
      if ('notes' in object) {
        result.notes = nullableString(object.notes, 'notes');
      }
      return result;
    }

    export function assertEmptyPeopleIntakeQuery(query: unknown): void {
      const object = objectValue(query, 'query');
      allowed(object, [], 'query');
    }

    function payloadValue(value: unknown): PeopleIntakePayloadInput {
      const object = objectValue(value, 'payload');
      allowed(object, ['schema_version', 'people', 'relationships'], 'payload');
      if (object.schema_version !== 1) {
        invalid('payload.schema_version must be 1.');
      }
      if (!Array.isArray(object.people) || !Array.isArray(object.relationships)) {
        invalid('payload.people and payload.relationships must be arrays.');
      }
      return {
        schemaVersion: 1,
        people: object.people.map((person, index) => personValue(person, index)),
        relationships: object.relationships.map((relationship, index) =>
          relationshipValue(relationship, index),
        ),
      };
    }

    function personValue(value: unknown, index: number) {
      const field = `payload.people[${String(index)}]`;
      const object = objectValue(value, field);
      allowed(
        object,
        [
          'client_key',
          'first_name',
          'middle_name',
          'last_name',
          'preferred_name',
          'date_of_birth',
          'gender',
          'identifiers',
        ],
        field,
      );
      const result: {
        clientKey: string;
        firstName: string;
        middleName?: string | null;
        lastName: string;
        preferredName?: string | null;
        dateOfBirth?: string | null;
        gender?: string | null;
        identifiers?: readonly ReturnType<typeof identifierValue>[];
      } = {
        clientKey: stringValue(object.client_key, `${field}.client_key`),
        firstName: stringValue(object.first_name, `${field}.first_name`),
        lastName: stringValue(object.last_name, `${field}.last_name`),
      };
      if ('middle_name' in object) result.middleName = nullableString(object.middle_name, `${field}.middle_name`);
      if ('preferred_name' in object) result.preferredName = nullableString(object.preferred_name, `${field}.preferred_name`);
      if ('date_of_birth' in object) result.dateOfBirth = nullableString(object.date_of_birth, `${field}.date_of_birth`);
      if ('gender' in object) result.gender = nullableString(object.gender, `${field}.gender`);
      if ('identifiers' in object) {
        if (!Array.isArray(object.identifiers)) invalid(`${field}.identifiers must be an array.`);
        result.identifiers = object.identifiers.map((identifier, identifierIndex) =>
          identifierValue(identifier, index, identifierIndex),
        );
      }
      return result;
    }

    function identifierValue(value: unknown, personIndex: number, identifierIndex: number) {
      const field = `payload.people[${String(personIndex)}].identifiers[${String(identifierIndex)}]`;
      const object = objectValue(value, field);
      allowed(
        object,
        ['identifier_type', 'identifier_value', 'issuing_authority', 'issuing_country_code'],
        field,
      );
      const result: {
        identifierType: string;
        identifierValue: string;
        issuingAuthority?: string | null;
        issuingCountryCode?: string | null;
      } = {
        identifierType: stringValue(object.identifier_type, `${field}.identifier_type`),
        identifierValue: stringValue(object.identifier_value, `${field}.identifier_value`),
      };
      if ('issuing_authority' in object) result.issuingAuthority = nullableString(object.issuing_authority, `${field}.issuing_authority`);
      if ('issuing_country_code' in object) result.issuingCountryCode = nullableString(object.issuing_country_code, `${field}.issuing_country_code`);
      return result;
    }

    function relationshipValue(value: unknown, index: number) {
      const field = `payload.relationships[${String(index)}]`;
      const object = objectValue(value, field);
      allowed(
        object,
        [
          'source_person_key',
          'target_person_key',
          'relationship_type',
          'relationship_role',
          'relationship_basis',
        ],
        field,
      );
      return {
        sourcePersonKey: stringValue(object.source_person_key, `${field}.source_person_key`),
        targetPersonKey: stringValue(object.target_person_key, `${field}.target_person_key`),
        relationshipType: stringValue(object.relationship_type, `${field}.relationship_type`),
        relationshipRole: stringValue(object.relationship_role, `${field}.relationship_role`),
        relationshipBasis: stringValue(object.relationship_basis, `${field}.relationship_basis`),
      };
    }

    function objectValue(value: unknown, field: string): ObjectValue {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        invalid(`${field} must be an object.`);
      }
      return value as ObjectValue;
    }

    function allowed(object: ObjectValue, keys: readonly string[], field: string): void {
      const allowedKeys = new Set(keys);
      for (const key of Object.keys(object)) {
        if (!allowedKeys.has(key)) invalid(`${field} contains unsupported field ${key}.`);
      }
    }

    function stringValue(value: unknown, field: string): string {
      if (typeof value !== 'string') invalid(`${field} must be text.`);
      return value;
    }

    function nullableString(value: unknown, field: string): string | null {
      if (value === null) return null;
      return stringValue(value, field);
    }

    function integerValue(value: unknown, field: string): number {
      if (typeof value !== 'number' || !Number.isInteger(value)) invalid(`${field} must be an integer.`);
      return value;
    }

    function invalid(message: string): never {
      throw new HttpSecurityError('HTTP_SECURITY_INVALID_INPUT', message, 400);
    }
    ''',
)
write(
    "apps/api/src/people-intake/current-organization-people-intakes.controller.ts",
    '''
    import {
      Body,
      Controller,
      Get,
      Header,
      HttpCode,
      Inject,
      Param,
      Post,
      Put,
      Query,
      Req,
    } from '@nestjs/common';
    import {
      PEOPLE_INTAKE_PERMISSIONS,
      PeopleIntakeService,
      type PeopleIntakeRecord,
      type PeopleIntakeSummary,
    } from '@newax/people-intake';
    import { HttpSecurityError } from '@newax/http-security';
    import { ContextAuthorizer, type TrustedOrganizationRequestContext } from '@newax/request-context';

    import {
      OrganizationContextEndpoint,
      RequirePermissions,
    } from '../http-security/http-security.decorators';
    import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';
    import {
      assertEmptyPeopleIntakeQuery,
      parseCreatePeopleIntakeBody,
      parsePeopleIntakeListQuery,
      parseReviewPeopleIntakeBody,
      parseSubmitPeopleIntakeBody,
      parseUpdatePeopleIntakeBody,
    } from './current-organization-people-intakes.input';

    @Controller('core/organizations/current/people-intakes')
    export class CurrentOrganizationPeopleIntakesController {
      constructor(
        @Inject(PeopleIntakeService) private readonly intakes: PeopleIntakeService,
        @Inject(ContextAuthorizer) private readonly authorizer: ContextAuthorizer,
      ) {}

      @Get()
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.view)
      async list(@Req() request: HttpSecurityRequestAdapter, @Query() query: unknown) {
        const page = await this.intakes.list(
          this.context(request),
          parsePeopleIntakeListQuery(query),
        );
        return {
          success: true as const,
          data: {
            items: page.items.map((item) => this.summary(item)),
            next_cursor: page.nextCursor,
          },
        };
      }

      @Post()
      @HttpCode(201)
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.create)
      async create(
        @Req() request: HttpSecurityRequestAdapter,
        @Query() query: unknown,
        @Body() body: unknown,
      ) {
        assertEmptyPeopleIntakeQuery(query);
        return {
          success: true as const,
          data: this.record(
            await this.intakes.createDraft(this.context(request), parseCreatePeopleIntakeBody(body)),
          ),
        };
      }

      @Get(':intakeId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.view)
      async get(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('intakeId') intakeId: string,
        @Query() query: unknown,
      ) {
        assertEmptyPeopleIntakeQuery(query);
        return {
          success: true as const,
          data: this.record(await this.intakes.get(this.context(request), intakeId)),
        };
      }

      @Put(':intakeId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.update)
      async update(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('intakeId') intakeId: string,
        @Query() query: unknown,
        @Body() body: unknown,
      ) {
        assertEmptyPeopleIntakeQuery(query);
        return {
          success: true as const,
          data: this.record(
            await this.intakes.updateDraft(
              this.context(request),
              intakeId,
              parseUpdatePeopleIntakeBody(body),
            ),
          ),
        };
      }

      @Post(':intakeId/submit')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.submit)
      async submit(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('intakeId') intakeId: string,
        @Query() query: unknown,
        @Body() body: unknown,
      ) {
        assertEmptyPeopleIntakeQuery(query);
        return {
          success: true as const,
          data: this.record(
            await this.intakes.submit(
              this.context(request),
              intakeId,
              parseSubmitPeopleIntakeBody(body),
            ),
          ),
        };
      }

      @Post(':intakeId/review')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.review)
      async review(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('intakeId') intakeId: string,
        @Query() query: unknown,
        @Body() body: unknown,
      ) {
        assertEmptyPeopleIntakeQuery(query);
        return {
          success: true as const,
          data: this.record(
            await this.intakes.review(
              this.context(request),
              intakeId,
              parseReviewPeopleIntakeBody(body),
            ),
          ),
        };
      }

      private context(request: HttpSecurityRequestAdapter) {
        const context = this.organizationContext(request);
        return this.authorizer.toModuleContext(context);
      }

      private organizationContext(
        request: HttpSecurityRequestAdapter,
      ): TrustedOrganizationRequestContext {
        const context = request.trustedContext;
        if (context === undefined || context.scope !== 'organization') {
          throw new HttpSecurityError(
            'HTTP_SECURITY_INVALID_INPUT',
            'Trusted organization context was not established.',
            500,
          );
        }
        return context;
      }

      private summary(item: PeopleIntakeSummary) {
        return {
          id: item.id,
          title: item.title,
          source_type: item.sourceType,
          source_reference: item.sourceReference,
          status: item.status,
          person_count: item.personCount,
          relationship_count: item.relationshipCount,
          version: item.version,
          created_by_user_id: item.createdByUserId,
          submitted_at: item.submittedAt?.toISOString() ?? null,
          reviewed_at: item.reviewedAt?.toISOString() ?? null,
          reviewed_by_user_id: item.reviewedByUserId,
          review_decision: item.reviewDecision,
          review_notes: item.reviewNotes,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString(),
        };
      }

      private record(item: PeopleIntakeRecord) {
        return {
          ...this.summary(item),
          payload: {
            schema_version: 1 as const,
            people: item.payload.people.map((person) => ({
              client_key: person.clientKey,
              first_name: person.firstName,
              middle_name: person.middleName,
              last_name: person.lastName,
              preferred_name: person.preferredName,
              date_of_birth: person.dateOfBirth,
              gender: person.gender,
              identifiers: person.identifiers.map((identifier) => ({
                identifier_type: identifier.identifierType,
                identifier_value: identifier.identifierValue,
                issuing_authority: identifier.issuingAuthority,
                issuing_country_code: identifier.issuingCountryCode,
              })),
            })),
            relationships: item.payload.relationships.map((relationship) => ({
              source_person_key: relationship.sourcePersonKey,
              target_person_key: relationship.targetPersonKey,
              relationship_type: relationship.relationshipType,
              relationship_role: relationship.relationshipRole,
              relationship_basis: relationship.relationshipBasis,
            })),
          },
        };
      }
    }
    ''',
)

app_module_path = Path("apps/api/src/app.module.ts")
app_module = app_module_path.read_text()
app_module = replace_once(
    app_module,
    "import { PeopleModule } from './people/people.module';",
    "import { PeopleIntakeModule } from './people-intake/people-intake.module';\nimport { PeopleModule } from './people/people.module';",
    "app module import",
)
app_module = replace_once(
    app_module,
    "    PeopleModule,\n    ContactsModule,",
    "    PeopleModule,\n    PeopleIntakeModule,\n    ContactsModule,",
    "app module composition",
)
app_module_path.write_text(app_module)

api_package_path = Path("apps/api/package.json")
api_package = json.loads(api_package_path.read_text())
api_package["dependencies"]["@newax/people-intake"] = "workspace:*"
api_package["scripts"]["build:foundation"] = api_package["scripts"]["build:foundation"].replace(
    "pnpm --filter @newax/people build &&",
    "pnpm --filter @newax/people build && pnpm --filter @newax/people-intake build &&",
)
api_package_path.write_text(json.dumps(api_package, indent=2) + "\n")

filter_path = Path("apps/api/src/http-security/http-security-exception.filter.ts")
filter_text = filter_path.read_text()
filter_text = replace_once(
    filter_text,
    "(ORGANIZATION|PERSON|CONTACT|ADDRESS|OBJECT|MEMBERSHIP|ACCESS|USER|AUTHENTICATION|REQUEST_CONTEXT|HTTP_SECURITY)",
    "(ORGANIZATION|PERSON|PEOPLE_INTAKE|CONTACT|ADDRESS|OBJECT|MEMBERSHIP|ACCESS|USER|AUTHENTICATION|REQUEST_CONTEXT|HTTP_SECURITY)",
    "known error prefix",
)
filter_path.write_text(filter_text)

write(
    "apps/api/src/database/people-intake-schema.spec.ts",
    '''
    import { readFileSync } from 'node:fs';
    import { resolve } from 'node:path';

    import { describe, expect, it } from 'vitest';

    const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'prisma/migrations/20260716213000_add_people_intake_verification/migration.sql',
      ),
      'utf8',
    );

    describe('People Intake schema foundation', () => {
      it('owns a tenant- and organization-scoped JSON staging record', () => {
        expect(schema).toContain('model CorePeopleIntake');
        expect(schema).toContain('payload');
        expect(schema).toContain('@db.JsonB');
        expect(schema).toContain('@@map("core_people_intakes")');
      });

      it('enforces review, transition, scope, and immutability controls', () => {
        expect(migration).toContain('core_people_intakes_organization_scope_fkey');
        expect(migration).toContain('core_people_intakes_reviewer_check');
        expect(migration).toContain('core_people_intakes_state_check');
        expect(migration).toContain('core_people_intakes_transition_trigger');
        expect(migration).toContain('Submitted People Intake content is immutable');
        expect(migration).toContain('version exactly once');
      });
    });
    ''',
)
write(
    "apps/api/src/database/people-intake-database.spec.ts",
    '''
    import { randomUUID } from 'node:crypto';

    import { Pool, type PoolClient } from 'pg';
    import { afterAll, beforeAll, describe, expect, it } from 'vitest';

    const databaseUrl = process.env.DATABASE_URL;

    interface Fixture {
      readonly tenantId: string;
      readonly organizationId: string;
      readonly creatorUserId: string;
      readonly reviewerUserId: string;
    }

    async function fixture(client: PoolClient): Promise<Fixture> {
      const tenantId = randomUUID();
      const organizationId = randomUUID();
      const creatorPersonId = randomUUID();
      const reviewerPersonId = randomUUID();
      const creatorUserId = randomUUID();
      const reviewerUserId = randomUUID();
      await client.query(
        `INSERT INTO "core_tenants" ("id", "name", "updated_at") VALUES ($1, 'Intake Test', CURRENT_TIMESTAMP)`,
        [tenantId],
      );
      await client.query(
        `INSERT INTO "core_organizations" (
          "id", "tenant_id", "legal_name", "display_name", "organization_type", "updated_at"
        ) VALUES ($1, $2, 'Intake Test', 'Intake Test', 'company', CURRENT_TIMESTAMP)`,
        [organizationId, tenantId],
      );
      for (const [personId, firstName] of [
        [creatorPersonId, 'Creator'],
        [reviewerPersonId, 'Reviewer'],
      ] as const) {
        await client.query(
          `INSERT INTO "core_people" ("id", "first_name", "last_name", "updated_at")
           VALUES ($1, $2, 'IntakeTest', CURRENT_TIMESTAMP)`,
          [personId, firstName],
        );
      }
      await client.query(
        `INSERT INTO "core_users" ("id", "person_id", "status", "updated_at")
         VALUES ($1, $2, 'active', CURRENT_TIMESTAMP), ($3, $4, 'active', CURRENT_TIMESTAMP)`,
        [creatorUserId, creatorPersonId, reviewerUserId, reviewerPersonId],
      );
      return { tenantId, organizationId, creatorUserId, reviewerUserId };
    }

    async function createDraft(client: PoolClient, value: Fixture): Promise<string> {
      const id = randomUUID();
      await client.query(
        `INSERT INTO "core_people_intakes" (
          "id", "tenant_id", "organization_id", "title", "source_type", "payload",
          "person_count", "relationship_count", "created_by_user_id"
        ) VALUES ($1, $2, $3, 'Family intake', 'manual', $4::jsonb, 1, 0, $5)`,
        [
          id,
          value.tenantId,
          value.organizationId,
          JSON.stringify({ schemaVersion: 1, people: [{ clientKey: 'person' }], relationships: [] }),
          value.creatorUserId,
        ],
      );
      return id;
    }

    describe.skipIf(!databaseUrl)('People Intake PostgreSQL integrity', () => {
      let pool: Pool;

      beforeAll(async () => {
        pool = new Pool({ connectionString: databaseUrl ?? 'postgresql://invalid/invalid' });
        await pool.query('SELECT 1');
      });

      afterAll(async () => {
        await pool.end();
      });

      async function transaction(assertion: (client: PoolClient) => Promise<void>): Promise<void> {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await assertion(client);
        } finally {
          await client.query('ROLLBACK');
          client.release();
        }
      }

      it('supports a four-eye draft, submit, and approval transition', async () => {
        await transaction(async (client) => {
          const value = await fixture(client);
          const id = await createDraft(client, value);
          await client.query(
            `UPDATE "core_people_intakes"
             SET "status" = 'submitted', "submitted_at" = CURRENT_TIMESTAMP, "version" = 2
             WHERE "id" = $1`,
            [id],
          );
          await client.query(
            `UPDATE "core_people_intakes"
             SET "status" = 'approved', "review_decision" = 'approved',
                 "reviewed_at" = CURRENT_TIMESTAMP, "reviewed_by_user_id" = $2, "version" = 3
             WHERE "id" = $1`,
            [id, value.reviewerUserId],
          );
          const result = await client.query<{ status: string; version: number }>(
            `SELECT "status", "version" FROM "core_people_intakes" WHERE "id" = $1`,
            [id],
          );
          expect(result.rows).toEqual([{ status: 'approved', version: 3 }]);
        });
      });

      it('rejects self-review and rejected records without notes', async () => {
        await transaction(async (client) => {
          const value = await fixture(client);
          const id = await createDraft(client, value);
          await client.query(
            `UPDATE "core_people_intakes"
             SET "status" = 'submitted', "submitted_at" = CURRENT_TIMESTAMP, "version" = 2
             WHERE "id" = $1`,
            [id],
          );
          await expect(
            client.query(
              `UPDATE "core_people_intakes"
               SET "status" = 'rejected', "review_decision" = 'rejected',
                   "reviewed_at" = CURRENT_TIMESTAMP, "reviewed_by_user_id" = $2, "version" = 3
               WHERE "id" = $1`,
              [id, value.creatorUserId],
            ),
          ).rejects.toMatchObject({ code: '23514' });
        });
      });

      it('makes submitted content immutable and requires exact version increments', async () => {
        await transaction(async (client) => {
          const value = await fixture(client);
          const id = await createDraft(client, value);
          await client.query(
            `UPDATE "core_people_intakes"
             SET "status" = 'submitted', "submitted_at" = CURRENT_TIMESTAMP, "version" = 2
             WHERE "id" = $1`,
            [id],
          );
          await expect(
            client.query(
              `UPDATE "core_people_intakes"
               SET "title" = 'Changed after submit', "version" = 3 WHERE "id" = $1`,
              [id],
            ),
          ).rejects.toMatchObject({ code: '23514' });
        });
      });
    });
    ''',
)

registry_path = Path("registry/module-registry.json")
registry = json.loads(registry_path.read_text())
registry["registry_version"] = "0.1.17"
registry["last_updated"] = "2026-07-16"
module = {
    "module_name": "People Intake",
    "module_key": "people-intake",
    "module_layer": "foundation",
    "module_version": "0.1.0",
    "module_status": "draft",
    "module_owner": "NEWAX Engineering",
    "description": "Stages and independently verifies proposed people, identifiers, and person relationships before canonical People Registry application.",
    "dependencies": [
        {"module_key": "tenants", "version": ">=0.1.0"},
        {"module_key": "organizations", "version": ">=0.2.0"},
        {"module_key": "people", "version": ">=0.2.0"},
        {"module_key": "users", "version": ">=0.1.0"},
        {"module_key": "audit", "version": ">=0.1.0"},
    ],
    "required_permissions": [
        "people_intake.view",
        "people_intake.create",
        "people_intake.update",
        "people_intake.submit",
        "people_intake.review",
    ],
    "exposed_events": [],
    "consumed_events": [],
    "configuration_options": [
        "people_intake_max_people",
        "people_intake_max_relationships",
        "people_intake_review_policy",
    ],
    "database_ownership": ["core_people_intakes"],
    "tenant_scope": "organization_scoped_staging",
    "documentation_path": "packages/people-intake/README.md",
    "changelog_path": "packages/people-intake/CHANGELOG.md",
    "compatibility_notes": "Draft and reviewed intake records are not canonical People Registry records. Applying an approved intake remains a separate controlled capability.",
}
people_index = next(index for index, item in enumerate(registry["modules"]) if item["module_key"] == "people")
registry["modules"].insert(people_index + 1, module)
registry_path.write_text(json.dumps(registry, indent=2) + "\n")

explain_path = Path("tooling/database-registry/explain.js")
explain = explain_path.read_text()
explain = replace_once(
    explain,
    "    CorePersonRelationship: [",
    "    CorePeopleIntake: [\n      'People intake',\n      'A versioned draft and independent-review record for proposed people, identifiers, and relationships before canonical application.',\n      'A family certificate entered as a draft, submitted for checking, and approved or rejected without creating people yet.',\n      'people-intake',\n    ],\n    CorePersonRelationship: [",
    "registry explanation",
)
explain_path.write_text(explain)

write(
    "docs/decisions/0025-stage-and-verify-people-intake-before-canonical-application.md",
    '''
    # ADR 0025: Stage And Verify People Intake Before Canonical Application

    ## Status

    Proposed.

    ## Context

    Family certificates and other identity documents may contain several people, official identifiers, and relationships. Writing extracted or manually entered values directly into canonical People Registry tables would make incomplete, mistyped, or unreviewed information operationally authoritative.

    ## Decision

    NEWAX Core will stage proposed identity data in the People Intake module. A draft belongs to one Tenant and Organization context, contains a versioned payload, and follows `draft -> submitted -> approved | rejected`.

    Submitted content is immutable. The creator cannot review the same submission. Approval records reviewer and time but does not create canonical people, identifiers, or relationships. Canonical application is a separate future transaction with its own duplicate detection and permissions.

    ## Consequences

    - Data entry and verification can proceed without contaminating canonical identity records.
    - Review queues can show non-sensitive summaries while detailed values remain permission-protected.
    - Concurrent edits and decisions use optimistic versions plus transaction-scoped advisory locks.
    - The dashboard must treat an approved intake as approved evidence, not as completed canonical import.
    - A later application slice must map approved proposals to existing or new people in one audited transaction.
    ''',
)

readme_path = Path("packages/people-intake/README.md")
readme_path.write_text(textwrap.dedent('''
# NEWAX People Intake Module

## Status

Draft reusable foundation module.

Version: `0.1.0`

## Purpose

People Intake provides controlled staging and independent verification for proposed people, official identifiers, and person-to-person relationships before any information is applied to the canonical People Registry.

The first dashboard experience supports family data. The module remains reusable for future employee, student, patient, customer, and other identity-intake workflows.

## Ownership boundary

People Intake owns:

- Intake workflow identity and Organization scope.
- Versioned draft payloads.
- Draft creator and timestamps.
- Submission state.
- Independent approval or rejection evidence.
- Review notes and optimistic version.

People Intake does not own canonical people, identifiers, relationships, files, memberships, users, or audit records.

Database ownership:

```text
core_people_intakes
```

## Workflow

```text
draft -> submitted -> approved
                  -> rejected
```

Rules:

- Only the creator may edit or submit a draft.
- Submitted content is immutable.
- The creator cannot approve or reject the same submission.
- Rejection requires nonblank reviewer notes.
- Every update increments the optimistic version exactly once.
- Approval verifies the intake record only. It does not create canonical People Registry records.

## Payload

A version-1 payload contains:

- 1 to 50 proposed people.
- Up to 8 identifiers per proposed person.
- Up to 100 proposed relationships.
- Stable client keys linking relationships to proposed people.
- Name, optional date-of-birth, gender, identifier, and relationship fields.

Validation rejects duplicate client keys, repeated normalized official identifiers, unknown relationship endpoints, self-links, duplicate relationships, future or invalid dates, and parentage cycles.

## Permissions

```text
people_intake.view
people_intake.create
people_intake.update
people_intake.submit
people_intake.review
```

The HTTP boundary and service layer both enforce the relevant permission.

## Public service operations

```text
createDraft
get
list
updateDraft
submit
review
```

## Security and privacy

- Every intake is bound to one Tenant and one Organization by a composite foreign key.
- List responses exclude the payload and therefore do not expose identifier values.
- Detail responses require `people_intake.view` and use `Cache-Control: no-store`.
- Mutations require trusted Organization context and CSRF protection through the shared HTTP boundary.
- No real client data may be committed as fixtures, examples, or seeds.

## Dependencies

- Tenants
- Organizations
- People
- Users
- Request Context
- HTTP Security
- Audit

## Events

No durable module events are published in version `0.1.0`. Event publication remains deferred until the shared transactional outbox capability is approved.

## Testing

Tests cover permissions, normalization, duplicate identifiers, parent cycles, schema ownership, migration state constraints, four-eye review, immutable submitted content, migration deployment, API input boundaries, type-checking, and production builds.

## Known limitations

- Approved intake application to canonical People Registry tables is not included.
- Evidence-file attachment is not included.
- Duplicate matching against existing canonical people is not included.
- Field-level reviewer comments are not included.
- The first UI is an internal operational dashboard, not a public self-service form.
''').lstrip())
