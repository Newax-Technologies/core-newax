from pathlib import Path
import json
import textwrap


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip())


# Prisma schema
schema_path = Path('apps/api/prisma/schema.prisma')
schema = schema_path.read_text()
schema = replace_once(
    schema,
    '  peopleIntakes             CorePeopleIntake[]\n  objects',
    '  peopleIntakes             CorePeopleIntake[]\n  peopleIntakeEvidence     CorePeopleIntakeEvidence[]\n  certificateImports      CoreCertificateImport[]\n  objects',
    'tenant evidence collections',
)
schema = replace_once(
    schema,
    '  peopleIntakes         CorePeopleIntake[]\n\n  @@unique([tenantId, id])',
    '  peopleIntakes         CorePeopleIntake[]\n  peopleIntakeEvidence CorePeopleIntakeEvidence[]\n  certificateImports  CoreCertificateImport[]\n\n  @@unique([tenantId, id])',
    'organization evidence collections',
)
schema = replace_once(
    schema,
    '  reviewedByUser CoreUser?        @relation("PeopleIntakeReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)\n\n  // Workflow state',
    '  reviewedByUser CoreUser?                  @relation("PeopleIntakeReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)\n  evidence       CorePeopleIntakeEvidence[]\n\n  // Workflow state',
    'intake evidence relation',
)
schema = replace_once(
    schema,
    '  @@index([tenantId, organizationId, status, submittedAt, id])',
    '  @@unique([tenantId, organizationId, id])\n  @@index([tenantId, organizationId, status, submittedAt, id])',
    'intake composite identity',
)
models = textwrap.dedent(
    '''
    model CorePeopleIntakeEvidence {
      id               String   @id @default(uuid()) @db.Uuid
      tenantId         String   @map("tenant_id") @db.Uuid
      organizationId   String   @map("organization_id") @db.Uuid
      intakeId         String   @map("intake_id") @db.Uuid
      fileId           String   @map("file_id") @db.Uuid
      documentType     String   @map("document_type") @db.VarChar(64)
      evidenceRole     String   @default("primary") @map("evidence_role") @db.VarChar(32)
      attachedByUserId String   @map("attached_by_user_id") @db.Uuid
      createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

      tenant             CoreTenant       @relation(fields: [tenantId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      organization       CoreOrganization @relation(fields: [tenantId, organizationId], references: [tenantId, id], onDelete: Restrict, onUpdate: Cascade)
      intake             CorePeopleIntake @relation(fields: [tenantId, organizationId, intakeId], references: [tenantId, organizationId, id], onDelete: Restrict, onUpdate: Cascade)
      file               CoreFile         @relation(fields: [tenantId, organizationId, fileId], references: [tenantId, organizationId, id], onDelete: Restrict, onUpdate: Cascade)
      attachedByUser     CoreUser         @relation("PeopleIntakeEvidenceAttachedBy", fields: [attachedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      certificateImports CoreCertificateImport[]

      @@unique([tenantId, organizationId, id])
      @@unique([tenantId, organizationId, intakeId, fileId])
      @@index([tenantId, organizationId, intakeId, createdAt, id])
      @@index([fileId])
      @@map("core_people_intake_evidence")
    }

    model CoreCertificateImport {
      id               String    @id @default(uuid()) @db.Uuid
      tenantId         String    @map("tenant_id") @db.Uuid
      organizationId   String    @map("organization_id") @db.Uuid
      evidenceId       String    @map("evidence_id") @db.Uuid
      status           String    @default("pending") @db.VarChar(32)
      extractionPayload Json?    @map("extraction_payload") @db.JsonB
      extractorCode    String?   @map("extractor_code") @db.VarChar(64)
      extractionVersion String?  @map("extraction_version") @db.VarChar(64)
      confidenceBps    Int?      @map("confidence_bps")
      extractedByUserId String?  @map("extracted_by_user_id") @db.Uuid
      extractedAt      DateTime? @map("extracted_at") @db.Timestamptz(6)
      reviewedByUserId String?   @map("reviewed_by_user_id") @db.Uuid
      reviewedAt       DateTime? @map("reviewed_at") @db.Timestamptz(6)
      reviewDecision   String?   @map("review_decision") @db.VarChar(16)
      reviewNotes      String?   @map("review_notes") @db.VarChar(2000)
      appliedByUserId  String?   @map("applied_by_user_id") @db.Uuid
      appliedAt        DateTime? @map("applied_at") @db.Timestamptz(6)
      version          Int       @default(1)
      createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
      updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

      tenant          CoreTenant              @relation(fields: [tenantId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      organization    CoreOrganization        @relation(fields: [tenantId, organizationId], references: [tenantId, id], onDelete: Restrict, onUpdate: Cascade)
      evidence        CorePeopleIntakeEvidence @relation(fields: [tenantId, organizationId, evidenceId], references: [tenantId, organizationId, id], onDelete: Restrict, onUpdate: Cascade)
      extractedByUser CoreUser?               @relation("CertificateImportExtractedBy", fields: [extractedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      reviewedByUser  CoreUser?               @relation("CertificateImportReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      appliedByUser   CoreUser?               @relation("CertificateImportAppliedBy", fields: [appliedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)

      @@unique([tenantId, organizationId, evidenceId])
      @@index([tenantId, organizationId, status, createdAt, id])
      @@index([extractedByUserId, extractedAt])
      @@index([reviewedByUserId, reviewedAt])
      @@index([appliedByUserId, appliedAt])
      @@map("core_certificate_imports")
    }

    '''
)
schema = replace_once(schema, 'model CoreUser {', models + 'model CoreUser {', 'evidence model insertion')
schema = replace_once(
    schema,
    '  peopleIntakesReviewed                  CorePeopleIntake[]          @relation("PeopleIntakeReviewedBy")',
    '  peopleIntakesReviewed                  CorePeopleIntake[]          @relation("PeopleIntakeReviewedBy")\n  peopleIntakeEvidenceAttached          CorePeopleIntakeEvidence[]  @relation("PeopleIntakeEvidenceAttachedBy")\n  certificateImportsExtracted           CoreCertificateImport[]     @relation("CertificateImportExtractedBy")\n  certificateImportsReviewed            CoreCertificateImport[]     @relation("CertificateImportReviewedBy")\n  certificateImportsApplied             CoreCertificateImport[]     @relation("CertificateImportAppliedBy")',
    'user evidence collections',
)
schema = replace_once(
    schema,
    '  createdByUser CoreUser?        @relation("FileCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)\n\n  @@unique([tenantId, id])',
    '  createdByUser CoreUser?                   @relation("FileCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)\n  peopleIntakeEvidence CorePeopleIntakeEvidence[]\n\n  @@unique([tenantId, id])\n  @@unique([tenantId, organizationId, id])',
    'file evidence relation',
)
schema_path.write_text(schema)

# Migration
write(
    'apps/api/prisma/migrations/20260717070000_add_certificate_import_evidence_staging/migration.sql',
    r'''
    CREATE TABLE "core_people_intake_evidence" (
      "id" UUID NOT NULL,
      "tenant_id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "intake_id" UUID NOT NULL,
      "file_id" UUID NOT NULL,
      "document_type" VARCHAR(64) NOT NULL,
      "evidence_role" VARCHAR(32) NOT NULL DEFAULT 'primary',
      "attached_by_user_id" UUID NOT NULL,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "core_people_intake_evidence_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "core_people_intake_evidence_document_type_check" CHECK (btrim("document_type") <> ''),
      CONSTRAINT "core_people_intake_evidence_role_check" CHECK (btrim("evidence_role") <> '')
    );

    CREATE TABLE "core_certificate_imports" (
      "id" UUID NOT NULL,
      "tenant_id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "evidence_id" UUID NOT NULL,
      "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
      "extraction_payload" JSONB,
      "extractor_code" VARCHAR(64),
      "extraction_version" VARCHAR(64),
      "confidence_bps" INTEGER,
      "extracted_by_user_id" UUID,
      "extracted_at" TIMESTAMPTZ(6),
      "reviewed_by_user_id" UUID,
      "reviewed_at" TIMESTAMPTZ(6),
      "review_decision" VARCHAR(16),
      "review_notes" VARCHAR(2000),
      "applied_by_user_id" UUID,
      "applied_at" TIMESTAMPTZ(6),
      "version" INTEGER NOT NULL DEFAULT 1,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "core_certificate_imports_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "core_certificate_imports_confidence_check" CHECK ("confidence_bps" IS NULL OR "confidence_bps" BETWEEN 0 AND 10000),
      CONSTRAINT "core_certificate_imports_version_check" CHECK ("version" > 0),
      CONSTRAINT "core_certificate_imports_reviewer_check" CHECK ("reviewed_by_user_id" IS NULL OR "reviewed_by_user_id" <> "extracted_by_user_id"),
      CONSTRAINT "core_certificate_imports_state_check" CHECK (
        (
          "status" = 'pending'
          AND "extraction_payload" IS NULL
          AND "extractor_code" IS NULL
          AND "extraction_version" IS NULL
          AND "confidence_bps" IS NULL
          AND "extracted_by_user_id" IS NULL
          AND "extracted_at" IS NULL
          AND "reviewed_by_user_id" IS NULL
          AND "reviewed_at" IS NULL
          AND "review_decision" IS NULL
          AND "review_notes" IS NULL
          AND "applied_by_user_id" IS NULL
          AND "applied_at" IS NULL
        )
        OR
        (
          "status" = 'extracted'
          AND "extraction_payload" IS NOT NULL
          AND "extractor_code" IS NOT NULL AND btrim("extractor_code") <> ''
          AND "extraction_version" IS NOT NULL AND btrim("extraction_version") <> ''
          AND "confidence_bps" IS NOT NULL
          AND "extracted_by_user_id" IS NOT NULL
          AND "extracted_at" IS NOT NULL
          AND "reviewed_by_user_id" IS NULL
          AND "reviewed_at" IS NULL
          AND "review_decision" IS NULL
          AND "review_notes" IS NULL
          AND "applied_by_user_id" IS NULL
          AND "applied_at" IS NULL
        )
        OR
        (
          "status" IN ('accepted', 'rejected')
          AND "extraction_payload" IS NOT NULL
          AND "extractor_code" IS NOT NULL AND btrim("extractor_code") <> ''
          AND "extraction_version" IS NOT NULL AND btrim("extraction_version") <> ''
          AND "confidence_bps" IS NOT NULL
          AND "extracted_by_user_id" IS NOT NULL
          AND "extracted_at" IS NOT NULL
          AND "reviewed_by_user_id" IS NOT NULL
          AND "reviewed_at" IS NOT NULL
          AND "review_decision" = "status"
          AND ("status" <> 'rejected' OR ("review_notes" IS NOT NULL AND btrim("review_notes") <> ''))
          AND (
            ("applied_by_user_id" IS NULL AND "applied_at" IS NULL)
            OR
            ("status" = 'accepted' AND "applied_by_user_id" IS NOT NULL AND "applied_at" IS NOT NULL)
          )
        )
      )
    );

    CREATE UNIQUE INDEX "core_people_intake_evidence_scope_id_key"
      ON "core_people_intake_evidence"("tenant_id", "organization_id", "id");
    CREATE UNIQUE INDEX "core_people_intake_evidence_intake_file_key"
      ON "core_people_intake_evidence"("tenant_id", "organization_id", "intake_id", "file_id");
    CREATE INDEX "core_people_intake_evidence_intake_idx"
      ON "core_people_intake_evidence"("tenant_id", "organization_id", "intake_id", "created_at", "id");
    CREATE INDEX "core_people_intake_evidence_file_idx" ON "core_people_intake_evidence"("file_id");

    CREATE UNIQUE INDEX "core_certificate_imports_evidence_key"
      ON "core_certificate_imports"("tenant_id", "organization_id", "evidence_id");
    CREATE INDEX "core_certificate_imports_queue_idx"
      ON "core_certificate_imports"("tenant_id", "organization_id", "status", "created_at", "id");
    CREATE INDEX "core_certificate_imports_extracted_idx"
      ON "core_certificate_imports"("extracted_by_user_id", "extracted_at");
    CREATE INDEX "core_certificate_imports_reviewed_idx"
      ON "core_certificate_imports"("reviewed_by_user_id", "reviewed_at");
    CREATE INDEX "core_certificate_imports_applied_idx"
      ON "core_certificate_imports"("applied_by_user_id", "applied_at");

    CREATE UNIQUE INDEX "core_people_intakes_scope_id_key"
      ON "core_people_intakes"("tenant_id", "organization_id", "id");
    CREATE UNIQUE INDEX "core_files_scope_organization_id_key"
      ON "core_files"("tenant_id", "organization_id", "id");

    ALTER TABLE "core_people_intake_evidence"
      ADD CONSTRAINT "core_people_intake_evidence_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "core_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_people_intake_evidence_organization_id_fkey"
      FOREIGN KEY ("tenant_id", "organization_id") REFERENCES "core_organizations"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_people_intake_evidence_intake_id_fkey"
      FOREIGN KEY ("tenant_id", "organization_id", "intake_id") REFERENCES "core_people_intakes"("tenant_id", "organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_people_intake_evidence_file_id_fkey"
      FOREIGN KEY ("tenant_id", "organization_id", "file_id") REFERENCES "core_files"("tenant_id", "organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_people_intake_evidence_attached_by_user_id_fkey"
      FOREIGN KEY ("attached_by_user_id") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "core_certificate_imports"
      ADD CONSTRAINT "core_certificate_imports_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "core_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_certificate_imports_organization_id_fkey"
      FOREIGN KEY ("tenant_id", "organization_id") REFERENCES "core_organizations"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_certificate_imports_evidence_id_fkey"
      FOREIGN KEY ("tenant_id", "organization_id", "evidence_id") REFERENCES "core_people_intake_evidence"("tenant_id", "organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_certificate_imports_extracted_by_user_id_fkey"
      FOREIGN KEY ("extracted_by_user_id") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_certificate_imports_reviewed_by_user_id_fkey"
      FOREIGN KEY ("reviewed_by_user_id") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT "core_certificate_imports_applied_by_user_id_fkey"
      FOREIGN KEY ("applied_by_user_id") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    CREATE FUNCTION "core_require_draft_people_intake_evidence"()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM "core_people_intakes" intake
        WHERE intake."tenant_id" = NEW."tenant_id"
          AND intake."organization_id" = NEW."organization_id"
          AND intake."id" = NEW."intake_id"
          AND intake."status" = 'draft'
      ) THEN
        RAISE EXCEPTION 'Evidence may only be attached to an editable draft intake' USING ERRCODE = '23514';
      END IF;
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER "core_people_intake_evidence_draft_trigger"
    BEFORE INSERT ON "core_people_intake_evidence"
    FOR EACH ROW EXECUTE FUNCTION "core_require_draft_people_intake_evidence"();
    ''',
)

# Reusable types, port, service
write(
    'packages/people-intake/src/types/certificate-import.ts',
    '''
    import type { PeopleIntakePayload, PeopleIntakePayloadInput, PeopleIntakeRequestContext } from './people-intake';

    export type CertificateImportStatus = 'pending' | 'extracted' | 'accepted' | 'rejected';
    export type CertificateImportReviewDecision = 'accepted' | 'rejected';

    export interface EvidenceFileSummary {
      readonly id: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly intakeId: string;
      readonly fileId: string;
      readonly documentType: string;
      readonly evidenceRole: string;
      readonly attachedByUserId: string;
      readonly fileName: string;
      readonly mimeType: string;
      readonly fileSize: bigint;
      readonly createdAt: Date;
      readonly certificateImportId: string | null;
      readonly certificateImportStatus: CertificateImportStatus | null;
    }

    export interface CertificateImportRecord {
      readonly id: string;
      readonly tenantId: string;
      readonly organizationId: string;
      readonly evidenceId: string;
      readonly intakeId: string;
      readonly status: CertificateImportStatus;
      readonly extractionPayload: PeopleIntakePayload | null;
      readonly extractorCode: string | null;
      readonly extractionVersion: string | null;
      readonly confidenceBps: number | null;
      readonly extractedByUserId: string | null;
      readonly extractedAt: Date | null;
      readonly reviewedByUserId: string | null;
      readonly reviewedAt: Date | null;
      readonly reviewDecision: CertificateImportReviewDecision | null;
      readonly reviewNotes: string | null;
      readonly appliedByUserId: string | null;
      readonly appliedAt: Date | null;
      readonly version: number;
      readonly intakeVersion: number;
      readonly intakeStatus: string;
      readonly intakeCreatedByUserId: string;
      readonly createdAt: Date;
      readonly updatedAt: Date;
    }

    export interface AttachEvidenceInput {
      readonly fileId: string;
      readonly documentType: string;
      readonly evidenceRole?: string;
    }

    export interface RecordCertificateExtractionInput {
      readonly expectedVersion: number;
      readonly extractorCode: string;
      readonly extractionVersion: string;
      readonly confidenceBps: number;
      readonly payload: PeopleIntakePayloadInput;
    }

    export interface ReviewCertificateImportInput {
      readonly expectedVersion: number;
      readonly decision: CertificateImportReviewDecision;
      readonly notes?: string | null;
    }

    export interface ApplyCertificateImportInput {
      readonly expectedImportVersion: number;
      readonly expectedIntakeVersion: number;
    }

    export interface EvidenceScopeInput {
      readonly tenantId: string;
      readonly organizationId: string;
      readonly intakeId: string;
    }

    export interface AttachEvidenceRecordInput extends EvidenceScopeInput {
      readonly fileId: string;
      readonly documentType: string;
      readonly evidenceRole: string;
      readonly actorUserId: string;
    }

    export type AttachEvidenceRecordResult =
      | { readonly status: 'attached'; readonly evidence: EvidenceFileSummary }
      | { readonly status: 'intake_not_found' | 'file_not_found' | 'state_conflict' | 'conflict' };

    export type CreateCertificateImportRecordResult =
      | { readonly status: 'created'; readonly importRecord: CertificateImportRecord }
      | { readonly status: 'not_found' | 'conflict' };

    export interface CertificateImportIdentityInput {
      readonly tenantId: string;
      readonly organizationId: string;
      readonly importId: string;
    }

    export interface ExtractCertificateImportRecordInput extends CertificateImportIdentityInput {
      readonly actorUserId: string;
      readonly expectedVersion: number;
      readonly extractorCode: string;
      readonly extractionVersion: string;
      readonly confidenceBps: number;
      readonly payload: PeopleIntakePayload;
      readonly extractedAt: Date;
    }

    export interface ReviewCertificateImportRecordInput extends CertificateImportIdentityInput {
      readonly reviewerUserId: string;
      readonly expectedVersion: number;
      readonly decision: CertificateImportReviewDecision;
      readonly notes: string | null;
      readonly reviewedAt: Date;
    }

    export interface ApplyCertificateImportRecordInput extends CertificateImportIdentityInput {
      readonly actorUserId: string;
      readonly expectedImportVersion: number;
      readonly expectedIntakeVersion: number;
      readonly appliedAt: Date;
    }

    export type ChangeCertificateImportResult =
      | { readonly status: 'changed'; readonly importRecord: CertificateImportRecord }
      | {
          readonly status:
            | 'not_found'
            | 'version_conflict'
            | 'state_conflict'
            | 'self_review'
            | 'creator_mismatch';
        };

    export interface CertificateEvidenceRequestContext extends PeopleIntakeRequestContext {}
    ''',
)

write(
    'packages/people-intake/src/database/certificate-import-repository.ts',
    '''
    import type {
      ApplyCertificateImportRecordInput,
      AttachEvidenceRecordInput,
      AttachEvidenceRecordResult,
      CertificateImportIdentityInput,
      CertificateImportRecord,
      ChangeCertificateImportResult,
      CreateCertificateImportRecordResult,
      EvidenceFileSummary,
      EvidenceScopeInput,
      ExtractCertificateImportRecordInput,
      ReviewCertificateImportRecordInput,
    } from '../types/certificate-import';

    export interface CertificateImportRepository {
      attachEvidence(input: AttachEvidenceRecordInput): Promise<AttachEvidenceRecordResult>;
      listEvidence(input: EvidenceScopeInput): Promise<readonly EvidenceFileSummary[]>;
      createImport(
        input: EvidenceScopeInput & { readonly evidenceId: string },
      ): Promise<CreateCertificateImportRecordResult>;
      findImport(input: CertificateImportIdentityInput): Promise<CertificateImportRecord | null>;
      recordExtraction(
        input: ExtractCertificateImportRecordInput,
      ): Promise<ChangeCertificateImportResult>;
      reviewImport(input: ReviewCertificateImportRecordInput): Promise<ChangeCertificateImportResult>;
      applyImport(input: ApplyCertificateImportRecordInput): Promise<ChangeCertificateImportResult>;
    }
    ''',
)

write(
    'packages/people-intake/src/services/certificate-import.service.ts',
    '''
    import type { CertificateImportRepository } from '../database/certificate-import-repository';
    import { PeopleIntakeModuleError } from '../errors/people-intake-module-error';
    import {
      PEOPLE_INTAKE_PERMISSIONS,
      type PeopleIntakePermission,
    } from '../permissions/people-intake-permissions';
    import type {
      ApplyCertificateImportInput,
      AttachEvidenceInput,
      CertificateEvidenceRequestContext,
      CertificateImportRecord,
      CertificateImportReviewDecision,
      ChangeCertificateImportResult,
      EvidenceFileSummary,
      RecordCertificateExtractionInput,
      ReviewCertificateImportInput,
    } from '../types/certificate-import';
    import { PeopleIntakeValidator } from './people-intake-validator';

    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
    const CODE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

    export class CertificateImportService {
      private readonly validator = new PeopleIntakeValidator();

      constructor(private readonly repository: CertificateImportRepository) {}

      async attachEvidence(
        context: CertificateEvidenceRequestContext,
        intakeId: string,
        input: AttachEvidenceInput,
      ): Promise<EvidenceFileSummary> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.evidenceAttach);
        const result = await this.repository.attachEvidence({
          ...scope,
          intakeId: this.inputUuid(intakeId, 'intakeId'),
          fileId: this.inputUuid(input.fileId, 'fileId'),
          documentType: this.code(input.documentType, 'documentType', 64),
          evidenceRole: this.code(input.evidenceRole ?? 'primary', 'evidenceRole', 32),
          actorUserId: scope.actorUserId,
        });
        if (result.status === 'attached') {
          this.assertEvidence(result.evidence, scope);
          return result.evidence;
        }
        if (result.status === 'file_not_found') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_NOT_FOUND',
            'The evidence file is unavailable in the current Organization.',
          );
        }
        if (result.status === 'intake_not_found') {
          throw new PeopleIntakeModuleError('PEOPLE_INTAKE_NOT_FOUND', 'The intake does not exist.');
        }
        if (result.status === 'state_conflict') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_STATE_CONFLICT',
            'Evidence may only be attached to an editable draft.',
          );
        }
        throw new PeopleIntakeModuleError(
          'PEOPLE_INTAKE_CONFLICT',
          'The file is already attached to this intake.',
        );
      }

      async listEvidence(
        context: CertificateEvidenceRequestContext,
        intakeId: string,
      ): Promise<readonly EvidenceFileSummary[]> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.evidenceView);
        const items = await this.repository.listEvidence({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          intakeId: this.inputUuid(intakeId, 'intakeId'),
        });
        for (const item of items) {
          this.assertEvidence(item, scope);
        }
        return items;
      }

      async createImport(
        context: CertificateEvidenceRequestContext,
        intakeId: string,
        evidenceId: string,
      ): Promise<CertificateImportRecord> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.certificateExtract);
        const result = await this.repository.createImport({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          intakeId: this.inputUuid(intakeId, 'intakeId'),
          evidenceId: this.inputUuid(evidenceId, 'evidenceId'),
        });
        if (result.status === 'created') {
          return this.record(result.importRecord, scope);
        }
        if (result.status === 'not_found') {
          throw new PeopleIntakeModuleError('PEOPLE_INTAKE_NOT_FOUND', 'The evidence does not exist.');
        }
        throw new PeopleIntakeModuleError(
          'PEOPLE_INTAKE_CONFLICT',
          'A certificate import already exists for this evidence.',
        );
      }

      async getImport(
        context: CertificateEvidenceRequestContext,
        importId: string,
      ): Promise<CertificateImportRecord> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.evidenceView);
        const record = await this.repository.findImport({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          importId: this.inputUuid(importId, 'importId'),
        });
        if (record === null) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_NOT_FOUND',
            'The certificate import does not exist.',
          );
        }
        return this.record(record, scope);
      }

      async recordExtraction(
        context: CertificateEvidenceRequestContext,
        importId: string,
        input: RecordCertificateExtractionInput,
      ): Promise<CertificateImportRecord> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.certificateExtract);
        const confidenceBps = input.confidenceBps;
        if (!Number.isInteger(confidenceBps) || confidenceBps < 0 || confidenceBps > 10_000) {
          this.invalid('confidenceBps', 'confidenceBps must be an integer from 0 to 10000.');
        }
        const result = await this.repository.recordExtraction({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          importId: this.inputUuid(importId, 'importId'),
          actorUserId: scope.actorUserId,
          expectedVersion: this.version(input.expectedVersion),
          extractorCode: this.code(input.extractorCode, 'extractorCode', 64),
          extractionVersion: this.text(input.extractionVersion, 'extractionVersion', 64),
          confidenceBps,
          payload: this.validator.normalizePayload(input.payload),
          extractedAt: new Date(),
        });
        return this.changed(result, scope);
      }

      async reviewImport(
        context: CertificateEvidenceRequestContext,
        importId: string,
        input: ReviewCertificateImportInput,
      ): Promise<CertificateImportRecord> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.certificateReview);
        const decision = this.decision(input.decision);
        const notes = this.nullableText(input.notes, 'notes', 2_000);
        if (decision === 'rejected' && notes === null) {
          this.invalid('notes', 'A rejected extraction requires reviewer notes.');
        }
        const result = await this.repository.reviewImport({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          importId: this.inputUuid(importId, 'importId'),
          reviewerUserId: scope.actorUserId,
          expectedVersion: this.version(input.expectedVersion),
          decision,
          notes,
          reviewedAt: new Date(),
        });
        return this.changed(result, scope);
      }

      async applyImport(
        context: CertificateEvidenceRequestContext,
        importId: string,
        input: ApplyCertificateImportInput,
      ): Promise<CertificateImportRecord> {
        const scope = this.scope(context, PEOPLE_INTAKE_PERMISSIONS.certificateApply);
        const result = await this.repository.applyImport({
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          importId: this.inputUuid(importId, 'importId'),
          actorUserId: scope.actorUserId,
          expectedImportVersion: this.version(input.expectedImportVersion),
          expectedIntakeVersion: this.version(input.expectedIntakeVersion),
          appliedAt: new Date(),
        });
        return this.changed(result, scope);
      }

      private changed(
        result: ChangeCertificateImportResult,
        scope: Scope,
      ): CertificateImportRecord {
        if (result.status === 'changed') {
          return this.record(result.importRecord, scope);
        }
        if (result.status === 'not_found') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_NOT_FOUND',
            'The certificate import does not exist.',
          );
        }
        if (result.status === 'self_review') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            'The extraction actor cannot review the same certificate import.',
          );
        }
        if (result.status === 'creator_mismatch') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            'Only the intake creator can apply an accepted extraction to the draft.',
          );
        }
        if (result.status === 'version_conflict') {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_CONFLICT',
            'The import or intake changed after it was loaded. Reload before continuing.',
          );
        }
        throw new PeopleIntakeModuleError(
          'PEOPLE_INTAKE_STATE_CONFLICT',
          'The certificate import is not in the required workflow state.',
        );
      }

      private record(record: CertificateImportRecord, scope: Scope): CertificateImportRecord {
        if (record.tenantId !== scope.tenantId || record.organizationId !== scope.organizationId) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            'The certificate import escaped its trusted Organization boundary.',
          );
        }
        this.version(record.version);
        return record;
      }

      private assertEvidence(item: EvidenceFileSummary, scope: Scope): void {
        if (item.tenantId !== scope.tenantId || item.organizationId !== scope.organizationId) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            'The evidence record escaped its trusted Organization boundary.',
          );
        }
      }

      private scope(
        context: CertificateEvidenceRequestContext,
        permission: PeopleIntakePermission,
      ): Scope {
        if (!context.permissionCodes.has(permission)) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_FORBIDDEN',
            `The operation requires the ${permission} permission.`,
            { permission },
          );
        }
        return {
          actorUserId: this.trustedUuid(context.actorUserId, 'context.actorUserId'),
          tenantId: this.trustedUuid(context.tenantId, 'context.tenantId'),
          organizationId: this.trustedUuid(context.organizationId, 'context.organizationId'),
        };
      }

      private inputUuid(value: string, field: string): string {
        if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
          this.invalid(field, `${field} must be a UUID.`);
        }
        return value.toLowerCase();
      }

      private trustedUuid(value: unknown, field: string): string {
        if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
          throw new PeopleIntakeModuleError(
            'PEOPLE_INTAKE_INTEGRITY_FAILURE',
            `${field} must be a UUID.`,
          );
        }
        return value.toLowerCase();
      }

      private version(value: number): number {
        if (!Number.isInteger(value) || value < 1) {
          this.invalid('expectedVersion', 'A version must be a positive integer.');
        }
        return value;
      }

      private decision(value: CertificateImportReviewDecision): CertificateImportReviewDecision {
        if (value !== 'accepted' && value !== 'rejected') {
          this.invalid('decision', 'decision must be accepted or rejected.');
        }
        return value;
      }

      private code(value: string, field: string, maximum: number): string {
        const normalized = this.text(value, field, maximum).toLowerCase();
        if (!CODE_PATTERN.test(normalized)) {
          this.invalid(field, `${field} must be a stable machine-readable code.`);
        }
        return normalized;
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

      private invalid(field: string, message: string): never {
        throw new PeopleIntakeModuleError('PEOPLE_INTAKE_INVALID_INPUT', message, { field });
      }
    }

    interface Scope {
      readonly actorUserId: string;
      readonly tenantId: string;
      readonly organizationId: string;
    }
    ''',
)

# Permissions and exports
permissions_path = Path('packages/people-intake/src/permissions/people-intake-permissions.ts')
permissions = permissions_path.read_text()
permissions = replace_once(
    permissions,
    "  review: 'people_intake.review',",
    "  review: 'people_intake.review',\n  evidenceView: 'people_intake.evidence.view',\n  evidenceAttach: 'people_intake.evidence.attach',\n  certificateExtract: 'people_intake.certificate_import.extract',\n  certificateReview: 'people_intake.certificate_import.review',\n  certificateApply: 'people_intake.certificate_import.apply',",
    'certificate import permissions',
)
permissions_path.write_text(permissions)

index_path = Path('packages/people-intake/src/index.ts')
index = index_path.read_text()
index = "export type { CertificateImportRepository } from './database/certificate-import-repository';\n" + index
index = index.replace(
    "export { PeopleIntakeService } from './services/people-intake.service';",
    "export { CertificateImportService } from './services/certificate-import.service';\nexport { PeopleIntakeService } from './services/people-intake.service';",
)
index += textwrap.dedent(
    '''
    export type {
      ApplyCertificateImportInput,
      ApplyCertificateImportRecordInput,
      AttachEvidenceInput,
      AttachEvidenceRecordInput,
      AttachEvidenceRecordResult,
      CertificateEvidenceRequestContext,
      CertificateImportIdentityInput,
      CertificateImportRecord,
      CertificateImportReviewDecision,
      CertificateImportStatus,
      ChangeCertificateImportResult,
      CreateCertificateImportRecordResult,
      EvidenceFileSummary,
      EvidenceScopeInput,
      ExtractCertificateImportRecordInput,
      RecordCertificateExtractionInput,
      ReviewCertificateImportInput,
      ReviewCertificateImportRecordInput,
    } from './types/certificate-import';
    '''
)
index_path.write_text(index)

# Prisma repository
write(
    'apps/api/src/people-intake/prisma-certificate-import.repository.ts',
    '''
    import { Inject, Injectable } from '@nestjs/common';
    import type {
      ApplyCertificateImportRecordInput,
      AttachEvidenceRecordInput,
      AttachEvidenceRecordResult,
      CertificateImportIdentityInput,
      CertificateImportRecord,
      CertificateImportRepository,
      CertificateImportReviewDecision,
      CertificateImportStatus,
      ChangeCertificateImportResult,
      CreateCertificateImportRecordResult,
      EvidenceFileSummary,
      EvidenceScopeInput,
      ExtractCertificateImportRecordInput,
      PeopleIntakePayload,
      ReviewCertificateImportRecordInput,
    } from '@newax/people-intake';

    import { PrismaService } from '../database/prisma.service';

    const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    const MAX_EVIDENCE_SIZE = 25n * 1024n * 1024n;

    @Injectable()
    export class PrismaCertificateImportRepository implements CertificateImportRepository {
      constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

      async attachEvidence(
        input: AttachEvidenceRecordInput,
      ): Promise<AttachEvidenceRecordResult> {
        const [intake, file] = await Promise.all([
          this.prisma.corePeopleIntake.findFirst({
            where: {
              id: input.intakeId,
              tenantId: input.tenantId,
              organizationId: input.organizationId,
            },
            select: { status: true },
          }),
          this.prisma.coreFile.findFirst({
            where: {
              id: input.fileId,
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              status: 'active',
            },
          }),
        ]);
        if (intake === null) return { status: 'intake_not_found' };
        if (file === null || !ALLOWED_MIME_TYPES.has(file.mimeType) || file.fileSize > MAX_EVIDENCE_SIZE) {
          return { status: 'file_not_found' };
        }
        if (intake.status !== 'draft') return { status: 'state_conflict' };
        try {
          const evidence = await this.prisma.corePeopleIntakeEvidence.create({
            data: {
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              intakeId: input.intakeId,
              fileId: input.fileId,
              documentType: input.documentType,
              evidenceRole: input.evidenceRole,
              attachedByUserId: input.actorUserId,
            },
            include: { file: true, certificateImports: { take: 1 } },
          });
          return { status: 'attached', evidence: this.evidence(evidence) };
        } catch (error: unknown) {
          return this.conflict(error) ? { status: 'conflict' } : Promise.reject(error);
        }
      }

      async listEvidence(input: EvidenceScopeInput): Promise<readonly EvidenceFileSummary[]> {
        const records = await this.prisma.corePeopleIntakeEvidence.findMany({
          where: {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            intakeId: input.intakeId,
          },
          include: { file: true, certificateImports: { take: 1 } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });
        return records.map((record) => this.evidence(record));
      }

      async createImport(
        input: EvidenceScopeInput & { readonly evidenceId: string },
      ): Promise<CreateCertificateImportRecordResult> {
        const evidence = await this.prisma.corePeopleIntakeEvidence.findFirst({
          where: {
            id: input.evidenceId,
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            intakeId: input.intakeId,
          },
        });
        if (evidence === null) return { status: 'not_found' };
        try {
          const record = await this.prisma.coreCertificateImport.create({
            data: {
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              evidenceId: input.evidenceId,
            },
            include: { evidence: { include: { intake: true } } },
          });
          return { status: 'created', importRecord: this.importRecord(record) };
        } catch (error: unknown) {
          return this.conflict(error) ? { status: 'conflict' } : Promise.reject(error);
        }
      }

      async findImport(input: CertificateImportIdentityInput): Promise<CertificateImportRecord | null> {
        const record = await this.prisma.coreCertificateImport.findFirst({
          where: {
            id: input.importId,
            tenantId: input.tenantId,
            organizationId: input.organizationId,
          },
          include: { evidence: { include: { intake: true } } },
        });
        return record === null ? null : this.importRecord(record);
      }

      async recordExtraction(
        input: ExtractCertificateImportRecordInput,
      ): Promise<ChangeCertificateImportResult> {
        return this.change(input, {
          status: 'extracted',
          extractionPayload: input.payload,
          extractorCode: input.extractorCode,
          extractionVersion: input.extractionVersion,
          confidenceBps: input.confidenceBps,
          extractedByUserId: input.actorUserId,
          extractedAt: input.extractedAt,
        }, 'pending');
      }

      async reviewImport(
        input: ReviewCertificateImportRecordInput,
      ): Promise<ChangeCertificateImportResult> {
        const existing = await this.prisma.coreCertificateImport.findFirst({
          where: {
            id: input.importId,
            tenantId: input.tenantId,
            organizationId: input.organizationId,
          },
          select: { extractedByUserId: true },
        });
        if (existing === null) return { status: 'not_found' };
        if (existing.extractedByUserId === input.reviewerUserId) return { status: 'self_review' };
        return this.change(input, {
          status: input.decision,
          reviewedByUserId: input.reviewerUserId,
          reviewedAt: input.reviewedAt,
          reviewDecision: input.decision,
          reviewNotes: input.notes,
        }, 'extracted');
      }

      async applyImport(
        input: ApplyCertificateImportRecordInput,
      ): Promise<ChangeCertificateImportResult> {
        return this.prisma.$transaction(async (transaction) => {
          const record = await transaction.coreCertificateImport.findFirst({
            where: {
              id: input.importId,
              tenantId: input.tenantId,
              organizationId: input.organizationId,
            },
            include: { evidence: { include: { intake: true } } },
          });
          if (record === null) return { status: 'not_found' as const };
          if (record.version !== input.expectedImportVersion || record.evidence.intake.version !== input.expectedIntakeVersion) {
            return { status: 'version_conflict' as const };
          }
          if (record.status !== 'accepted' || record.appliedAt !== null || record.extractionPayload === null || record.evidence.intake.status !== 'draft') {
            return { status: 'state_conflict' as const };
          }
          if (record.evidence.intake.createdByUserId !== input.actorUserId) {
            return { status: 'creator_mismatch' as const };
          }
          const payload = record.extractionPayload as unknown as PeopleIntakePayload;
          const intakeUpdate = await transaction.corePeopleIntake.updateMany({
            where: {
              id: record.evidence.intakeId,
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              status: 'draft',
              version: input.expectedIntakeVersion,
              createdByUserId: input.actorUserId,
            },
            data: {
              payload,
              personCount: payload.people.length,
              relationshipCount: payload.relationships.length,
              version: { increment: 1 },
            },
          });
          if (intakeUpdate.count !== 1) return { status: 'version_conflict' as const };
          const importUpdate = await transaction.coreCertificateImport.updateMany({
            where: {
              id: input.importId,
              tenantId: input.tenantId,
              organizationId: input.organizationId,
              version: input.expectedImportVersion,
              status: 'accepted',
              appliedAt: null,
            },
            data: {
              appliedByUserId: input.actorUserId,
              appliedAt: input.appliedAt,
              version: { increment: 1 },
            },
          });
          if (importUpdate.count !== 1) throw new Error('Certificate import apply lost its atomic state.');
          const updated = await transaction.coreCertificateImport.findUniqueOrThrow({
            where: { id: input.importId },
            include: { evidence: { include: { intake: true } } },
          });
          return { status: 'changed' as const, importRecord: this.importRecord(updated) };
        });
      }

      private async change(
        input: CertificateImportIdentityInput & { readonly expectedVersion: number },
        data: Record<string, unknown>,
        requiredStatus: CertificateImportStatus,
      ): Promise<ChangeCertificateImportResult> {
        const updated = await this.prisma.coreCertificateImport.updateMany({
          where: {
            id: input.importId,
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            version: input.expectedVersion,
            status: requiredStatus,
          },
          data: { ...data, version: { increment: 1 } },
        });
        if (updated.count === 0) {
          const existing = await this.prisma.coreCertificateImport.findFirst({
            where: { id: input.importId, tenantId: input.tenantId, organizationId: input.organizationId },
            select: { version: true, status: true },
          });
          if (existing === null) return { status: 'not_found' };
          return existing.version !== input.expectedVersion
            ? { status: 'version_conflict' }
            : { status: 'state_conflict' };
        }
        const record = await this.prisma.coreCertificateImport.findUniqueOrThrow({
          where: { id: input.importId },
          include: { evidence: { include: { intake: true } } },
        });
        return { status: 'changed', importRecord: this.importRecord(record) };
      }

      private evidence(record: any): EvidenceFileSummary {
        const importRecord = record.certificateImports[0] ?? null;
        return {
          id: record.id,
          tenantId: record.tenantId,
          organizationId: record.organizationId,
          intakeId: record.intakeId,
          fileId: record.fileId,
          documentType: record.documentType,
          evidenceRole: record.evidenceRole,
          attachedByUserId: record.attachedByUserId,
          fileName: record.file.fileName,
          mimeType: record.file.mimeType,
          fileSize: record.file.fileSize,
          createdAt: record.createdAt,
          certificateImportId: importRecord?.id ?? null,
          certificateImportStatus: importRecord === null ? null : this.status(importRecord.status),
        };
      }

      private importRecord(record: any): CertificateImportRecord {
        return {
          id: record.id,
          tenantId: record.tenantId,
          organizationId: record.organizationId,
          evidenceId: record.evidenceId,
          intakeId: record.evidence.intakeId,
          status: this.status(record.status),
          extractionPayload: record.extractionPayload as PeopleIntakePayload | null,
          extractorCode: record.extractorCode,
          extractionVersion: record.extractionVersion,
          confidenceBps: record.confidenceBps,
          extractedByUserId: record.extractedByUserId,
          extractedAt: record.extractedAt,
          reviewedByUserId: record.reviewedByUserId,
          reviewedAt: record.reviewedAt,
          reviewDecision: record.reviewDecision as CertificateImportReviewDecision | null,
          reviewNotes: record.reviewNotes,
          appliedByUserId: record.appliedByUserId,
          appliedAt: record.appliedAt,
          version: record.version,
          intakeVersion: record.evidence.intake.version,
          intakeStatus: record.evidence.intake.status,
          intakeCreatedByUserId: record.evidence.intake.createdByUserId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      }

      private status(value: string): CertificateImportStatus {
        if (value === 'pending' || value === 'extracted' || value === 'accepted' || value === 'rejected') return value;
        throw new Error(`Unsupported certificate import status: ${value}`);
      }

      private conflict(error: unknown): boolean {
        return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002';
      }
    }
    ''',
)

# HTTP parser/controller
write(
    'apps/api/src/people-intake/current-organization-certificate-imports.input.ts',
    '''
    import type {
      ApplyCertificateImportInput,
      AttachEvidenceInput,
      PeopleIntakePayloadInput,
      RecordCertificateExtractionInput,
      ReviewCertificateImportInput,
    } from '@newax/people-intake';
    import { HttpSecurityError } from '@newax/http-security';

    type ObjectValue = Record<string, unknown>;

    export function parseAttachEvidenceBody(body: unknown): AttachEvidenceInput {
      const value = object(body);
      allowed(value, ['file_id', 'document_type', 'evidence_role']);
      return {
        fileId: text(value.file_id, 'file_id'),
        documentType: text(value.document_type, 'document_type'),
        ...(value.evidence_role === undefined ? {} : { evidenceRole: text(value.evidence_role, 'evidence_role') }),
      };
    }

    export function parseExtractionBody(body: unknown): RecordCertificateExtractionInput {
      const value = object(body);
      allowed(value, ['expected_version', 'extractor_code', 'extraction_version', 'confidence_bps', 'payload']);
      return {
        expectedVersion: integer(value.expected_version, 'expected_version'),
        extractorCode: text(value.extractor_code, 'extractor_code'),
        extractionVersion: text(value.extraction_version, 'extraction_version'),
        confidenceBps: integer(value.confidence_bps, 'confidence_bps'),
        payload: object(value.payload) as unknown as PeopleIntakePayloadInput,
      };
    }

    export function parseImportReviewBody(body: unknown): ReviewCertificateImportInput {
      const value = object(body);
      allowed(value, ['expected_version', 'decision', 'notes']);
      return {
        expectedVersion: integer(value.expected_version, 'expected_version'),
        decision: text(value.decision, 'decision') as 'accepted' | 'rejected',
        ...(value.notes === undefined ? {} : { notes: nullableText(value.notes, 'notes') }),
      };
    }

    export function parseApplyImportBody(body: unknown): ApplyCertificateImportInput {
      const value = object(body);
      allowed(value, ['expected_import_version', 'expected_intake_version']);
      return {
        expectedImportVersion: integer(value.expected_import_version, 'expected_import_version'),
        expectedIntakeVersion: integer(value.expected_intake_version, 'expected_intake_version'),
      };
    }

    function object(value: unknown): ObjectValue {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid('body must be an object.');
      return value as ObjectValue;
    }

    function allowed(value: ObjectValue, keys: readonly string[]): void {
      const accepted = new Set(keys);
      for (const key of Object.keys(value)) if (!accepted.has(key)) invalid(`body contains unsupported field ${key}.`);
    }

    function text(value: unknown, field: string): string {
      if (typeof value !== 'string') invalid(`${field} must be text.`);
      return value;
    }

    function nullableText(value: unknown, field: string): string | null {
      return value === null ? null : text(value, field);
    }

    function integer(value: unknown, field: string): number {
      if (typeof value !== 'number' || !Number.isInteger(value)) invalid(`${field} must be an integer.`);
      return value;
    }

    function invalid(message: string): never {
      throw new HttpSecurityError('HTTP_SECURITY_INVALID_INPUT', message, 400);
    }
    ''',
)

write(
    'apps/api/src/people-intake/current-organization-certificate-imports.controller.ts',
    '''
    import { Body, Controller, Get, Header, HttpCode, Inject, Param, Post, Put, Req } from '@nestjs/common';
    import { CertificateImportService, PEOPLE_INTAKE_PERMISSIONS } from '@newax/people-intake';
    import { HttpSecurityError } from '@newax/http-security';
    import { ContextAuthorizer, type TrustedOrganizationRequestContext } from '@newax/request-context';

    import { OrganizationContextEndpoint, RequirePermissions } from '../http-security/http-security.decorators';
    import type { HttpSecurityRequestAdapter } from '../http-security/http-security-request';
    import {
      parseApplyImportBody,
      parseAttachEvidenceBody,
      parseExtractionBody,
      parseImportReviewBody,
    } from './current-organization-certificate-imports.input';

    @Controller('core/organizations/current/people-intakes')
    export class CurrentOrganizationCertificateImportsController {
      constructor(
        @Inject(CertificateImportService) private readonly service: CertificateImportService,
        @Inject(ContextAuthorizer) private readonly authorizer: ContextAuthorizer,
      ) {}

      @Get(':intakeId/evidence')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.evidenceView)
      async listEvidence(@Req() request: HttpSecurityRequestAdapter, @Param('intakeId') intakeId: string) {
        return { success: true as const, data: (await this.service.listEvidence(this.context(request), intakeId)).map(this.evidence) };
      }

      @Post(':intakeId/evidence')
      @HttpCode(201)
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.evidenceAttach)
      async attachEvidence(@Req() request: HttpSecurityRequestAdapter, @Param('intakeId') intakeId: string, @Body() body: unknown) {
        return { success: true as const, data: this.evidence(await this.service.attachEvidence(this.context(request), intakeId, parseAttachEvidenceBody(body))) };
      }

      @Post(':intakeId/evidence/:evidenceId/certificate-imports')
      @HttpCode(201)
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.certificateExtract)
      async createImport(@Req() request: HttpSecurityRequestAdapter, @Param('intakeId') intakeId: string, @Param('evidenceId') evidenceId: string) {
        return { success: true as const, data: this.importRecord(await this.service.createImport(this.context(request), intakeId, evidenceId)) };
      }

      @Get('certificate-imports/:importId')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.evidenceView)
      async getImport(@Req() request: HttpSecurityRequestAdapter, @Param('importId') importId: string) {
        return { success: true as const, data: this.importRecord(await this.service.getImport(this.context(request), importId)) };
      }

      @Put('certificate-imports/:importId/extraction')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.certificateExtract)
      async extract(@Req() request: HttpSecurityRequestAdapter, @Param('importId') importId: string, @Body() body: unknown) {
        return { success: true as const, data: this.importRecord(await this.service.recordExtraction(this.context(request), importId, parseExtractionBody(body))) };
      }

      @Post('certificate-imports/:importId/review')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.certificateReview)
      async review(@Req() request: HttpSecurityRequestAdapter, @Param('importId') importId: string, @Body() body: unknown) {
        return { success: true as const, data: this.importRecord(await this.service.reviewImport(this.context(request), importId, parseImportReviewBody(body))) };
      }

      @Post('certificate-imports/:importId/apply')
      @Header('Cache-Control', 'no-store')
      @OrganizationContextEndpoint()
      @RequirePermissions(PEOPLE_INTAKE_PERMISSIONS.certificateApply)
      async apply(@Req() request: HttpSecurityRequestAdapter, @Param('importId') importId: string, @Body() body: unknown) {
        return { success: true as const, data: this.importRecord(await this.service.applyImport(this.context(request), importId, parseApplyImportBody(body))) };
      }

      private context(request: HttpSecurityRequestAdapter) {
        const context = request.trustedContext;
        if (context === undefined || context.scope !== 'organization') {
          throw new HttpSecurityError('HTTP_SECURITY_INVALID_INPUT', 'Trusted organization context was not established.', 500);
        }
        return this.authorizer.toModuleContext(context as TrustedOrganizationRequestContext);
      }

      private evidence(item: any) {
        return {
          id: item.id,
          intake_id: item.intakeId,
          file_id: item.fileId,
          document_type: item.documentType,
          evidence_role: item.evidenceRole,
          file_name: item.fileName,
          mime_type: item.mimeType,
          file_size: item.fileSize.toString(),
          certificate_import_id: item.certificateImportId,
          certificate_import_status: item.certificateImportStatus,
          created_at: item.createdAt.toISOString(),
        };
      }

      private importRecord(item: any) {
        return {
          id: item.id,
          evidence_id: item.evidenceId,
          intake_id: item.intakeId,
          status: item.status,
          extraction_payload: item.extractionPayload,
          extractor_code: item.extractorCode,
          extraction_version: item.extractionVersion,
          confidence_bps: item.confidenceBps,
          extracted_by_user_id: item.extractedByUserId,
          extracted_at: item.extractedAt?.toISOString() ?? null,
          reviewed_by_user_id: item.reviewedByUserId,
          reviewed_at: item.reviewedAt?.toISOString() ?? null,
          review_decision: item.reviewDecision,
          review_notes: item.reviewNotes,
          applied_by_user_id: item.appliedByUserId,
          applied_at: item.appliedAt?.toISOString() ?? null,
          version: item.version,
          intake_version: item.intakeVersion,
          intake_status: item.intakeStatus,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString(),
        };
      }
    }
    ''',
)

# Compose Nest module
module_path = Path('apps/api/src/people-intake/people-intake.module.ts')
module = module_path.read_text()
module = module.replace(
    "import { PeopleIntakeService } from '@newax/people-intake';",
    "import { CertificateImportService, PeopleIntakeService } from '@newax/people-intake';",
)
module = replace_once(
    module,
    "import { CurrentOrganizationPeopleIntakesController } from './current-organization-people-intakes.controller';",
    "import { CurrentOrganizationCertificateImportsController } from './current-organization-certificate-imports.controller';\nimport { CurrentOrganizationPeopleIntakesController } from './current-organization-people-intakes.controller';",
    'certificate controller import',
)
module = replace_once(
    module,
    "import { PrismaPeopleIntakeRepository } from './prisma-people-intake.repository';",
    "import { PrismaCertificateImportRepository } from './prisma-certificate-import.repository';\nimport { PrismaPeopleIntakeRepository } from './prisma-people-intake.repository';",
    'certificate repository import',
)
module = replace_once(
    module,
    '  controllers: [CurrentOrganizationPeopleIntakesController],',
    '  controllers: [CurrentOrganizationPeopleIntakesController, CurrentOrganizationCertificateImportsController],',
    'certificate controller composition',
)
module = replace_once(
    module,
    '    PrismaPeopleIntakeRepository,',
    '    PrismaPeopleIntakeRepository,\n    PrismaCertificateImportRepository,\n    {\n      provide: CertificateImportService,\n      inject: [PrismaCertificateImportRepository],\n      useFactory: (repository: PrismaCertificateImportRepository): CertificateImportService =>\n        new CertificateImportService(repository),\n    },',
    'certificate service factory',
)
module = replace_once(
    module,
    '  exports: [PeopleIntakeService],',
    '  exports: [PeopleIntakeService, CertificateImportService],',
    'certificate service export',
)
module_path.write_text(module)

# Tests
write(
    'packages/people-intake/src/services/certificate-import.service.spec.ts',
    '''
    import { describe, expect, it } from 'vitest';

    import type { CertificateImportRepository } from '../database/certificate-import-repository';
    import { PEOPLE_INTAKE_PERMISSIONS } from '../permissions/people-intake-permissions';
    import type { CertificateImportRecord, EvidenceFileSummary } from '../types/certificate-import';
    import type { PeopleIntakeRequestContext } from '../types/people-intake';
    import { CertificateImportService } from './certificate-import.service';

    const actor = '11111111-1111-4111-8111-111111111111';
    const reviewer = '22222222-2222-4222-8222-222222222222';
    const tenant = '33333333-3333-4333-8333-333333333333';
    const organization = '44444444-4444-4444-8444-444444444444';
    const intake = '55555555-5555-4555-8555-555555555555';
    const evidenceId = '66666666-6666-4666-8666-666666666666';
    const importId = '77777777-7777-4777-8777-777777777777';
    const fileId = '88888888-8888-4888-8888-888888888888';

    function context(user: string, ...permissions: string[]): PeopleIntakeRequestContext {
      return { actorUserId: user, tenantId: tenant, organizationId: organization, permissionCodes: new Set(permissions) };
    }

    const payload = {
      schemaVersion: 1 as const,
      people: [{ clientKey: 'child', firstName: 'Sara', lastName: 'Khan' }],
      relationships: [],
    };

    function evidence(): EvidenceFileSummary {
      return {
        id: evidenceId,
        tenantId: tenant,
        organizationId: organization,
        intakeId: intake,
        fileId,
        documentType: 'birth_certificate',
        evidenceRole: 'primary',
        attachedByUserId: actor,
        fileName: 'certificate.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024n,
        createdAt: new Date(),
        certificateImportId: null,
        certificateImportStatus: null,
      };
    }

    function importRecord(overrides: Partial<CertificateImportRecord> = {}): CertificateImportRecord {
      const now = new Date();
      return {
        id: importId,
        tenantId: tenant,
        organizationId: organization,
        evidenceId,
        intakeId: intake,
        status: 'pending',
        extractionPayload: null,
        extractorCode: null,
        extractionVersion: null,
        confidenceBps: null,
        extractedByUserId: null,
        extractedAt: null,
        reviewedByUserId: null,
        reviewedAt: null,
        reviewDecision: null,
        reviewNotes: null,
        appliedByUserId: null,
        appliedAt: null,
        version: 1,
        intakeVersion: 1,
        intakeStatus: 'draft',
        intakeCreatedByUserId: actor,
        createdAt: now,
        updatedAt: now,
        ...overrides,
      };
    }

    function repository(): CertificateImportRepository {
      let current = importRecord();
      return {
        async attachEvidence() { return { status: 'attached', evidence: evidence() }; },
        async listEvidence() { return [evidence()]; },
        async createImport() { return { status: 'created', importRecord: current }; },
        async findImport() { return current; },
        async recordExtraction(input) {
          current = importRecord({ status: 'extracted', extractionPayload: input.payload, extractorCode: input.extractorCode, extractionVersion: input.extractionVersion, confidenceBps: input.confidenceBps, extractedByUserId: input.actorUserId, extractedAt: input.extractedAt, version: 2 });
          return { status: 'changed', importRecord: current };
        },
        async reviewImport(input) {
          if (current.extractedByUserId === input.reviewerUserId) return { status: 'self_review' };
          current = importRecord({ ...current, status: input.decision, reviewedByUserId: input.reviewerUserId, reviewedAt: input.reviewedAt, reviewDecision: input.decision, reviewNotes: input.notes, version: current.version + 1 });
          return { status: 'changed', importRecord: current };
        },
        async applyImport(input) {
          current = importRecord({ ...current, appliedByUserId: input.actorUserId, appliedAt: input.appliedAt, version: current.version + 1, intakeVersion: current.intakeVersion + 1 });
          return { status: 'changed', importRecord: current };
        },
      };
    }

    describe('CertificateImportService', () => {
      it('attaches eligible evidence through a dedicated permission', async () => {
        const service = new CertificateImportService(repository());
        const result = await service.attachEvidence(context(actor, PEOPLE_INTAKE_PERMISSIONS.evidenceAttach), intake, { fileId, documentType: 'BIRTH_CERTIFICATE' });
        expect(result.documentType).toBe('birth_certificate');
      });

      it('normalizes and stages structured extraction', async () => {
        const service = new CertificateImportService(repository());
        const result = await service.recordExtraction(context(actor, PEOPLE_INTAKE_PERMISSIONS.certificateExtract), importId, { expectedVersion: 1, extractorCode: 'MANUAL', extractionVersion: '1.0', confidenceBps: 9000, payload });
        expect(result.status).toBe('extracted');
        expect(result.extractionPayload?.people[0]?.firstName).toBe('Sara');
      });

      it('prevents the extraction actor from reviewing the same import', async () => {
        const service = new CertificateImportService(repository());
        await service.recordExtraction(context(actor, PEOPLE_INTAKE_PERMISSIONS.certificateExtract), importId, { expectedVersion: 1, extractorCode: 'manual', extractionVersion: '1', confidenceBps: 8000, payload });
        await expect(service.reviewImport(context(actor, PEOPLE_INTAKE_PERMISSIONS.certificateReview), importId, { expectedVersion: 2, decision: 'accepted' })).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_FORBIDDEN' });
      });

      it('accepts independent review and explicit application', async () => {
        const service = new CertificateImportService(repository());
        const extracted = await service.recordExtraction(context(actor, PEOPLE_INTAKE_PERMISSIONS.certificateExtract), importId, { expectedVersion: 1, extractorCode: 'manual', extractionVersion: '1', confidenceBps: 8000, payload });
        const accepted = await service.reviewImport(context(reviewer, PEOPLE_INTAKE_PERMISSIONS.certificateReview), importId, { expectedVersion: extracted.version, decision: 'accepted' });
        const applied = await service.applyImport(context(actor, PEOPLE_INTAKE_PERMISSIONS.certificateApply), importId, { expectedImportVersion: accepted.version, expectedIntakeVersion: accepted.intakeVersion });
        expect(applied.appliedByUserId).toBe(actor);
      });
    });
    ''',
)

write(
    'apps/api/src/database/certificate-import-evidence-schema.spec.ts',
    '''
    import { readFileSync } from 'node:fs';
    import { resolve } from 'node:path';
    import { describe, expect, it } from 'vitest';

    const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(resolve(process.cwd(), 'prisma/migrations/20260717070000_add_certificate_import_evidence_staging/migration.sql'), 'utf8');

    describe('certificate import evidence schema', () => {
      it('owns evidence and certificate import records', () => {
        expect(schema).toContain('model CorePeopleIntakeEvidence');
        expect(schema).toContain('model CoreCertificateImport');
        expect(schema).toContain('extractionPayload');
        expect(schema).toContain('confidenceBps');
      });

      it('enforces scope, state, reviewer separation, and draft-only evidence', () => {
        expect(migration).toContain('core_certificate_imports_state_check');
        expect(migration).toContain('core_certificate_imports_reviewer_check');
        expect(migration).toContain('core_people_intake_evidence_draft_trigger');
        expect(migration).toContain('core_files_scope_organization_id_key');
      });
    });
    ''',
)

write(
    'apps/api/src/people-intake/current-organization-certificate-imports.input.spec.ts',
    '''
    import { describe, expect, it } from 'vitest';
    import { parseApplyImportBody, parseAttachEvidenceBody, parseExtractionBody } from './current-organization-certificate-imports.input';

    describe('certificate import HTTP input', () => {
      it('parses evidence attachment', () => {
        expect(parseAttachEvidenceBody({ file_id: 'id', document_type: 'birth_certificate' })).toEqual({ fileId: 'id', documentType: 'birth_certificate' });
      });
      it('parses extraction and preserves structured payload', () => {
        const result = parseExtractionBody({ expected_version: 1, extractor_code: 'manual', extraction_version: '1', confidence_bps: 9000, payload: { schemaVersion: 1, people: [], relationships: [] } });
        expect(result.confidenceBps).toBe(9000);
      });
      it('rejects unsupported fields', () => {
        expect(() => parseApplyImportBody({ expected_import_version: 1, expected_intake_version: 1, tenant_id: 'forged' })).toThrow();
      });
    });
    ''',
)

# Basic internal workspace
write(
    'apps/web/src/app/internal/people-intake/certificate-imports/page.tsx',
    '''
    import type { Metadata } from 'next';
    import { CertificateImportWorkspace } from './workspace';

    export const metadata: Metadata = {
      title: 'Certificate Import | NEWAX Core',
      robots: { index: false, follow: false },
    };

    export default function CertificateImportPage() {
      return <CertificateImportWorkspace />;
    }
    ''',
)

write(
    'apps/web/src/app/internal/people-intake/certificate-imports/workspace.tsx',
    '''
    'use client';

    import { useState, type FormEvent } from 'react';

    interface EvidenceItem {
      id: string;
      file_name: string;
      mime_type: string;
      document_type: string;
      certificate_import_id: string | null;
      certificate_import_status: string | null;
    }

    const emptyPayload = JSON.stringify({ schemaVersion: 1, people: [], relationships: [] }, null, 2);

    export function CertificateImportWorkspace() {
      const [intakeId, setIntakeId] = useState('');
      const [fileId, setFileId] = useState('');
      const [documentType, setDocumentType] = useState('birth_certificate');
      const [items, setItems] = useState<EvidenceItem[]>([]);
      const [importId, setImportId] = useState('');
      const [payload, setPayload] = useState(emptyPayload);
      const [message, setMessage] = useState('Enter an intake ID to begin.');

      async function request(path: string, init?: RequestInit) {
        const response = await fetch(path, {
          ...init,
          headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
          credentials: 'same-origin',
        });
        const body = await response.json();
        if (!response.ok || body.success !== true) throw new Error(body?.error?.message ?? 'The request failed.');
        return body.data;
      }

      async function loadEvidence() {
        const data = await request(`/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence`);
        setItems(data);
        setMessage(`Loaded ${String(data.length)} evidence record(s).`);
      }

      async function attach(event: FormEvent) {
        event.preventDefault();
        await request(`/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence`, {
          method: 'POST',
          body: JSON.stringify({ file_id: fileId, document_type: documentType }),
        });
        setFileId('');
        await loadEvidence();
      }

      async function createImport(evidenceId: string) {
        const data = await request(`/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence/${encodeURIComponent(evidenceId)}/certificate-imports`, { method: 'POST', body: '{}' });
        setImportId(data.id);
        setMessage(`Certificate import ${data.id} created.`);
        await loadEvidence();
      }

      async function extract(event: FormEvent) {
        event.preventDefault();
        const data = await request(`/api/core/organizations/current/people-intakes/certificate-imports/${encodeURIComponent(importId)}/extraction`, {
          method: 'PUT',
          body: JSON.stringify({ expected_version: 1, extractor_code: 'manual', extraction_version: '1', confidence_bps: 10000, payload: JSON.parse(payload) }),
        });
        setMessage(`Extraction staged at version ${String(data.version)}. It now requires independent review.`);
      }

      return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
          <p><a href="/internal/people-intake">← Family intake dashboard</a></p>
          <h1>Certificate import and evidence</h1>
          <p>Attach an existing NEWAX File record, stage extracted family data, and send it for independent verification. No extraction writes directly to the People Registry.</p>
          <p role="status">{message}</p>

          <section>
            <h2>Evidence attachment</h2>
            <form onSubmit={attach} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
              <label>Intake ID<input value={intakeId} onChange={(event) => setIntakeId(event.target.value)} required style={{ width: '100%' }} /></label>
              <label>Registered File ID<input value={fileId} onChange={(event) => setFileId(event.target.value)} required style={{ width: '100%' }} /></label>
              <label>Document type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="birth_certificate">Birth certificate</option><option value="crc">CRC</option><option value="family_registration_certificate">Family registration certificate</option><option value="marriage_certificate">Marriage certificate</option><option value="guardianship_order">Guardianship order</option><option value="other">Other</option></select></label>
              <div><button type="submit">Attach evidence</button> <button type="button" onClick={() => void loadEvidence()}>Load evidence</button></div>
            </form>
            <ul>{items.map((item) => <li key={item.id}><strong>{item.file_name}</strong> · {item.document_type} · {item.certificate_import_status ?? 'not imported'} {item.certificate_import_id === null ? <button type="button" onClick={() => void createImport(item.id)}>Create import</button> : <button type="button" onClick={() => setImportId(item.certificate_import_id ?? '')}>Open import</button>}</li>)}</ul>
          </section>

          <section>
            <h2>Structured extraction</h2>
            <form onSubmit={extract} style={{ display: 'grid', gap: 12 }}>
              <label>Certificate import ID<input value={importId} onChange={(event) => setImportId(event.target.value)} required style={{ width: '100%' }} /></label>
              <label>Extracted family payload<textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={20} style={{ width: '100%', fontFamily: 'monospace' }} /></label>
              <button type="submit">Stage extraction</button>
            </form>
          </section>
        </main>
      );
    }
    ''',
)

# Package and registry docs
package_path = Path('packages/people-intake/package.json')
package = json.loads(package_path.read_text())
package['version'] = '0.2.0'
package['description'] = 'Reusable NEWAX People Intake, evidence, and certificate verification workflow module.'
package_path.write_text(json.dumps(package, indent=2) + '\n')
Path('packages/people-intake/VERSION').write_text('0.2.0\n')

readme_path = Path('packages/people-intake/README.md')
readme = readme_path.read_text().replace('Version: `0.1.0`', 'Version: `0.2.0`')
readme += textwrap.dedent(
    '''

    ## Evidence and certificate imports

    Version 0.2.0 links an editable People Intake draft to active same-Organization File metadata and stages structured certificate extraction separately from the draft payload.

    Evidence attachment supports PDF, PNG, and JPEG files up to 25 MiB. It references `core_files`; it does not upload bytes, expose storage keys, or duplicate checksums. Evidence can only be attached while the intake remains a draft.

    A certificate import progresses through `pending`, `extracted`, `accepted`, or `rejected`. The extraction actor cannot review the same import. Rejection requires notes. An accepted extraction is copied into the draft only through an explicit apply operation by the intake creator with matching import and intake versions.

    Permissions:

    - `people_intake.evidence.view`
    - `people_intake.evidence.attach`
    - `people_intake.certificate_import.extract`
    - `people_intake.certificate_import.review`
    - `people_intake.certificate_import.apply`

    Automatic OCR, malware scanning, storage-provider upload, and signed file download remain separate storage and extraction-provider concerns.
    ''',
)
readme_path.write_text(readme)

changelog_path = Path('packages/people-intake/CHANGELOG.md')
changelog = changelog_path.read_text().replace(
    '# Changelog\n',
    '# Changelog\n\n## 0.2.0 - 2026-07-16\n\n- Added same-Organization evidence-file attachment.\n- Added structured certificate extraction, independent review, and explicit draft application.\n- Added PostgreSQL ownership, state, and reviewer-separation constraints.\n- Added an internal certificate-import workspace.\n\n',
    1,
)
changelog_path.write_text(changelog)

registry_path = Path('registry/module-registry.json')
registry = json.loads(registry_path.read_text())
registry['registry_version'] = '0.1.19'
registry['last_updated'] = '2026-07-16'
module = next(item for item in registry['modules'] if item['module_key'] == 'people-intake')
module['module_version'] = '0.2.0'
module['description'] = 'Stages family data, evidence files, and independently reviewed certificate extraction before canonical application.'
for table in ['core_people_intake_evidence', 'core_certificate_imports']:
    if table not in module['database_ownership']:
        module['database_ownership'].append(table)
for permission in [
    'people_intake.evidence.view',
    'people_intake.evidence.attach',
    'people_intake.certificate_import.extract',
    'people_intake.certificate_import.review',
    'people_intake.certificate_import.apply',
]:
    if permission not in module['required_permissions']:
        module['required_permissions'].append(permission)
registry_path.write_text(json.dumps(registry, indent=2) + '\n')
