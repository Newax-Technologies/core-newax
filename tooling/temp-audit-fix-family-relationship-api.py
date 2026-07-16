from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


schema_path = Path('apps/api/prisma/schema.prisma')
schema = schema_path.read_text()
schema = replace_once(
    schema,
    '@relation("PersonRelationshipVerificationRevokedBy", fields: [verificationRevokedByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)',
    '@relation("PersonRelationshipVerificationRevokedBy", fields: [verificationRevokedByUserId], references: [id], onDelete: Restrict, onUpdate: Cascade)',
    'verification revoker delete policy',
)
schema_path.write_text(schema)

migration_path = Path(
    'apps/api/prisma/migrations/20260717010000_govern_person_relationship_operations/migration.sql'
)
migration = migration_path.read_text()
migration = replace_once(
    migration,
    'ON DELETE SET NULL ON UPDATE CASCADE;',
    'ON DELETE RESTRICT ON UPDATE CASCADE;',
    'verification revoker foreign key policy',
)
migration_path.write_text(migration)

spec_path = Path('apps/api/src/database/person-relationship-operations-schema.spec.ts')
spec = spec_path.read_text()
spec = replace_once(
    spec,
    "    expect(migration).toContain('verification_revoked_by_user_id_fkey');",
    "    expect(migration).toContain('verification_revoked_by_user_id_fkey');\n    expect(migration).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');\n    expect(schema).toContain('onDelete: Restrict');",
    'verification revoker regression assertions',
)
spec_path.write_text(spec)

adr_path = Path('docs/decisions/0026-govern-family-relationship-operations-and-sensitive-reads.md')
adr = adr_path.read_text()
adr = replace_once(
    adr,
    'A relationship is Tenant-owned. HTTP access additionally requires that every person included in the requested Organization family view is reachable through an active Organization membership or through an Organization-scoped approved intake/application record. This prevents an Organization user from exploring unrelated people merely because their Tenant owns both records.\n\nThe exact reachability query and tests must be implemented before this ADR becomes Accepted.',
    'A relationship is Tenant-owned. A current-Organization family graph must begin at a root person who has an active membership in that Organization. The graph may then traverse active Tenant-owned relationships to relatives who are not Organization members. A relationship mutation requires at least one endpoint to have an active membership in the current Organization. This allows legitimate parent, child, guardian, spouse, sibling, and dependent records without granting Organization users a way to select an unrelated Tenant-owned family as the starting point.\n\nThe reachability query and its service tests are part of this slice. Approved-intake reachability may be added later when approved intakes can be canonically applied.',
    'ADR organization scope',
)
adr_path.write_text(adr)
