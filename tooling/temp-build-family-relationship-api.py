from pathlib import Path
import json
import textwrap


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip())


# Prisma model and migration
schema_path = Path('apps/api/prisma/schema.prisma')
schema = schema_path.read_text()
schema = replace_once(
    schema,
    '  verificationSource  String?   @map("verification_source") @db.VarChar(128)\n  sourceReference     String?   @map("source_reference") @db.VarChar(255)\n  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)',
    '  verificationSource           String?   @map("verification_source") @db.VarChar(128)\n  verificationRevokedAt        DateTime? @map("verification_revoked_at") @db.Timestamptz(6)\n  verificationRevokedByUserId  String?   @map("verification_revoked_by_user_id") @db.Uuid\n  verificationRevocationReason String?   @map("verification_revocation_reason") @db.VarChar(1000)\n  sourceReference              String?   @map("source_reference") @db.VarChar(255)\n  version                      Int       @default(1)\n  createdAt                    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)',
    'relationship governance fields',
)
schema = replace_once(
    schema,
    '  verifiedByUser CoreUser?  @relation("PersonRelationshipVerifiedBy", fields: [verifiedByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)\n\n  // Self-links',
    '  verifiedByUser               CoreUser? @relation("PersonRelationshipVerifiedBy", fields: [verifiedByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)\n  verificationRevokedByUser  CoreUser? @relation("PersonRelationshipVerificationRevokedBy", fields: [verificationRevokedByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)\n\n  // Self-links',
    'relationship revocation relation',
)
schema = replace_once(
    schema,
    '  @@index([verifiedByUserId])\n  @@map("core_person_relationships")',
    '  @@index([verifiedByUserId])\n  @@index([verificationRevokedByUserId])\n  @@map("core_person_relationships")',
    'relationship revocation index',
)
schema = replace_once(
    schema,
    '  personRelationshipsVerified CorePersonRelationship[]    @relation("PersonRelationshipVerifiedBy")\n  peopleIntakesCreated',
    '  personRelationshipsVerified            CorePersonRelationship[] @relation("PersonRelationshipVerifiedBy")\n  personRelationshipVerificationsRevoked CorePersonRelationship[] @relation("PersonRelationshipVerificationRevokedBy")\n  peopleIntakesCreated',
    'user relationship revocation collection',
)
schema_path.write_text(schema)

write(
    'apps/api/prisma/migrations/20260717010000_govern_person_relationship_operations/migration.sql',
    r'''
    ALTER TABLE "core_person_relationships"
      ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN "verification_revoked_at" TIMESTAMPTZ(6),
      ADD COLUMN "verification_revoked_by_user_id" UUID,
      ADD COLUMN "verification_revocation_reason" VARCHAR(1000);

    ALTER TABLE "core_person_relationships"
      DROP CONSTRAINT "core_person_relationships_verification_check";

    ALTER TABLE "core_person_relationships"
      ADD CONSTRAINT "core_person_relationships_version_check"
        CHECK ("version" > 0),
      ADD CONSTRAINT "core_person_relationships_verification_check"
        CHECK (
          (
            "is_verified" = true
            AND "verified_at" IS NOT NULL
            AND "verification_source" IS NOT NULL
            AND btrim("verification_source") <> ''
            AND "verification_revoked_at" IS NULL
            AND "verification_revoked_by_user_id" IS NULL
            AND "verification_revocation_reason" IS NULL
          )
          OR
          (
            "is_verified" = false
            AND "verified_at" IS NULL
            AND "verified_by_user_id" IS NULL
            AND "verification_source" IS NULL
            AND (
              (
                "verification_revoked_at" IS NULL
                AND "verification_revoked_by_user_id" IS NULL
                AND "verification_revocation_reason" IS NULL
              )
              OR
              (
                "verification_revoked_at" IS NOT NULL
                AND "verification_revoked_by_user_id" IS NOT NULL
                AND "verification_revocation_reason" IS NOT NULL
                AND btrim("verification_revocation_reason") <> ''
              )
            )
          )
        );

    ALTER TABLE "core_person_relationships"
      ADD CONSTRAINT "core_person_relationships_verification_revoked_by_user_id_fkey"
      FOREIGN KEY ("verification_revoked_by_user_id") REFERENCES "core_users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;

    CREATE INDEX "core_person_relationships_verification_revoked_by_user_id_idx"
      ON "core_person_relationships"("verification_revoked_by_user_id");
    ''',
)

# Reusable People module types and ports
write(
    'packages/people/src/types/person-relationship.ts',
    '''
    import type { PersonIdentifierRecord, PersonRecord } from './person';

    export type PersonRelationshipStatus = 'active' | 'ended';

    export interface PersonRelationshipRequestContext {
      readonly actorUserId: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly permissionCodes: ReadonlySet<string>;
    }

    export interface PersonRelationshipRecord {
      readonly id: string;
      readonly tenantId: string;
      readonly sourcePersonId: string;
      readonly targetPersonId: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
      readonly status: PersonRelationshipStatus;
      readonly validFrom: Date | null;
      readonly validUntil: Date | null;
      readonly isVerified: boolean;
      readonly verifiedAt: Date | null;
      readonly verifiedByUserId: string | null;
      readonly verificationSource: string | null;
      readonly verificationRevokedAt: Date | null;
      readonly verificationRevokedByUserId: string | null;
      readonly verificationRevocationReason: string | null;
      readonly sourceReference: string | null;
      readonly version: number;
      readonly createdAt: Date;
      readonly updatedAt: Date;
    }

    export interface PersonWithIdentifiersRecord {
      readonly person: PersonRecord;
      readonly identifiers: readonly PersonIdentifierRecord[];
    }

    export interface CreatePersonRelationshipInput {
      readonly sourcePersonId: string;
      readonly targetPersonId: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
      readonly validFrom?: Date | null;
      readonly validUntil?: Date | null;
      readonly sourceReference?: string | null;
    }

    export interface UpdatePersonRelationshipInput {
      readonly expectedVersion: number;
      readonly relationshipRole?: string;
      readonly relationshipBasis?: string;
      readonly validFrom?: Date | null;
      readonly validUntil?: Date | null;
      readonly sourceReference?: string | null;
    }

    export interface EndPersonRelationshipInput {
      readonly expectedVersion: number;
      readonly validUntil?: Date | null;
    }

    export interface VerifyPersonRelationshipInput {
      readonly expectedVersion: number;
      readonly verificationSource: string;
      readonly sourceReference?: string | null;
    }

    export interface RevokePersonRelationshipVerificationInput {
      readonly expectedVersion: number;
      readonly reason: string;
    }

    export interface FamilyTreeQuery {
      readonly depth?: number;
      readonly includeSensitive?: boolean;
    }

    export interface FamilyPersonIdentifierProjection {
      readonly id: string;
      readonly identifierType: string;
      readonly identifierValue: string | null;
      readonly maskedValue: string;
      readonly issuingAuthority: string | null;
      readonly issuingCountryCode: string | null;
      readonly isVerified: boolean;
    }

    export interface FamilyPersonNode {
      readonly id: string;
      readonly firstName: string;
      readonly middleName: string | null;
      readonly lastName: string;
      readonly preferredName: string | null;
      readonly status: string;
      readonly dateOfBirth: Date | null;
      readonly gender: string | null;
      readonly identifiers: readonly FamilyPersonIdentifierProjection[];
    }

    export interface FamilyTreeRelationship {
      readonly id: string;
      readonly sourcePersonId: string;
      readonly targetPersonId: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
      readonly status: PersonRelationshipStatus;
      readonly validFrom: Date | null;
      readonly validUntil: Date | null;
      readonly isVerified: boolean;
      readonly verificationSource: string | null;
      readonly sourceReference: string | null;
      readonly version: number;
      readonly updatedAt: Date;
    }

    export interface FamilyTreeGraph {
      readonly rootPersonId: string;
      readonly depth: number;
      readonly sensitiveFieldsIncluded: boolean;
      readonly truncated: boolean;
      readonly nodes: readonly FamilyPersonNode[];
      readonly relationships: readonly FamilyTreeRelationship[];
    }

    export interface CreatePersonRelationshipRecordInput {
      readonly tenantId: string;
      readonly sourcePersonId: string;
      readonly targetPersonId: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
      readonly validFrom: Date | null;
      readonly validUntil: Date | null;
      readonly sourceReference: string | null;
    }

    export interface UpdatePersonRelationshipRecordInput {
      readonly tenantId: string;
      readonly relationshipId: string;
      readonly expectedVersion: number;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
      readonly status: PersonRelationshipStatus;
      readonly validFrom: Date | null;
      readonly validUntil: Date | null;
      readonly isVerified: boolean;
      readonly verifiedAt: Date | null;
      readonly verifiedByUserId: string | null;
      readonly verificationSource: string | null;
      readonly verificationRevokedAt: Date | null;
      readonly verificationRevokedByUserId: string | null;
      readonly verificationRevocationReason: string | null;
      readonly sourceReference: string | null;
    }

    export type CreatePersonRelationshipResult =
      | { readonly status: 'created'; readonly relationship: PersonRelationshipRecord }
      | { readonly status: 'conflict' };

    export type UpdatePersonRelationshipResult =
      | { readonly status: 'updated'; readonly relationship: PersonRelationshipRecord }
      | { readonly status: 'not_found' }
      | { readonly status: 'conflict' };
    ''',
)

write(
    'packages/people/src/database/person-relationship-repository.ts',
    '''
    import type {
      CreatePersonRelationshipRecordInput,
      CreatePersonRelationshipResult,
      PersonRelationshipRecord,
      PersonWithIdentifiersRecord,
      UpdatePersonRelationshipRecordInput,
      UpdatePersonRelationshipResult,
    } from '../types/person-relationship';
    import type { PersonRecord } from '../types/person';

    export interface PersonRelationshipRepository {
      createRelationship(
        input: CreatePersonRelationshipRecordInput,
      ): Promise<CreatePersonRelationshipResult>;
      findPersonById(personId: string): Promise<PersonRecord | null>;
      findRelationshipById(
        tenantId: string,
        relationshipId: string,
      ): Promise<PersonRelationshipRecord | null>;
      hasActiveOrganizationMembership(
        tenantId: string,
        organizationId: string,
        personId: string,
        at: Date,
      ): Promise<boolean>;
      listConnectedRelationships(
        tenantId: string,
        personIds: readonly string[],
        at: Date,
      ): Promise<readonly PersonRelationshipRecord[]>;
      listPeopleWithIdentifiers(
        personIds: readonly string[],
      ): Promise<readonly PersonWithIdentifiersRecord[]>;
      updateRelationship(
        input: UpdatePersonRelationshipRecordInput,
      ): Promise<UpdatePersonRelationshipResult>;
    }
    ''',
)

write(
    'packages/people/src/events/person-relationship-event.ts',
    '''
    export type PersonRelationshipEventName =
      | 'person.relationship.created'
      | 'person.relationship.ended'
      | 'person.relationship.updated'
      | 'person.relationship.verification_revoked'
      | 'person.relationship.verified';

    export interface PersonRelationshipEvent {
      readonly name: PersonRelationshipEventName;
      readonly actorUserId: string;
      readonly tenantId: string;
      readonly relationshipId: string;
      readonly sourcePersonId: string;
      readonly targetPersonId: string;
      readonly version: number;
      readonly occurredAt: Date;
    }

    export interface PersonRelationshipEventPublisher {
      publish(event: PersonRelationshipEvent): Promise<void>;
    }
    ''',
)

write(
    'packages/people/src/services/person-relationship.service.ts',
    '''
    import type { PersonRelationshipRepository } from '../database/person-relationship-repository';
    import type { PersonRelationshipEventPublisher } from '../events/person-relationship-event';
    import { PeopleModuleError } from '../errors/people-module-error';
    import { PEOPLE_PERMISSIONS, type PeoplePermission } from '../permissions/people-permissions';
    import type {
      CreatePersonRelationshipInput,
      EndPersonRelationshipInput,
      FamilyPersonIdentifierProjection,
      FamilyPersonNode,
      FamilyTreeGraph,
      FamilyTreeQuery,
      FamilyTreeRelationship,
      PersonRelationshipRecord,
      PersonRelationshipRequestContext,
      RevokePersonRelationshipVerificationInput,
      UpdatePersonRelationshipInput,
      UpdatePersonRelationshipRecordInput,
      VerifyPersonRelationshipInput,
    } from '../types/person-relationship';

    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
    const CODE_PATTERN = /^[a-z0-9][a-z0-9._-]*$/u;
    const MAX_GRAPH_DEPTH = 4;
    const MAX_GRAPH_NODES = 250;

    export class PersonRelationshipService {
      constructor(
        private readonly repository: PersonRelationshipRepository,
        private readonly events: PersonRelationshipEventPublisher,
      ) {}

      async create(
        context: PersonRelationshipRequestContext,
        input: CreatePersonRelationshipInput,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsManage);
        const sourcePersonId = this.inputUuid(input.sourcePersonId, 'sourcePersonId');
        const targetPersonId = this.inputUuid(input.targetPersonId, 'targetPersonId');
        if (sourcePersonId === targetPersonId) {
          this.invalid('targetPersonId', 'A person relationship must connect two different people.');
        }
        await Promise.all([
          this.requireActivePerson(sourcePersonId),
          this.requireActivePerson(targetPersonId),
        ]);
        await this.requireRelationshipScope(trusted, sourcePersonId, targetPersonId);
        const validFrom = this.optionalDate(input.validFrom, 'validFrom');
        const validUntil = this.optionalDate(input.validUntil, 'validUntil');
        this.dateRange(validFrom, validUntil);
        const result = await this.repository.createRelationship({
          tenantId: trusted.tenantId,
          sourcePersonId,
          targetPersonId,
          relationshipType: this.code(input.relationshipType, 'relationshipType', 64),
          relationshipRole: this.code(input.relationshipRole, 'relationshipRole', 64),
          relationshipBasis: this.code(input.relationshipBasis, 'relationshipBasis', 64),
          validFrom,
          validUntil,
          sourceReference: this.nullableText(input.sourceReference, 'sourceReference', 255),
        });
        if (result.status === 'conflict') {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_CONFLICT',
            'The relationship conflicts with an existing relationship or family-tree rule.',
          );
        }
        await this.publish('person.relationship.created', trusted, result.relationship);
        return result.relationship;
      }

      async get(
        context: PersonRelationshipRequestContext,
        relationshipId: string,
        includeSensitive = false,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsView);
        this.requireSensitivePermission(trusted, includeSensitive);
        const relationship = await this.requireScopedRelationship(
          trusted,
          this.inputUuid(relationshipId, 'relationshipId'),
        );
        return includeSensitive ? relationship : { ...relationship, sourceReference: null };
      }

      async update(
        context: PersonRelationshipRequestContext,
        relationshipId: string,
        input: UpdatePersonRelationshipInput,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsManage);
        const current = await this.requireScopedRelationship(
          trusted,
          this.inputUuid(relationshipId, 'relationshipId'),
        );
        this.requireActiveRelationship(current);
        const expectedVersion = this.version(input.expectedVersion);
        const changed =
          input.relationshipRole !== undefined ||
          input.relationshipBasis !== undefined ||
          'validFrom' in input ||
          'validUntil' in input ||
          'sourceReference' in input;
        if (!changed) {
          this.invalid('body', 'At least one relationship field must be supplied for update.');
        }
        const validFrom =
          'validFrom' in input ? this.optionalDate(input.validFrom, 'validFrom') : current.validFrom;
        const validUntil =
          'validUntil' in input
            ? this.optionalDate(input.validUntil, 'validUntil')
            : current.validUntil;
        this.dateRange(validFrom, validUntil);
        const updated = await this.save({
          ...this.copy(current),
          tenantId: trusted.tenantId,
          relationshipId: current.id,
          expectedVersion,
          relationshipRole:
            input.relationshipRole === undefined
              ? current.relationshipRole
              : this.code(input.relationshipRole, 'relationshipRole', 64),
          relationshipBasis:
            input.relationshipBasis === undefined
              ? current.relationshipBasis
              : this.code(input.relationshipBasis, 'relationshipBasis', 64),
          validFrom,
          validUntil,
          sourceReference:
            'sourceReference' in input
              ? this.nullableText(input.sourceReference, 'sourceReference', 255)
              : current.sourceReference,
        });
        await this.publish('person.relationship.updated', trusted, updated);
        return updated;
      }

      async end(
        context: PersonRelationshipRequestContext,
        relationshipId: string,
        input: EndPersonRelationshipInput,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsManage);
        const current = await this.requireScopedRelationship(
          trusted,
          this.inputUuid(relationshipId, 'relationshipId'),
        );
        this.requireActiveRelationship(current);
        const validUntil =
          'validUntil' in input
            ? this.optionalDate(input.validUntil, 'validUntil')
            : this.today();
        if (validUntil === null) {
          this.invalid('validUntil', 'validUntil is required when ending a relationship.');
        }
        this.dateRange(current.validFrom, validUntil);
        const updated = await this.save({
          ...this.copy(current),
          tenantId: trusted.tenantId,
          relationshipId: current.id,
          expectedVersion: this.version(input.expectedVersion),
          status: 'ended',
          validUntil,
        });
        await this.publish('person.relationship.ended', trusted, updated);
        return updated;
      }

      async verify(
        context: PersonRelationshipRequestContext,
        relationshipId: string,
        input: VerifyPersonRelationshipInput,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsVerify);
        const current = await this.requireScopedRelationship(
          trusted,
          this.inputUuid(relationshipId, 'relationshipId'),
        );
        this.requireActiveRelationship(current);
        if (current.isVerified) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_STATE_CONFLICT',
            'The relationship is already verified.',
          );
        }
        const updated = await this.save({
          ...this.copy(current),
          tenantId: trusted.tenantId,
          relationshipId: current.id,
          expectedVersion: this.version(input.expectedVersion),
          isVerified: true,
          verifiedAt: new Date(),
          verifiedByUserId: trusted.actorUserId,
          verificationSource: this.text(
            input.verificationSource,
            'verificationSource',
            128,
          ),
          verificationRevokedAt: null,
          verificationRevokedByUserId: null,
          verificationRevocationReason: null,
          sourceReference:
            'sourceReference' in input
              ? this.nullableText(input.sourceReference, 'sourceReference', 255)
              : current.sourceReference,
        });
        await this.publish('person.relationship.verified', trusted, updated);
        return updated;
      }

      async revokeVerification(
        context: PersonRelationshipRequestContext,
        relationshipId: string,
        input: RevokePersonRelationshipVerificationInput,
      ): Promise<PersonRelationshipRecord> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsVerify);
        const current = await this.requireScopedRelationship(
          trusted,
          this.inputUuid(relationshipId, 'relationshipId'),
        );
        if (!current.isVerified) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_STATE_CONFLICT',
            'The relationship is not currently verified.',
          );
        }
        const updated = await this.save({
          ...this.copy(current),
          tenantId: trusted.tenantId,
          relationshipId: current.id,
          expectedVersion: this.version(input.expectedVersion),
          isVerified: false,
          verifiedAt: null,
          verifiedByUserId: null,
          verificationSource: null,
          verificationRevokedAt: new Date(),
          verificationRevokedByUserId: trusted.actorUserId,
          verificationRevocationReason: this.text(input.reason, 'reason', 1000),
        });
        await this.publish('person.relationship.verification_revoked', trusted, updated);
        return updated;
      }

      async familyTree(
        context: PersonRelationshipRequestContext,
        rootPersonId: string,
        query: FamilyTreeQuery = {},
      ): Promise<FamilyTreeGraph> {
        const trusted = this.requireContext(context, PEOPLE_PERMISSIONS.relationshipsView);
        const rootId = this.inputUuid(rootPersonId, 'rootPersonId');
        const includeSensitive = query.includeSensitive ?? false;
        this.requireSensitivePermission(trusted, includeSensitive);
        const depth = query.depth ?? 2;
        if (!Number.isInteger(depth) || depth < 1 || depth > MAX_GRAPH_DEPTH) {
          this.invalid('depth', `depth must be an integer between 1 and ${String(MAX_GRAPH_DEPTH)}.`);
        }
        await this.requireActivePerson(rootId);
        const rootReachable = await this.repository.hasActiveOrganizationMembership(
          trusted.tenantId,
          trusted.organizationId,
          rootId,
          new Date(),
        );
        if (!rootReachable) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_NOT_FOUND',
            'The requested family record is unavailable in this Organization.',
          );
        }

        const visited = new Set<string>([rootId]);
        let frontier = [rootId];
        const relationships = new Map<string, PersonRelationshipRecord>();
        let truncated = false;
        const now = new Date();
        for (let level = 0; level < depth && frontier.length > 0; level += 1) {
          const connected = await this.repository.listConnectedRelationships(
            trusted.tenantId,
            frontier,
            now,
          );
          const next = new Set<string>();
          for (const relationship of connected) {
            relationships.set(relationship.id, relationship);
            for (const personId of [relationship.sourcePersonId, relationship.targetPersonId]) {
              if (!visited.has(personId)) {
                if (visited.size >= MAX_GRAPH_NODES) {
                  truncated = true;
                  continue;
                }
                visited.add(personId);
                next.add(personId);
              }
            }
          }
          frontier = [...next];
        }

        const records = await this.repository.listPeopleWithIdentifiers([...visited]);
        const nodes = records.map((record) => this.node(record.person, record.identifiers, includeSensitive));
        const projectedRelationships = [...relationships.values()].map((relationship) =>
          this.relationship(relationship, includeSensitive),
        );
        return {
          rootPersonId: rootId,
          depth,
          sensitiveFieldsIncluded: includeSensitive,
          truncated,
          nodes,
          relationships: projectedRelationships,
        };
      }

      private copy(current: PersonRelationshipRecord): UpdatePersonRelationshipRecordInput {
        return {
          tenantId: current.tenantId,
          relationshipId: current.id,
          expectedVersion: current.version,
          relationshipRole: current.relationshipRole,
          relationshipBasis: current.relationshipBasis,
          status: current.status,
          validFrom: current.validFrom,
          validUntil: current.validUntil,
          isVerified: current.isVerified,
          verifiedAt: current.verifiedAt,
          verifiedByUserId: current.verifiedByUserId,
          verificationSource: current.verificationSource,
          verificationRevokedAt: current.verificationRevokedAt,
          verificationRevokedByUserId: current.verificationRevokedByUserId,
          verificationRevocationReason: current.verificationRevocationReason,
          sourceReference: current.sourceReference,
        };
      }

      private async save(
        input: UpdatePersonRelationshipRecordInput,
      ): Promise<PersonRelationshipRecord> {
        const result = await this.repository.updateRelationship(input);
        if (result.status === 'not_found') {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_NOT_FOUND',
            'The relationship does not exist.',
          );
        }
        if (result.status === 'conflict') {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_STATE_CONFLICT',
            'The relationship changed or the requested transition conflicts with its current state.',
          );
        }
        return result.relationship;
      }

      private async requireScopedRelationship(
        context: RequiredContext,
        relationshipId: string,
      ): Promise<PersonRelationshipRecord> {
        const relationship = await this.repository.findRelationshipById(
          context.tenantId,
          relationshipId,
        );
        if (relationship === null) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_NOT_FOUND',
            'The relationship does not exist.',
          );
        }
        await this.requireRelationshipScope(
          context,
          relationship.sourcePersonId,
          relationship.targetPersonId,
        );
        return relationship;
      }

      private async requireRelationshipScope(
        context: RequiredContext,
        sourcePersonId: string,
        targetPersonId: string,
      ): Promise<void> {
        const now = new Date();
        const [sourceReachable, targetReachable] = await Promise.all([
          this.repository.hasActiveOrganizationMembership(
            context.tenantId,
            context.organizationId,
            sourcePersonId,
            now,
          ),
          this.repository.hasActiveOrganizationMembership(
            context.tenantId,
            context.organizationId,
            targetPersonId,
            now,
          ),
        ]);
        if (!sourceReachable && !targetReachable) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_FORBIDDEN',
            'The relationship is outside the current Organization family boundary.',
          );
        }
      }

      private async requireActivePerson(personId: string): Promise<void> {
        const person = await this.repository.findPersonById(personId);
        if (person === null || person.deletedAt !== null || person.status !== 'active') {
          throw new PeopleModuleError('PERSON_NOT_FOUND', 'The person does not exist.', {
            personId,
          });
        }
      }

      private node(
        person: import('../types/person').PersonRecord,
        identifiers: readonly import('../types/person').PersonIdentifierRecord[],
        sensitive: boolean,
      ): FamilyPersonNode {
        return {
          id: person.id,
          firstName: person.firstName,
          middleName: person.middleName,
          lastName: person.lastName,
          preferredName: person.preferredName,
          status: person.status,
          dateOfBirth: sensitive ? person.dateOfBirth : null,
          gender: sensitive ? person.gender : null,
          identifiers: identifiers.map((identifier) => this.identifier(identifier, sensitive)),
        };
      }

      private identifier(
        identifier: import('../types/person').PersonIdentifierRecord,
        sensitive: boolean,
      ): FamilyPersonIdentifierProjection {
        return {
          id: identifier.id,
          identifierType: identifier.identifierType,
          identifierValue: sensitive ? identifier.identifierValue : null,
          maskedValue: this.mask(identifier.identifierValue),
          issuingAuthority: sensitive ? identifier.issuingAuthority : null,
          issuingCountryCode: identifier.issuingCountryCode,
          isVerified: identifier.isVerified,
        };
      }

      private relationship(
        relationship: PersonRelationshipRecord,
        sensitive: boolean,
      ): FamilyTreeRelationship {
        return {
          id: relationship.id,
          sourcePersonId: relationship.sourcePersonId,
          targetPersonId: relationship.targetPersonId,
          relationshipType: relationship.relationshipType,
          relationshipRole: relationship.relationshipRole,
          relationshipBasis: relationship.relationshipBasis,
          status: relationship.status,
          validFrom: relationship.validFrom,
          validUntil: relationship.validUntil,
          isVerified: relationship.isVerified,
          verificationSource: relationship.verificationSource,
          sourceReference: sensitive ? relationship.sourceReference : null,
          version: relationship.version,
          updatedAt: relationship.updatedAt,
        };
      }

      private mask(value: string): string {
        const visible = value.slice(-4);
        return `${'*'.repeat(Math.max(0, value.length - visible.length))}${visible}`;
      }

      private requireContext(
        context: PersonRelationshipRequestContext,
        permission: PeoplePermission,
      ): RequiredContext {
        const trusted = {
          actorUserId: this.trustedUuid(context.actorUserId, 'context.actorUserId'),
          tenantId: this.trustedUuid(context.tenantId, 'context.tenantId'),
          organizationId: this.trustedUuid(context.organizationId, 'context.organizationId'),
          permissionCodes: context.permissionCodes,
        };
        if (!trusted.permissionCodes.has(permission)) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_FORBIDDEN',
            `The operation requires the ${permission} permission.`,
            { permission },
          );
        }
        return trusted;
      }

      private requireSensitivePermission(context: RequiredContext, requested: boolean): void {
        if (requested && !context.permissionCodes.has(PEOPLE_PERMISSIONS.familySensitiveView)) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_FORBIDDEN',
            `The operation requires the ${PEOPLE_PERMISSIONS.familySensitiveView} permission.`,
            { permission: PEOPLE_PERMISSIONS.familySensitiveView },
          );
        }
      }

      private requireActiveRelationship(relationship: PersonRelationshipRecord): void {
        if (relationship.status !== 'active') {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_STATE_CONFLICT',
            'Only active relationships may be changed by this operation.',
          );
        }
      }

      private version(value: number): number {
        if (!Number.isInteger(value) || value < 1) {
          this.invalid('expectedVersion', 'expectedVersion must be a positive integer.');
        }
        return value;
      }

      private inputUuid(value: string, field: string): string {
        if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
          this.invalid(field, `${field} must be a UUID.`);
        }
        return value.toLowerCase();
      }

      private trustedUuid(value: unknown, field: string): string {
        if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
          throw new PeopleModuleError(
            'PERSON_RELATIONSHIP_INTEGRITY_FAILURE',
            `${field} must be a UUID.`,
          );
        }
        return value.toLowerCase();
      }

      private code(value: string, field: string, maximum: number): string {
        const normalized = this.text(value, field, maximum).toLowerCase();
        if (!CODE_PATTERN.test(normalized)) {
          this.invalid(field, `${field} must be a machine-readable code.`);
        }
        return normalized;
      }

      private text(value: string, field: string, maximum: number): string {
        if (typeof value !== 'string') {
          this.invalid(field, `${field} must be text.`);
        }
        const normalized = value.trim();
        if (normalized.length < 1 || normalized.length > maximum) {
          this.invalid(
            field,
            `${field} must contain between 1 and ${String(maximum)} characters.`,
          );
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

      private optionalDate(value: Date | null | undefined, field: string): Date | null {
        if (value === null || value === undefined) {
          return null;
        }
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
          this.invalid(field, `${field} must be a valid date.`);
        }
        return new Date(value.getTime());
      }

      private dateRange(validFrom: Date | null, validUntil: Date | null): void {
        if (validFrom !== null && validUntil !== null && validUntil < validFrom) {
          this.invalid('validUntil', 'validUntil cannot be earlier than validFrom.');
        }
      }

      private today(): Date {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      }

      private async publish(
        name: import('../events/person-relationship-event').PersonRelationshipEventName,
        context: RequiredContext,
        relationship: PersonRelationshipRecord,
      ): Promise<void> {
        await this.events.publish({
          name,
          actorUserId: context.actorUserId,
          tenantId: context.tenantId,
          relationshipId: relationship.id,
          sourcePersonId: relationship.sourcePersonId,
          targetPersonId: relationship.targetPersonId,
          version: relationship.version,
          occurredAt: new Date(),
        });
      }

      private invalid(field: string, message: string): never {
        throw new PeopleModuleError('PERSON_RELATIONSHIP_INVALID_INPUT', message, { field });
      }
    }

    interface RequiredContext {
      readonly actorUserId: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly permissionCodes: ReadonlySet<string>;
    }
    ''',
)

# Package exports, permissions, and errors
permissions_path = Path('packages/people/src/permissions/people-permissions.ts')
permissions = permissions_path.read_text()
permissions = replace_once(
    permissions,
    "  identifiersView: 'people.identifiers.view',\n  update: 'people.update',",
    "  identifiersView: 'people.identifiers.view',\n  relationshipsView: 'people.relationships.view',\n  relationshipsManage: 'people.relationships.manage',\n  relationshipsVerify: 'people.relationships.verify',\n  familySensitiveView: 'people.family_sensitive.view',\n  update: 'people.update',",
    'people relationship permissions',
)
permissions_path.write_text(permissions)

error_path = Path('packages/people/src/errors/people-module-error.ts')
error = error_path.read_text()
error = replace_once(
    error,
    "  | 'PERSON_NOT_FOUND';",
    "  | 'PERSON_NOT_FOUND'\n  | 'PERSON_RELATIONSHIP_CONFLICT'\n  | 'PERSON_RELATIONSHIP_FORBIDDEN'\n  | 'PERSON_RELATIONSHIP_INTEGRITY_FAILURE'\n  | 'PERSON_RELATIONSHIP_INVALID_INPUT'\n  | 'PERSON_RELATIONSHIP_NOT_FOUND'\n  | 'PERSON_RELATIONSHIP_STATE_CONFLICT';",
    'relationship error codes',
)
error_path.write_text(error)

index_path = Path('packages/people/src/index.ts')
index = index_path.read_text()
index = "export type { PersonRelationshipRepository } from './database/person-relationship-repository';\n" + index
index += textwrap.dedent(
    '''
    export type {
      PersonRelationshipEvent,
      PersonRelationshipEventName,
      PersonRelationshipEventPublisher,
    } from './events/person-relationship-event';
    export { PersonRelationshipService } from './services/person-relationship.service';
    export type {
      CreatePersonRelationshipInput,
      CreatePersonRelationshipRecordInput,
      CreatePersonRelationshipResult,
      EndPersonRelationshipInput,
      FamilyPersonIdentifierProjection,
      FamilyPersonNode,
      FamilyTreeGraph,
      FamilyTreeQuery,
      FamilyTreeRelationship,
      PersonRelationshipRecord,
      PersonRelationshipRequestContext,
      PersonRelationshipStatus,
      PersonWithIdentifiersRecord,
      RevokePersonRelationshipVerificationInput,
      UpdatePersonRelationshipInput,
      UpdatePersonRelationshipRecordInput,
      UpdatePersonRelationshipResult,
      VerifyPersonRelationshipInput,
    } from './types/person-relationship';
    '''
)
index_path.write_text(index)

# API repository adapter
write(
    'apps/api/src/people/prisma-person-relationship.repository.ts',
    '''
    import { Inject, Injectable } from '@nestjs/common';
    import type {
      CreatePersonRelationshipRecordInput,
      CreatePersonRelationshipResult,
      PersonIdentifierRecord,
      PersonRecord,
      PersonRelationshipRecord,
      PersonRelationshipRepository,
      PersonRelationshipStatus,
      PersonWithIdentifiersRecord,
      UpdatePersonRelationshipRecordInput,
      UpdatePersonRelationshipResult,
    } from '@newax/people';

    import type { Prisma } from '../generated/prisma/client';
    import { PrismaService } from '../database/prisma.service';

    @Injectable()
    export class PrismaPersonRelationshipRepository implements PersonRelationshipRepository {
      constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

      async createRelationship(
        input: CreatePersonRelationshipRecordInput,
      ): Promise<CreatePersonRelationshipResult> {
        try {
          const relationship = await this.prisma.corePersonRelationship.create({
            data: {
              tenantId: input.tenantId,
              sourcePersonId: input.sourcePersonId,
              targetPersonId: input.targetPersonId,
              relationshipType: input.relationshipType,
              relationshipRole: input.relationshipRole,
              relationshipBasis: input.relationshipBasis,
              validFrom: input.validFrom,
              validUntil: input.validUntil,
              sourceReference: input.sourceReference,
            },
          });
          return { status: 'created', relationship: this.mapRelationship(relationship) };
        } catch (error: unknown) {
          if (this.isRelationshipConflict(error)) {
            return { status: 'conflict' };
          }
          throw error;
        }
      }

      async findPersonById(personId: string): Promise<PersonRecord | null> {
        const person = await this.prisma.corePerson.findUnique({ where: { id: personId } });
        return person === null ? null : this.mapPerson(person);
      }

      async findRelationshipById(
        tenantId: string,
        relationshipId: string,
      ): Promise<PersonRelationshipRecord | null> {
        const relationship = await this.prisma.corePersonRelationship.findFirst({
          where: { id: relationshipId, tenantId },
        });
        return relationship === null ? null : this.mapRelationship(relationship);
      }

      async hasActiveOrganizationMembership(
        tenantId: string,
        organizationId: string,
        personId: string,
        at: Date,
      ): Promise<boolean> {
        const membership = await this.prisma.coreMembership.findFirst({
          where: {
            personId,
            organizationId,
            status: 'active',
            person: { status: 'active', deletedAt: null },
            organization: { tenantId, status: 'active', deletedAt: null },
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: at } }] },
              { OR: [{ endDate: null }, { endDate: { gte: at } }] },
            ],
          },
          select: { id: true },
        });
        return membership !== null;
      }

      async listConnectedRelationships(
        tenantId: string,
        personIds: readonly string[],
        at: Date,
      ): Promise<readonly PersonRelationshipRecord[]> {
        if (personIds.length === 0) {
          return [];
        }
        const relationships = await this.prisma.corePersonRelationship.findMany({
          where: {
            tenantId,
            status: 'active',
            AND: [
              { OR: [{ validFrom: null }, { validFrom: { lte: at } }] },
              { OR: [{ validUntil: null }, { validUntil: { gte: at } }] },
            ],
            OR: [
              { sourcePersonId: { in: [...personIds] } },
              { targetPersonId: { in: [...personIds] } },
            ],
          },
          orderBy: { id: 'asc' },
          take: 1000,
        });
        return relationships.map((relationship) => this.mapRelationship(relationship));
      }

      async listPeopleWithIdentifiers(
        personIds: readonly string[],
      ): Promise<readonly PersonWithIdentifiersRecord[]> {
        if (personIds.length === 0) {
          return [];
        }
        const people = await this.prisma.corePerson.findMany({
          where: { id: { in: [...personIds] } },
          include: { identifiers: { orderBy: [{ identifierType: 'asc' }, { createdAt: 'asc' }] } },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
        });
        return people.map((person) => ({
          person: this.mapPerson(person),
          identifiers: person.identifiers.map((identifier) => this.mapIdentifier(identifier)),
        }));
      }

      async updateRelationship(
        input: UpdatePersonRelationshipRecordInput,
      ): Promise<UpdatePersonRelationshipResult> {
        try {
          return await this.prisma.$transaction(async (transaction) => {
            const update = await transaction.corePersonRelationship.updateMany({
              where: {
                id: input.relationshipId,
                tenantId: input.tenantId,
                version: input.expectedVersion,
              },
              data: {
                relationshipRole: input.relationshipRole,
                relationshipBasis: input.relationshipBasis,
                status: input.status,
                validFrom: input.validFrom,
                validUntil: input.validUntil,
                isVerified: input.isVerified,
                verifiedAt: input.verifiedAt,
                verifiedByUserId: input.verifiedByUserId,
                verificationSource: input.verificationSource,
                verificationRevokedAt: input.verificationRevokedAt,
                verificationRevokedByUserId: input.verificationRevokedByUserId,
                verificationRevocationReason: input.verificationRevocationReason,
                sourceReference: input.sourceReference,
                version: { increment: 1 },
              },
            });
            if (update.count === 0) {
              const existing = await transaction.corePersonRelationship.findUnique({
                where: { id: input.relationshipId },
                select: { tenantId: true },
              });
              return existing === null || existing.tenantId !== input.tenantId
                ? { status: 'not_found' as const }
                : { status: 'conflict' as const };
            }
            const relationship = await transaction.corePersonRelationship.findUniqueOrThrow({
              where: { id: input.relationshipId },
            });
            return { status: 'updated' as const, relationship: this.mapRelationship(relationship) };
          });
        } catch (error: unknown) {
          if (this.isRelationshipConflict(error)) {
            return { status: 'conflict' };
          }
          throw error;
        }
      }

      private mapPerson(record: {
        readonly id: string;
        readonly firstName: string;
        readonly middleName: string | null;
        readonly lastName: string;
        readonly preferredName: string | null;
        readonly dateOfBirth: Date | null;
        readonly gender: string | null;
        readonly status: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly deletedAt: Date | null;
      }): PersonRecord {
        const status = record.status;
        if (status !== 'active' && status !== 'suspended' && status !== 'archived') {
          throw new Error(`Unsupported person status: ${status}`);
        }
        return { ...record, status };
      }

      private mapIdentifier(record: {
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
      }): PersonIdentifierRecord {
        return { ...record };
      }

      private mapRelationship(record: {
        readonly id: string;
        readonly tenantId: string;
        readonly sourcePersonId: string;
        readonly targetPersonId: string;
        readonly relationshipType: string;
        readonly relationshipRole: string;
        readonly relationshipBasis: string;
        readonly status: string;
        readonly validFrom: Date | null;
        readonly validUntil: Date | null;
        readonly isVerified: boolean;
        readonly verifiedAt: Date | null;
        readonly verifiedByUserId: string | null;
        readonly verificationSource: string | null;
        readonly verificationRevokedAt: Date | null;
        readonly verificationRevokedByUserId: string | null;
        readonly verificationRevocationReason: string | null;
        readonly sourceReference: string | null;
        readonly version: number;
        readonly createdAt: Date;
        readonly updatedAt: Date;
      }): PersonRelationshipRecord {
        return { ...record, status: this.relationshipStatus(record.status) };
      }

      private relationshipStatus(status: string): PersonRelationshipStatus {
        if (status === 'active' || status === 'ended') {
          return status;
        }
        throw new Error(`Unsupported person relationship status: ${status}`);
      }

      private isRelationshipConflict(error: unknown): boolean {
        if (typeof error !== 'object' || error === null) {
          return false;
        }
        const coded = error as { readonly code?: unknown; readonly meta?: unknown };
        if (coded.code === 'P2002') {
          return true;
        }
        if (typeof coded.meta === 'object' && coded.meta !== null && 'code' in coded.meta) {
          const databaseCode = (coded.meta as { readonly code?: unknown }).code;
          return databaseCode === '23505' || databaseCode === '23514';
        }
        return coded.code === '23505' || coded.code === '23514';
      }
    }
    ''',
)

write(
    'apps/api/src/people/logging-person-relationship-event.publisher.ts',
    '''
    import { Injectable, Logger } from '@nestjs/common';
    import type {
      PersonRelationshipEvent,
      PersonRelationshipEventPublisher,
    } from '@newax/people';

    @Injectable()
    export class LoggingPersonRelationshipEventPublisher
      implements PersonRelationshipEventPublisher
    {
      private readonly logger = new Logger(LoggingPersonRelationshipEventPublisher.name);

      async publish(event: PersonRelationshipEvent): Promise<void> {
        this.logger.log({
          event: event.name,
          actorUserId: event.actorUserId,
          tenantId: event.tenantId,
          relationshipId: event.relationshipId,
          sourcePersonId: event.sourcePersonId,
          targetPersonId: event.targetPersonId,
          version: event.version,
          occurredAt: event.occurredAt.toISOString(),
        });
      }
    }
    ''',
)

# HTTP input parsing and controller
write(
    'apps/api/src/people/current-organization-family-relationships.input.ts',
    '''
    import type {
      CreatePersonRelationshipInput,
      EndPersonRelationshipInput,
      FamilyTreeQuery,
      RevokePersonRelationshipVerificationInput,
      UpdatePersonRelationshipInput,
      VerifyPersonRelationshipInput,
    } from '@newax/people';
    import { HttpSecurityError } from '@newax/http-security';

    type ObjectValue = Record<string, unknown>;

    export function parseFamilyTreeQuery(query: unknown): FamilyTreeQuery {
      const object = objectValue(query, 'query');
      allowed(object, ['depth', 'include_sensitive'], 'query');
      const result: { depth?: number; includeSensitive?: boolean } = {};
      if (object.depth !== undefined) {
        const depth = Number(stringValue(object.depth, 'depth'));
        if (!Number.isInteger(depth)) {
          invalid('depth must be an integer.');
        }
        result.depth = depth;
      }
      if (object.include_sensitive !== undefined) {
        result.includeSensitive = booleanQuery(object.include_sensitive, 'include_sensitive');
      }
      return result;
    }

    export function parseRelationshipViewQuery(query: unknown): boolean {
      const object = objectValue(query, 'query');
      allowed(object, ['include_sensitive'], 'query');
      return object.include_sensitive === undefined
        ? false
        : booleanQuery(object.include_sensitive, 'include_sensitive');
    }

    export function parseCreateRelationshipBody(body: unknown): CreatePersonRelationshipInput {
      const object = objectValue(body, 'body');
      allowed(
        object,
        [
          'source_person_id',
          'target_person_id',
          'relationship_type',
          'relationship_role',
          'relationship_basis',
          'valid_from',
          'valid_until',
          'source_reference',
        ],
        'body',
      );
      const result: {
        sourcePersonId: string;
        targetPersonId: string;
        relationshipType: string;
        relationshipRole: string;
        relationshipBasis: string;
        validFrom?: Date | null;
        validUntil?: Date | null;
        sourceReference?: string | null;
      } = {
        sourcePersonId: stringValue(object.source_person_id, 'source_person_id'),
        targetPersonId: stringValue(object.target_person_id, 'target_person_id'),
        relationshipType: stringValue(object.relationship_type, 'relationship_type'),
        relationshipRole: stringValue(object.relationship_role, 'relationship_role'),
        relationshipBasis: stringValue(object.relationship_basis, 'relationship_basis'),
      };
      if ('valid_from' in object) {
        result.validFrom = nullableDate(object.valid_from, 'valid_from');
      }
      if ('valid_until' in object) {
        result.validUntil = nullableDate(object.valid_until, 'valid_until');
      }
      if ('source_reference' in object) {
        result.sourceReference = nullableString(object.source_reference, 'source_reference');
      }
      return result;
    }

    export function parseUpdateRelationshipBody(body: unknown): UpdatePersonRelationshipInput {
      const object = objectValue(body, 'body');
      allowed(
        object,
        [
          'expected_version',
          'relationship_role',
          'relationship_basis',
          'valid_from',
          'valid_until',
          'source_reference',
        ],
        'body',
      );
      const result: {
        expectedVersion: number;
        relationshipRole?: string;
        relationshipBasis?: string;
        validFrom?: Date | null;
        validUntil?: Date | null;
        sourceReference?: string | null;
      } = { expectedVersion: integerValue(object.expected_version, 'expected_version') };
      if ('relationship_role' in object) {
        result.relationshipRole = stringValue(object.relationship_role, 'relationship_role');
      }
      if ('relationship_basis' in object) {
        result.relationshipBasis = stringValue(object.relationship_basis, 'relationship_basis');
      }
      if ('valid_from' in object) {
        result.validFrom = nullableDate(object.valid_from, 'valid_from');
      }
      if ('valid_until' in object) {
        result.validUntil = nullableDate(object.valid_until, 'valid_until');
      }
      if ('source_reference' in object) {
        result.sourceReference = nullableString(object.source_reference, 'source_reference');
      }
      return result;
    }

    export function parseEndRelationshipBody(body: unknown): EndPersonRelationshipInput {
      const object = objectValue(body, 'body');
      allowed(object, ['expected_version', 'valid_until'], 'body');
      const result: { expectedVersion: number; validUntil?: Date | null } = {
        expectedVersion: integerValue(object.expected_version, 'expected_version'),
      };
      if ('valid_until' in object) {
        result.validUntil = nullableDate(object.valid_until, 'valid_until');
      }
      return result;
    }

    export function parseVerifyRelationshipBody(body: unknown): VerifyPersonRelationshipInput {
      const object = objectValue(body, 'body');
      allowed(object, ['expected_version', 'verification_source', 'source_reference'], 'body');
      const result: {
        expectedVersion: number;
        verificationSource: string;
        sourceReference?: string | null;
      } = {
        expectedVersion: integerValue(object.expected_version, 'expected_version'),
        verificationSource: stringValue(object.verification_source, 'verification_source'),
      };
      if ('source_reference' in object) {
        result.sourceReference = nullableString(object.source_reference, 'source_reference');
      }
      return result;
    }

    export function parseRevokeVerificationBody(
      body: unknown,
    ): RevokePersonRelationshipVerificationInput {
      const object = objectValue(body, 'body');
      allowed(object, ['expected_version', 'reason'], 'body');
      return {
        expectedVersion: integerValue(object.expected_version, 'expected_version'),
        reason: stringValue(object.reason, 'reason'),
      };
    }

    function objectValue(value: unknown, field: string): ObjectValue {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        invalid(`${field} must be an object.`);
      }
      return value as ObjectValue;
    }

    function allowed(object: ObjectValue, keys: readonly string[], field: string): void {
      const accepted = new Set(keys);
      for (const key of Object.keys(object)) {
        if (!accepted.has(key)) {
          invalid(`${field} contains unsupported field ${key}.`);
        }
      }
    }

    function stringValue(value: unknown, field: string): string {
      if (typeof value !== 'string') {
        invalid(`${field} must be text.`);
      }
      return value;
    }

    function nullableString(value: unknown, field: string): string | null {
      return value === null ? null : stringValue(value, field);
    }

    function integerValue(value: unknown, field: string): number {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        invalid(`${field} must be an integer.`);
      }
      return value;
    }

    function nullableDate(value: unknown, field: string): Date | null {
      if (value === null) {
        return null;
      }
      const text = stringValue(value, field);
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(text)) {
        invalid(`${field} must use YYYY-MM-DD.`);
      }
      const date = new Date(`${text}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
        invalid(`${field} must be a real calendar date.`);
      }
      return date;
    }

    function booleanQuery(value: unknown, field: string): boolean {
      const text = stringValue(value, field);
      if (text === 'true') {
        return true;
      }
      if (text === 'false') {
        return false;
      }
      invalid(`${field} must be true or false.`);
    }

    function invalid(message: string): never {
      throw new HttpSecurityError('HTTP_SECURITY_INVALID_INPUT', message, 400);
    }
    ''',
)

write(
    'apps/api/src/people/current-organization-family-relationships.controller.ts',
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
      PEOPLE_PERMISSIONS,
      PersonRelationshipService,
      type FamilyTreeGraph,
      type PersonRelationshipRecord,
    } from '@newax/people';
    import { HttpSecurityError } from '@newax/http-security';
    import { ContextAuthorizer, type TrustedOrganizationRequestContext } from '@newax/request-context';

    import {
      OrganizationContextEndpoint,
      RequirePermissions,
    } from '../http-security/http-security.decorators';
    import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';
    import {
      parseCreateRelationshipBody,
      parseEndRelationshipBody,
      parseFamilyTreeQuery,
      parseRelationshipViewQuery,
      parseRevokeVerificationBody,
      parseUpdateRelationshipBody,
      parseVerifyRelationshipBody,
    } from './current-organization-family-relationships.input';

    @Controller('core/organizations/current')
    export class CurrentOrganizationFamilyRelationshipsController {
      constructor(
        @Inject(PersonRelationshipService)
        private readonly relationships: PersonRelationshipService,
        @Inject(ContextAuthorizer) private readonly authorizer: ContextAuthorizer,
      ) {}

      @Get('family-tree/:personId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsView)
      async familyTree(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('personId') personId: string,
        @Query() query: unknown,
      ) {
        return {
          success: true as const,
          data: this.graph(
            await this.relationships.familyTree(
              this.context(request),
              personId,
              parseFamilyTreeQuery(query),
            ),
          ),
        };
      }

      @Get('person-relationships/:relationshipId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsView)
      async get(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('relationshipId') relationshipId: string,
        @Query() query: unknown,
      ) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.get(
              this.context(request),
              relationshipId,
              parseRelationshipViewQuery(query),
            ),
          ),
        };
      }

      @Post('person-relationships')
      @HttpCode(201)
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsManage)
      async create(@Req() request: HttpSecurityRequestAdapter, @Body() body: unknown) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.create(
              this.context(request),
              parseCreateRelationshipBody(body),
            ),
          ),
        };
      }

      @Put('person-relationships/:relationshipId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsManage)
      async update(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('relationshipId') relationshipId: string,
        @Body() body: unknown,
      ) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.update(
              this.context(request),
              relationshipId,
              parseUpdateRelationshipBody(body),
            ),
          ),
        };
      }

      @Post('person-relationships/:relationshipId/end')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsManage)
      async end(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('relationshipId') relationshipId: string,
        @Body() body: unknown,
      ) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.end(
              this.context(request),
              relationshipId,
              parseEndRelationshipBody(body),
            ),
          ),
        };
      }

      @Post('person-relationships/:relationshipId/verify')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsVerify)
      async verify(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('relationshipId') relationshipId: string,
        @Body() body: unknown,
      ) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.verify(
              this.context(request),
              relationshipId,
              parseVerifyRelationshipBody(body),
            ),
          ),
        };
      }

      @Post('person-relationships/:relationshipId/verification/revoke')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_PERMISSIONS.relationshipsVerify)
      async revokeVerification(
        @Req() request: HttpSecurityRequestAdapter,
        @Param('relationshipId') relationshipId: string,
        @Body() body: unknown,
      ) {
        return {
          success: true as const,
          data: this.relationship(
            await this.relationships.revokeVerification(
              this.context(request),
              relationshipId,
              parseRevokeVerificationBody(body),
            ),
          ),
        };
      }

      private context(request: HttpSecurityRequestAdapter) {
        const trusted = this.organizationContext(request);
        return this.authorizer.toModuleContext(trusted);
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

      private relationship(item: PersonRelationshipRecord) {
        return {
          id: item.id,
          tenant_id: item.tenantId,
          source_person_id: item.sourcePersonId,
          target_person_id: item.targetPersonId,
          relationship_type: item.relationshipType,
          relationship_role: item.relationshipRole,
          relationship_basis: item.relationshipBasis,
          status: item.status,
          valid_from: this.date(item.validFrom),
          valid_until: this.date(item.validUntil),
          is_verified: item.isVerified,
          verified_at: item.verifiedAt?.toISOString() ?? null,
          verified_by_user_id: item.verifiedByUserId,
          verification_source: item.verificationSource,
          verification_revoked_at: item.verificationRevokedAt?.toISOString() ?? null,
          verification_revoked_by_user_id: item.verificationRevokedByUserId,
          verification_revocation_reason: item.verificationRevocationReason,
          source_reference: item.sourceReference,
          version: item.version,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString(),
        };
      }

      private graph(item: FamilyTreeGraph) {
        return {
          root_person_id: item.rootPersonId,
          depth: item.depth,
          sensitive_fields_included: item.sensitiveFieldsIncluded,
          truncated: item.truncated,
          nodes: item.nodes.map((node) => ({
            id: node.id,
            first_name: node.firstName,
            middle_name: node.middleName,
            last_name: node.lastName,
            preferred_name: node.preferredName,
            status: node.status,
            date_of_birth: this.date(node.dateOfBirth),
            gender: node.gender,
            identifiers: node.identifiers.map((identifier) => ({
              id: identifier.id,
              identifier_type: identifier.identifierType,
              identifier_value: identifier.identifierValue,
              masked_value: identifier.maskedValue,
              issuing_authority: identifier.issuingAuthority,
              issuing_country_code: identifier.issuingCountryCode,
              is_verified: identifier.isVerified,
            })),
          })),
          relationships: item.relationships.map((relationship) => ({
            id: relationship.id,
            source_person_id: relationship.sourcePersonId,
            target_person_id: relationship.targetPersonId,
            relationship_type: relationship.relationshipType,
            relationship_role: relationship.relationshipRole,
            relationship_basis: relationship.relationshipBasis,
            status: relationship.status,
            valid_from: this.date(relationship.validFrom),
            valid_until: this.date(relationship.validUntil),
            is_verified: relationship.isVerified,
            verification_source: relationship.verificationSource,
            source_reference: relationship.sourceReference,
            version: relationship.version,
            updated_at: relationship.updatedAt.toISOString(),
          })),
        };
      }

      private date(value: Date | null): string | null {
        return value?.toISOString().slice(0, 10) ?? null;
      }
    }
    ''',
)

# Compose Nest module
module_path = Path('apps/api/src/people/people.module.ts')
module = module_path.read_text()
module = module.replace(
    "import { PeopleService } from '@newax/people';",
    "import { PeopleService, PersonRelationshipService } from '@newax/people';",
)
module = replace_once(
    module,
    "import { CurrentPersonController } from './current-person.controller';",
    "import { CurrentOrganizationFamilyRelationshipsController } from './current-organization-family-relationships.controller';\nimport { CurrentPersonController } from './current-person.controller';",
    'family controller import',
)
module = replace_once(
    module,
    "import { LoggingPersonEventPublisher } from './logging-person-event.publisher';",
    "import { LoggingPersonEventPublisher } from './logging-person-event.publisher';\nimport { LoggingPersonRelationshipEventPublisher } from './logging-person-relationship-event.publisher';",
    'relationship event publisher import',
)
module = replace_once(
    module,
    "import { PrismaPeopleRepository } from './prisma-people.repository';",
    "import { PrismaPeopleRepository } from './prisma-people.repository';\nimport { PrismaPersonRelationshipRepository } from './prisma-person-relationship.repository';",
    'relationship repository import',
)
module = replace_once(
    module,
    "  controllers: [CurrentPersonController],",
    "  controllers: [CurrentPersonController, CurrentOrganizationFamilyRelationshipsController],",
    'family controller composition',
)
module = replace_once(
    module,
    "    LoggingPersonEventPublisher,",
    "    LoggingPersonEventPublisher,\n    PrismaPersonRelationshipRepository,\n    LoggingPersonRelationshipEventPublisher,",
    'relationship providers',
)
module = replace_once(
    module,
    "    {\n      provide: PeopleService,",
    "    {\n      provide: PersonRelationshipService,\n      inject: [PrismaPersonRelationshipRepository, LoggingPersonRelationshipEventPublisher],\n      useFactory: (\n        repository: PrismaPersonRelationshipRepository,\n        eventPublisher: LoggingPersonRelationshipEventPublisher,\n      ): PersonRelationshipService => new PersonRelationshipService(repository, eventPublisher),\n    },\n    {\n      provide: PeopleService,",
    'relationship service factory',
)
module = replace_once(
    module,
    "  exports: [PeopleService],",
    "  exports: [PeopleService, PersonRelationshipService],",
    'relationship service export',
)
module_path.write_text(module)

# Focused unit tests
write(
    'packages/people/src/services/person-relationship.service.spec.ts',
    '''
    import { describe, expect, it } from 'vitest';

    import type { PersonRelationshipRepository } from '../database/person-relationship-repository';
    import type { PersonRelationshipEventPublisher } from '../events/person-relationship-event';
    import { PEOPLE_PERMISSIONS } from '../permissions/people-permissions';
    import type {
      PersonRelationshipRecord,
      PersonRelationshipRequestContext,
      UpdatePersonRelationshipRecordInput,
    } from '../types/person-relationship';
    import type { PersonRecord } from '../types/person';
    import { PersonRelationshipService } from './person-relationship.service';

    const actorUserId = '11111111-1111-4111-8111-111111111111';
    const tenantId = '22222222-2222-4222-8222-222222222222';
    const organizationId = '33333333-3333-4333-8333-333333333333';
    const parentId = '44444444-4444-4444-8444-444444444444';
    const childId = '55555555-5555-4555-8555-555555555555';
    const relationshipId = '66666666-6666-4666-8666-666666666666';

    function context(...permissions: string[]): PersonRelationshipRequestContext {
      return { actorUserId, tenantId, organizationId, permissionCodes: new Set(permissions) };
    }

    function person(id: string, firstName: string): PersonRecord {
      const now = new Date('2026-07-16T00:00:00.000Z');
      return {
        id,
        firstName,
        middleName: null,
        lastName: 'Khan',
        preferredName: null,
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
        gender: 'unspecified',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
    }

    function relationship(overrides: Partial<PersonRelationshipRecord> = {}): PersonRelationshipRecord {
      const now = new Date('2026-07-16T00:00:00.000Z');
      return {
        id: relationshipId,
        tenantId,
        sourcePersonId: parentId,
        targetPersonId: childId,
        relationshipType: 'parent_of',
        relationshipRole: 'mother',
        relationshipBasis: 'biological',
        status: 'active',
        validFrom: null,
        validUntil: null,
        isVerified: false,
        verifiedAt: null,
        verifiedByUserId: null,
        verificationSource: null,
        verificationRevokedAt: null,
        verificationRevokedByUserId: null,
        verificationRevocationReason: null,
        sourceReference: 'certificate-42',
        version: 1,
        createdAt: now,
        updatedAt: now,
        ...overrides,
      };
    }

    function repository(options: { reachable?: boolean; updateConflict?: boolean } = {}) {
      let current = relationship();
      const people = new Map([
        [parentId, person(parentId, 'Amina')],
        [childId, person(childId, 'Sara')],
      ]);
      const implementation: PersonRelationshipRepository = {
        async createRelationship(input) {
          current = relationship({
            tenantId: input.tenantId,
            sourcePersonId: input.sourcePersonId,
            targetPersonId: input.targetPersonId,
            relationshipType: input.relationshipType,
            relationshipRole: input.relationshipRole,
            relationshipBasis: input.relationshipBasis,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            sourceReference: input.sourceReference,
          });
          return { status: 'created', relationship: current };
        },
        async findPersonById(id) {
          return people.get(id) ?? null;
        },
        async findRelationshipById(requestTenantId, id) {
          return requestTenantId === tenantId && id === relationshipId ? current : null;
        },
        async hasActiveOrganizationMembership(_tenant, _organization, id) {
          return options.reachable === false ? false : id === parentId;
        },
        async listConnectedRelationships() {
          return [current];
        },
        async listPeopleWithIdentifiers(ids) {
          return ids.flatMap((id) => {
            const found = people.get(id);
            return found === undefined
              ? []
              : [
                  {
                    person: found,
                    identifiers: [
                      {
                        id: `${id.slice(0, 32)}aaaa`,
                        personId: id,
                        identifierType: 'cnic',
                        identifierValue: '1234512345671',
                        issuingAuthority: 'NADRA',
                        issuingCountryCode: 'PK',
                        validFrom: null,
                        validUntil: null,
                        isVerified: true,
                        verifiedAt: new Date('2026-07-15T00:00:00.000Z'),
                        createdAt: new Date('2026-07-15T00:00:00.000Z'),
                        updatedAt: new Date('2026-07-15T00:00:00.000Z'),
                      },
                    ],
                  },
                ];
          });
        },
        async updateRelationship(input: UpdatePersonRelationshipRecordInput) {
          if (options.updateConflict === true || input.expectedVersion !== current.version) {
            return { status: 'conflict' };
          }
          current = relationship({
            ...input,
            id: current.id,
            sourcePersonId: current.sourcePersonId,
            targetPersonId: current.targetPersonId,
            relationshipType: current.relationshipType,
            version: current.version + 1,
            createdAt: current.createdAt,
            updatedAt: new Date('2026-07-16T01:00:00.000Z'),
          });
          return { status: 'updated', relationship: current };
        },
      };
      return implementation;
    }

    const events: PersonRelationshipEventPublisher = { async publish() {} };

    describe('PersonRelationshipService', () => {
      it('creates a governed relationship when one endpoint belongs to the Organization', async () => {
        const service = new PersonRelationshipService(repository(), events);
        const result = await service.create(context(PEOPLE_PERMISSIONS.relationshipsManage), {
          sourcePersonId: parentId,
          targetPersonId: childId,
          relationshipType: 'PARENT_OF',
          relationshipRole: 'MOTHER',
          relationshipBasis: 'BIOLOGICAL',
        });
        expect(result.relationshipType).toBe('parent_of');
        expect(result.relationshipRole).toBe('mother');
      });

      it('rejects relationships outside the current Organization boundary', async () => {
        const service = new PersonRelationshipService(repository({ reachable: false }), events);
        await expect(
          service.create(context(PEOPLE_PERMISSIONS.relationshipsManage), {
            sourcePersonId: parentId,
            targetPersonId: childId,
            relationshipType: 'parent_of',
            relationshipRole: 'mother',
            relationshipBasis: 'biological',
          }),
        ).rejects.toMatchObject({ code: 'PERSON_RELATIONSHIP_FORBIDDEN' });
      });

      it('redacts sensitive family fields by default', async () => {
        const service = new PersonRelationshipService(repository(), events);
        const graph = await service.familyTree(
          context(PEOPLE_PERMISSIONS.relationshipsView),
          parentId,
        );
        expect(graph.sensitiveFieldsIncluded).toBe(false);
        expect(graph.nodes[0]?.dateOfBirth).toBeNull();
        expect(graph.nodes[0]?.identifiers[0]?.identifierValue).toBeNull();
        expect(graph.nodes[0]?.identifiers[0]?.maskedValue.endsWith('5671')).toBe(true);
        expect(graph.relationships[0]?.sourceReference).toBeNull();
      });

      it('requires the sensitive permission before returning full identifiers', async () => {
        const service = new PersonRelationshipService(repository(), events);
        await expect(
          service.familyTree(context(PEOPLE_PERMISSIONS.relationshipsView), parentId, {
            includeSensitive: true,
          }),
        ).rejects.toMatchObject({ code: 'PERSON_RELATIONSHIP_FORBIDDEN' });
        const graph = await service.familyTree(
          context(
            PEOPLE_PERMISSIONS.relationshipsView,
            PEOPLE_PERMISSIONS.familySensitiveView,
          ),
          parentId,
          { includeSensitive: true },
        );
        expect(graph.nodes[0]?.identifiers[0]?.identifierValue).toBe('1234512345671');
      });

      it('uses optimistic versions for relationship corrections', async () => {
        const service = new PersonRelationshipService(repository({ updateConflict: true }), events);
        await expect(
          service.update(
            context(PEOPLE_PERMISSIONS.relationshipsManage),
            relationshipId,
            { expectedVersion: 1, relationshipRole: 'parent' },
          ),
        ).rejects.toMatchObject({ code: 'PERSON_RELATIONSHIP_STATE_CONFLICT' });
      });

      it('persists verification revocation metadata instead of silently erasing history', async () => {
        const service = new PersonRelationshipService(repository(), events);
        const verified = await service.verify(
          context(PEOPLE_PERMISSIONS.relationshipsVerify),
          relationshipId,
          { expectedVersion: 1, verificationSource: 'NADRA CRC' },
        );
        const revoked = await service.revokeVerification(
          context(PEOPLE_PERMISSIONS.relationshipsVerify),
          relationshipId,
          { expectedVersion: verified.version, reason: 'Certificate was superseded.' },
        );
        expect(revoked.isVerified).toBe(false);
        expect(revoked.verificationRevocationReason).toBe('Certificate was superseded.');
        expect(revoked.verificationRevokedByUserId).toBe(actorUserId);
      });
    });
    ''',
)

write(
    'apps/api/src/people/current-organization-family-relationships.input.spec.ts',
    '''
    import { describe, expect, it } from 'vitest';

    import {
      parseCreateRelationshipBody,
      parseFamilyTreeQuery,
      parseUpdateRelationshipBody,
    } from './current-organization-family-relationships.input';

    describe('family relationship HTTP input', () => {
      it('parses bounded family-tree options', () => {
        expect(parseFamilyTreeQuery({ depth: '3', include_sensitive: 'true' })).toEqual({
          depth: 3,
          includeSensitive: true,
        });
      });

      it('parses relationship dates as UTC dates', () => {
        const result = parseCreateRelationshipBody({
          source_person_id: '11111111-1111-4111-8111-111111111111',
          target_person_id: '22222222-2222-4222-8222-222222222222',
          relationship_type: 'parent_of',
          relationship_role: 'father',
          relationship_basis: 'biological',
          valid_from: '2020-01-02',
        });
        expect(result.validFrom?.toISOString()).toBe('2020-01-02T00:00:00.000Z');
      });

      it('rejects unsupported client fields', () => {
        expect(() =>
          parseUpdateRelationshipBody({ expected_version: 1, tenant_id: 'forged' }),
        ).toThrow();
      });
    });
    ''',
)

write(
    'apps/api/src/database/person-relationship-operations-schema.spec.ts',
    '''
    import { readFileSync } from 'node:fs';
    import { resolve } from 'node:path';

    import { describe, expect, it } from 'vitest';

    const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'prisma/migrations/20260717010000_govern_person_relationship_operations/migration.sql',
      ),
      'utf8',
    );

    describe('person relationship operation schema', () => {
      it('adds optimistic version and verification revocation ownership', () => {
        expect(schema).toContain('version                      Int       @default(1)');
        expect(schema).toContain('verificationRevocationReason');
        expect(schema).toContain('PersonRelationshipVerificationRevokedBy');
      });

      it('enforces version and complete verification states in PostgreSQL', () => {
        expect(migration).toContain('core_person_relationships_version_check');
        expect(migration).toContain('verification_revocation_reason');
        expect(migration).toContain('btrim("verification_source") <>');
        expect(migration).toContain('verification_revoked_by_user_id_fkey');
      });
    });
    ''',
)

write(
    'apps/api/src/database/person-relationship-operations-database.spec.ts',
    '''
    import { randomUUID } from 'node:crypto';

    import { Pool, type PoolClient } from 'pg';
    import { afterAll, beforeAll, describe, expect, it } from 'vitest';

    const databaseUrl = process.env.DATABASE_URL;

    function code(error: unknown): string | undefined {
      return typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : undefined;
    }

    describe.skipIf(!databaseUrl)('person relationship operation database integrity', () => {
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

      it('accepts complete revocation metadata and rejects partial revocation claims', async () => {
        await transaction(async (client) => {
          const tenantId = randomUUID();
          const verifierPersonId = randomUUID();
          const sourcePersonId = randomUUID();
          const targetPersonId = randomUUID();
          const verifierUserId = randomUUID();
          await client.query(
            `INSERT INTO "core_tenants" ("id", "name", "updated_at") VALUES ($1, 'Test', CURRENT_TIMESTAMP)`,
            [tenantId],
          );
          for (const [id, firstName] of [
            [verifierPersonId, 'Verifier'],
            [sourcePersonId, 'Source'],
            [targetPersonId, 'Target'],
          ]) {
            await client.query(
              `INSERT INTO "core_people" ("id", "first_name", "last_name", "updated_at")
               VALUES ($1, $2, 'Person', CURRENT_TIMESTAMP)`,
              [id, firstName],
            );
          }
          await client.query(
            `INSERT INTO "core_users" ("id", "person_id", "status", "updated_at")
             VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)`,
            [verifierUserId, verifierPersonId],
          );
          await client.query(
            `INSERT INTO "core_person_relationships" (
               "id", "tenant_id", "source_person_id", "target_person_id",
               "relationship_type", "relationship_role", "relationship_basis",
               "verification_revoked_at", "verification_revoked_by_user_id",
               "verification_revocation_reason"
             ) VALUES ($1, $2, $3, $4, 'parent_of', 'parent', 'declared', CURRENT_TIMESTAMP, $5, 'Evidence was superseded')`,
            [randomUUID(), tenantId, sourcePersonId, targetPersonId, verifierUserId],
          );
          await expect(
            client.query(
              `INSERT INTO "core_person_relationships" (
                 "id", "tenant_id", "source_person_id", "target_person_id",
                 "relationship_type", "relationship_role", "relationship_basis",
                 "verification_revoked_at", "verification_revoked_by_user_id"
               ) VALUES ($1, $2, $3, $4, 'guardian_of', 'guardian', 'legal', CURRENT_TIMESTAMP, $5)`,
              [randomUUID(), tenantId, sourcePersonId, targetPersonId, verifierUserId],
            ),
          ).rejects.toSatisfy((error: unknown) => code(error) === '23514');
        });
      });
    });
    ''',
)

# Documentation and versioning
package_path = Path('packages/people/package.json')
package = json.loads(package_path.read_text())
package['version'] = '0.3.0'
package['description'] = 'Reusable NEWAX People, identifiers, and governed family relationship module.'
package_path.write_text(json.dumps(package, indent=2) + '\n')
Path('packages/people/VERSION').write_text('0.3.0\n')

readme_path = Path('packages/people/README.md')
readme = readme_path.read_text()
readme = readme.replace('Version: `0.2.0`', 'Version: `0.3.0`')
readme += textwrap.dedent(
    '''

    ## Governed family relationship API

    Version 0.3.0 adds a current-Organization service and HTTP boundary for canonical person relationships.

    Permissions:

    - `people.relationships.view` reads bounded family relationships and redacted family graphs.
    - `people.relationships.manage` creates, corrects, and ends relationships.
    - `people.relationships.verify` verifies relationships or records a verification revocation.
    - `people.family_sensitive.view` allows full dates of birth, gender, official identifier values, issuing authorities, and evidence references in family views.

    Organization scope begins from an active person membership in the current Organization. The graph may include connected relatives who are not themselves Organization members, but an unrelated Tenant-owned graph cannot be selected directly. Relationship mutations require at least one endpoint to be reachable from the current Organization.

    Corrections use an optimistic `version`. Source person, target person, and relationship type are immutable; a materially different fact must end the old relationship and create a new one. Ending a relationship preserves history. Verification revocation records who revoked it, when, and why.

    Current endpoints:

    ```text
    GET  /api/core/organizations/current/family-tree/:personId
    GET  /api/core/organizations/current/person-relationships/:relationshipId
    POST /api/core/organizations/current/person-relationships
    PUT  /api/core/organizations/current/person-relationships/:relationshipId
    POST /api/core/organizations/current/person-relationships/:relationshipId/end
    POST /api/core/organizations/current/person-relationships/:relationshipId/verify
    POST /api/core/organizations/current/person-relationships/:relationshipId/verification/revoke
    ```

    Every response is `no-store`. Full sensitive values are excluded unless explicitly requested and separately authorized.
    ''',
)
readme_path.write_text(readme)

changelog_path = Path('packages/people/CHANGELOG.md')
changelog = changelog_path.read_text()
changelog = changelog.replace(
    '# Changelog\n',
    '# Changelog\n\n## 0.3.0 - 2026-07-16\n\n### Added\n\n- Governed family relationship creation, correction, ending, verification, and verification-revocation services.\n- Bounded current-Organization family-tree reads with separate sensitive-field permission.\n- Optimistic relationship versions and durable verification-revocation metadata.\n- Current-Organization HTTP endpoints, PostgreSQL integrity tests, and relationship events.\n\n',
    1,
)
changelog_path.write_text(changelog)

registry_path = Path('registry/module-registry.json')
registry = json.loads(registry_path.read_text())
registry['registry_version'] = '0.1.18'
registry['last_updated'] = '2026-07-16'
people_module = next(item for item in registry['modules'] if item['module_key'] == 'people')
people_module['module_version'] = '0.3.0'
people_module['description'] = (
    'Maintains central person identity, official identifiers, and governed tenant-scoped family relationships with current-Organization access boundaries.'
)
for permission in [
    'people.relationships.view',
    'people.relationships.manage',
    'people.relationships.verify',
    'people.family_sensitive.view',
]:
    if permission not in people_module['required_permissions']:
        people_module['required_permissions'].append(permission)
for event in [
    'person.relationship.created',
    'person.relationship.updated',
    'person.relationship.ended',
    'person.relationship.verified',
    'person.relationship.verification_revoked',
]:
    if event not in people_module['exposed_events']:
        people_module['exposed_events'].append(event)
people_module['configuration_options'] = [
    'person_status_values',
    'identity_deduplication_policy',
    'family_graph_max_depth',
    'family_sensitive_disclosure_policy',
]
people_module['compatibility_notes'] = (
    'Shared identity and relationship foundation. Domain modules reference person_id; official identifiers remain separate. '
    'Current-Organization family access starts from an active membership, sensitive disclosure requires a dedicated permission, '
    'and relationship history is changed through optimistic versioned operations rather than deletion.'
)
registry_path.write_text(json.dumps(registry, indent=2) + '\n')

# Update plain-language registry explanation
explain_path = Path('tooling/database-registry/explain.js')
explain = explain_path.read_text()
explain = explain.replace(
    "'A governed connection between two real people, stored once without copying either person or their official identifiers.',",
    "'A governed, versioned connection between two real people, stored once without copying either person or their official identifiers.',",
)
explain_path.write_text(explain)
