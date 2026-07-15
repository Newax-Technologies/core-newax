from pathlib import Path
import json
import textwrap


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


schema_path = Path("apps/api/prisma/schema.prisma")
schema = schema_path.read_text()
schema = replace_once(
    schema,
    "  organizationRelationships CoreOrganizationRelationship[]\n  objects                   CoreObject[]",
    "  organizationRelationships CoreOrganizationRelationship[]\n  personRelationships       CorePersonRelationship[]\n  objects                   CoreObject[]",
    "CoreTenant relationship collection",
)
schema = replace_once(
    schema,
    "  personContacts  CorePersonContactMethod[]\n  personAddresses CorePersonAddress[]",
    "  personContacts      CorePersonContactMethod[]\n  personAddresses     CorePersonAddress[]\n  sourceRelationships CorePersonRelationship[] @relation(\"PersonRelationshipSource\")\n  targetRelationships CorePersonRelationship[] @relation(\"PersonRelationshipTarget\")",
    "CorePerson relationship collections",
)
schema = replace_once(
    schema,
    "  auditLogs                CoreAuditLog[]              @relation(\"AuditActor\")",
    "  auditLogs                    CoreAuditLog[]              @relation(\"AuditActor\")\n  personRelationshipsVerified CorePersonRelationship[] @relation(\"PersonRelationshipVerifiedBy\")",
    "CoreUser verification collection",
)
relationship_model = textwrap.dedent(
    '''
    model CorePersonRelationship {
      id                  String    @id @default(uuid()) @db.Uuid
      tenantId            String    @map("tenant_id") @db.Uuid
      sourcePersonId      String    @map("source_person_id") @db.Uuid
      targetPersonId      String    @map("target_person_id") @db.Uuid
      relationshipType    String    @map("relationship_type") @db.VarChar(64)
      relationshipRole    String    @default("unspecified") @map("relationship_role") @db.VarChar(64)
      relationshipBasis   String    @default("unspecified") @map("relationship_basis") @db.VarChar(64)
      status              String    @default("active") @db.VarChar(32)
      validFrom           DateTime? @map("valid_from") @db.Date
      validUntil          DateTime? @map("valid_until") @db.Date
      isVerified          Boolean   @default(false) @map("is_verified")
      verifiedAt          DateTime? @map("verified_at") @db.Timestamptz(6)
      verifiedByUserId    String?   @map("verified_by_user_id") @db.Uuid
      verificationSource  String?   @map("verification_source") @db.VarChar(128)
      sourceReference     String?   @map("source_reference") @db.VarChar(255)
      createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
      updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

      tenant         CoreTenant @relation(fields: [tenantId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      sourcePerson   CorePerson @relation("PersonRelationshipSource", fields: [sourcePersonId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      targetPerson   CorePerson @relation("PersonRelationshipTarget", fields: [targetPersonId], references: [id], onDelete: Restrict, onUpdate: Cascade)
      verifiedByUser CoreUser?  @relation("PersonRelationshipVerifiedBy", fields: [verifiedByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)

      // Self-links, validity, verification consistency, active-link uniqueness, and
      // active parentage cycles are enforced by migration-owned PostgreSQL constraints.
      @@index([tenantId, sourcePersonId, relationshipType, status])
      @@index([tenantId, targetPersonId, relationshipType, status])
      @@index([verifiedByUserId])
      @@map("core_person_relationships")
    }

    '''
)
schema = replace_once(
    schema,
    "model CoreUser {",
    relationship_model + "model CoreUser {",
    "relationship model insertion",
)
schema_path.write_text(schema)

migration_dir = Path(
    "apps/api/prisma/migrations/20260715190000_add_person_relationship_foundation"
)
migration_dir.mkdir(parents=True, exist_ok=False)
migration_sql = textwrap.dedent(
    '''
    -- Person relationships preserve one record per human while allowing tenant-scoped,
    -- verified family, guardianship, dependency, and other person-to-person links.
    CREATE TABLE "core_person_relationships" (
        "id" UUID NOT NULL,
        "tenant_id" UUID NOT NULL,
        "source_person_id" UUID NOT NULL,
        "target_person_id" UUID NOT NULL,
        "relationship_type" VARCHAR(64) NOT NULL,
        "relationship_role" VARCHAR(64) NOT NULL DEFAULT 'unspecified',
        "relationship_basis" VARCHAR(64) NOT NULL DEFAULT 'unspecified',
        "status" VARCHAR(32) NOT NULL DEFAULT 'active',
        "valid_from" DATE,
        "valid_until" DATE,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "verified_at" TIMESTAMPTZ(6),
        "verified_by_user_id" UUID,
        "verification_source" VARCHAR(128),
        "source_reference" VARCHAR(255),
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "core_person_relationships_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "core_person_relationships_distinct_people_check"
          CHECK ("source_person_id" <> "target_person_id"),
        CONSTRAINT "core_person_relationships_validity_check"
          CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" >= "valid_from"),
        CONSTRAINT "core_person_relationships_verification_check"
          CHECK (
            ("is_verified" = false AND "verified_at" IS NULL AND "verified_by_user_id" IS NULL)
            OR
            ("is_verified" = true AND "verified_at" IS NOT NULL AND "verification_source" IS NOT NULL)
          ),
        CONSTRAINT "core_person_relationships_type_not_blank_check"
          CHECK (btrim("relationship_type") <> ''),
        CONSTRAINT "core_person_relationships_role_not_blank_check"
          CHECK (btrim("relationship_role") <> ''),
        CONSTRAINT "core_person_relationships_basis_not_blank_check"
          CHECK (btrim("relationship_basis") <> '')
    );

    CREATE INDEX "core_person_relationships_source_idx"
    ON "core_person_relationships"("tenant_id", "source_person_id", "relationship_type", "status");

    CREATE INDEX "core_person_relationships_target_idx"
    ON "core_person_relationships"("tenant_id", "target_person_id", "relationship_type", "status");

    CREATE INDEX "core_person_relationships_verified_by_user_id_idx"
    ON "core_person_relationships"("verified_by_user_id");

    CREATE UNIQUE INDEX "core_person_relationships_active_identity_key"
    ON "core_person_relationships"(
      "tenant_id",
      "source_person_id",
      "target_person_id",
      "relationship_type",
      "relationship_role",
      "relationship_basis"
    )
    WHERE "status" = 'active' AND "valid_until" IS NULL;

    ALTER TABLE "core_person_relationships"
    ADD CONSTRAINT "core_person_relationships_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "core_tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "core_person_relationships"
    ADD CONSTRAINT "core_person_relationships_source_person_id_fkey"
    FOREIGN KEY ("source_person_id") REFERENCES "core_people"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "core_person_relationships"
    ADD CONSTRAINT "core_person_relationships_target_person_id_fkey"
    FOREIGN KEY ("target_person_id") REFERENCES "core_people"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "core_person_relationships"
    ADD CONSTRAINT "core_person_relationships_verified_by_user_id_fkey"
    FOREIGN KEY ("verified_by_user_id") REFERENCES "core_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

    CREATE FUNCTION "core_reject_person_parent_cycle"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW."relationship_type" <> 'parent_of' OR NEW."status" <> 'active' THEN
        RETURN NEW;
      END IF;

      -- Serialize parentage changes per Tenant so concurrent writes cannot independently
      -- validate incompatible branches of the same family tree.
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW."tenant_id"::text, 0));

      IF EXISTS (
        WITH RECURSIVE descendants("person_id") AS (
          SELECT relationship."target_person_id"
          FROM "core_person_relationships" AS relationship
          WHERE relationship."tenant_id" = NEW."tenant_id"
            AND relationship."id" <> NEW."id"
            AND relationship."source_person_id" = NEW."target_person_id"
            AND relationship."relationship_type" = 'parent_of'
            AND relationship."status" = 'active'
            AND (relationship."valid_until" IS NULL OR relationship."valid_until" >= CURRENT_DATE)

          UNION

          SELECT relationship."target_person_id"
          FROM "core_person_relationships" AS relationship
          INNER JOIN descendants
            ON relationship."source_person_id" = descendants."person_id"
          WHERE relationship."tenant_id" = NEW."tenant_id"
            AND relationship."id" <> NEW."id"
            AND relationship."relationship_type" = 'parent_of'
            AND relationship."status" = 'active'
            AND (relationship."valid_until" IS NULL OR relationship."valid_until" >= CURRENT_DATE)
        )
        SELECT 1
        FROM descendants
        WHERE descendants."person_id" = NEW."source_person_id"
      ) THEN
        RAISE EXCEPTION 'Active parent relationship would create a family-tree cycle'
          USING ERRCODE = '23514';
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER "core_person_relationships_parent_cycle_trigger"
    BEFORE INSERT OR UPDATE OF
      "tenant_id",
      "source_person_id",
      "target_person_id",
      "relationship_type",
      "status",
      "valid_until"
    ON "core_person_relationships"
    FOR EACH ROW
    EXECUTE FUNCTION "core_reject_person_parent_cycle"();
    '''
).lstrip()
migration_dir.joinpath("migration.sql").write_text(migration_sql)

registry_path = Path("registry/module-registry.json")
registry = json.loads(registry_path.read_text())
registry["registry_version"] = "0.1.16"
registry["last_updated"] = "2026-07-15"
people = next(
    module for module in registry["modules"] if module["module_key"] == "people"
)
people["module_version"] = "0.2.0"
people["description"] = (
    "Maintains central person identity and tenant-scoped, verified relationships "
    "between people across NEWAX project domains."
)
if "core_person_relationships" not in people["database_ownership"]:
    people["database_ownership"].append("core_person_relationships")
people["compatibility_notes"] = (
    "Shared identity and relationship foundation. Domain modules must reference people "
    "through person_id, keep CNIC and CRC values in person identifiers, and use governed "
    "relationship records instead of duplicating parent, guardian, spouse, sibling, or dependent names."
)
registry_path.write_text(json.dumps(registry, indent=2) + "\n")

package_path = Path("packages/people/package.json")
package = json.loads(package_path.read_text())
package["version"] = "0.2.0"
package["description"] = (
    "Reusable NEWAX People and Person Relationships Registry foundation module."
)
package_path.write_text(json.dumps(package, indent=2) + "\n")
Path("packages/people/VERSION").write_text("0.2.0\n")

readme_path = Path("packages/people/README.md")
readme = readme_path.read_text()
readme = replace_once(readme, "Version: `0.1.0`", "Version: `0.2.0`", "README version")
readme = replace_once(
    readme,
    "The People module maintains one stable identity record for each real person used across NEWAX business infrastructure.",
    "The People module maintains one stable identity record for each real person and governed, tenant-scoped relationships between people used across NEWAX business infrastructure.",
    "README purpose",
)
readme = replace_once(
    readme,
    "- Identity validation and duplicate-sensitive identifier assignment.\n- A bounded current-person self-profile projection.",
    "- Identity validation and duplicate-sensitive identifier assignment.\n- Tenant-scoped person relationships such as parent, guardian, spouse, sibling, and dependent links.\n- Relationship validity, verification, provenance, and cycle protection.\n- A bounded current-person self-profile projection.",
    "README owned concepts",
)
readme = replace_once(
    readme,
    "- `core_person_identifiers`\n\nThe module does not own",
    "- `core_person_identifiers`\n- `core_person_relationships`\n\nThe module does not own",
    "README database ownership",
)
relationship_rules = textwrap.dedent(
    '''
    ## Person relationship rules

    A relationship is stored once as a directed statement from one person to another.

    Example:

    ```text
    Iqbal Hussain -- parent_of / father / biological --> Zahra Iqbal
    ```

    The relationship record stores only person identifiers and relationship meaning. CNIC, CRC, passport, and other official identifier values remain in `core_person_identifiers` and are never copied into the relationship row.

    Database rules:

    - Every relationship belongs to one Tenant so family and dependency information cannot leak across customers.
    - Source and target must be two different people.
    - `relationship_type` defines direction, such as `parent_of`, `guardian_of`, `spouse_of`, `sibling_of`, or `dependent_of`.
    - `relationship_role` adds human meaning where needed, such as `father`, `mother`, `parent`, or `legal_guardian`.
    - `relationship_basis` records the basis, such as `biological`, `adoptive`, `step`, `legal`, or `declared`.
    - One current active duplicate of the same directed relationship, role, and basis is allowed.
    - Validity end dates cannot precede start dates.
    - Verified relationships require a verification time and source; unverified relationships cannot claim a verification actor or time.
    - Active `parent_of` relationships cannot create ancestry cycles, including concurrent writes within the same Tenant.
    - A family relationship never grants organization membership, login access, a role, or a permission.
    - `source_reference` is an optional opaque evidence reference. It must not be used to duplicate a person's CNIC or CRC.

    The database stores the relationship foundation only. Service operations, authorization, HTTP exposure, reciprocal-display rules, and evidence-file linking remain separate controlled slices.

    '''
)
readme = replace_once(
    readme,
    "## Events\n",
    relationship_rules + "## Events\n",
    "README relationship section",
)
readme = replace_once(
    readme,
    "- Identifier verification and event publication.\n- Successful current-person",
    "- Identifier verification and event publication.\n- Person-relationship schema ownership and migration constraint coverage.\n- Successful current-person",
    "README testing",
)
readme = replace_once(
    readme,
    "- Only the bounded authenticated current-person read endpoint is exposed.",
    "- Person relationships currently have no service or HTTP operations.\n- Reciprocal display, symmetric-relation canonicalization, and evidence-file linking remain deferred.\n- Only the bounded authenticated current-person read endpoint is exposed.",
    "README limitations",
)
readme_path.write_text(readme)

changelog_path = Path("packages/people/CHANGELOG.md")
changelog = changelog_path.read_text()
changelog = replace_once(
    changelog,
    "### Added\n\n- Bounded `CurrentPersonRequestContext`",
    "### Added\n\n- Tenant-scoped `CorePersonRelationship` storage for family, guardian, spouse, sibling, dependent, and other directed person links.\n- Relationship role, basis, validity, verification, verifier, and source-reference fields.\n- Database protection against self-links, invalid validity ranges, inconsistent verification, duplicate current relationships, and active parentage cycles.\n- Focused schema and migration regression tests.\n- Bounded `CurrentPersonRequestContext`",
    "CHANGELOG added",
)
changelog = replace_once(
    changelog,
    "### Database\n\n- Reuses the existing `core_people`",
    "### Database\n\n- Adds `core_person_relationships` as a People-owned, Tenant-scoped relationship registry.\n- Keeps official identifiers in `core_person_identifiers` rather than duplicating them in family links.\n- Reuses the existing `core_people`",
    "CHANGELOG database",
)
changelog_path.write_text(changelog)

explain_path = Path("tooling/database-registry/explain.js")
explain = explain_path.read_text()
guide = textwrap.dedent(
    '''
        CorePersonRelationship: [
          'Person relationship',
          'A governed connection between two real people, stored once without copying either person or their official identifiers.',
          'A parent linked to a child, or a legal guardian linked to a dependent.',
          'people',
        ],
    '''
)
explain = replace_once(
    explain,
    "    CoreUser: [",
    guide + "    CoreUser: [",
    "relationship guide",
)
explain = replace_once(
    explain,
    "      'Stores real human beings and the business identifiers used to recognize them.',",
    "      'Stores real human beings, the identifiers used to recognize them, and governed relationships such as parent, guardian, spouse, sibling, and dependent.',",
    "people category description",
)
journey = textwrap.dedent(
    '''
        [
          'How a family relationship avoids duplicate people',
          'Each human is stored once. A tenant-scoped relationship links two existing people, while CNIC, CRC, passport, and other identifiers remain attached to the correct person.',
          ['CoreTenant', 'CorePerson', 'CorePersonIdentifier', 'CorePersonRelationship'],
        ],
    '''
)
explain = replace_once(
    explain,
    "    [\n      'How sign-in remains separate from the human record',",
    journey + "    [\n      'How sign-in remains separate from the human record',",
    "family journey",
)
overrides = textwrap.dedent(
    '''
          'CorePersonRelationship.tenant':
            'A person relationship belongs to one customer account, keeping sensitive family links inside the correct Tenant.',
          'CorePersonRelationship.sourcePerson':
            'The source person starts the directed relationship, such as the parent in a parent-of link.',
          'CorePersonRelationship.targetPerson':
            'The target person receives the directed relationship, such as the child in a parent-of link.',
          'CorePersonRelationship.verifiedByUser':
            'A verified relationship may record which authorized user completed verification.',
    '''
)
explain = replace_once(
    explain,
    "      'CorePerson.user':",
    overrides + "      'CorePerson.user':",
    "relationship sentence overrides",
)
explain_path.write_text(explain)

test_path = Path("apps/api/src/database/person-relationship-schema.spec.ts")
test_path.write_text(
    textwrap.dedent(
        '''
        import { readFileSync } from 'node:fs';
        import { resolve } from 'node:path';

        import { describe, expect, it } from 'vitest';

        const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
        const migration = readFileSync(
          resolve(
            process.cwd(),
            'prisma/migrations/20260715190000_add_person_relationship_foundation/migration.sql',
          ),
          'utf8',
        );

        describe('person relationship database foundation', () => {
          it('registers the tenant-scoped person relationship model', () => {
            expect(schema).toContain('model CorePersonRelationship');
            expect(schema).toContain('tenantId');
            expect(schema).toContain('sourcePersonId');
            expect(schema).toContain('targetPersonId');
            expect(schema).toContain('relationshipType');
            expect(schema).toContain('relationshipRole');
            expect(schema).toContain('relationshipBasis');
            expect(schema).toContain('verificationSource');
            expect(schema).toContain('@@map("core_person_relationships")');
          });

          it('enforces relational, temporal, verification, duplicate, and cycle integrity', () => {
            expect(migration).toContain('core_person_relationships_distinct_people_check');
            expect(migration).toContain('core_person_relationships_validity_check');
            expect(migration).toContain('core_person_relationships_verification_check');
            expect(migration).toContain('core_person_relationships_active_identity_key');
            expect(migration).toContain('core_person_relationships_tenant_id_fkey');
            expect(migration).toContain('core_person_relationships_source_person_id_fkey');
            expect(migration).toContain('core_person_relationships_target_person_id_fkey');
            expect(migration).toContain('pg_advisory_xact_lock');
            expect(migration).toContain('core_person_relationships_parent_cycle_trigger');
          });
        });
        '''
    ).lstrip()
)
