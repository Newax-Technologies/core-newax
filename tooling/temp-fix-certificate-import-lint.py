from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


def replace_pattern_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return updated


types_path = Path('packages/people-intake/src/types/certificate-import.ts')
types = types_path.read_text()
types = replace_once(
    types,
    'export interface CertificateEvidenceRequestContext extends PeopleIntakeRequestContext {}',
    'export type CertificateEvidenceRequestContext = PeopleIntakeRequestContext;',
    'certificate context alias',
)
types_path.write_text(types)

controller_path = Path(
    'apps/api/src/people-intake/current-organization-certificate-imports.controller.ts'
)
controller = controller_path.read_text()
controller = replace_once(
    controller,
    "import { CertificateImportService, PEOPLE_INTAKE_PERMISSIONS } from '@newax/people-intake';",
    "import {\n  CertificateImportService,\n  PEOPLE_INTAKE_PERMISSIONS,\n  type CertificateImportRecord,\n  type EvidenceFileSummary,\n} from '@newax/people-intake';",
    'controller contract imports',
)
controller = replace_once(
    controller,
    '  private evidence(item: any) {',
    '  private evidence(item: EvidenceFileSummary) {',
    'evidence projection type',
)
controller = replace_once(
    controller,
    '  private importRecord(item: any) {',
    '  private importRecord(item: CertificateImportRecord) {',
    'import projection type',
)
controller_path.write_text(controller)

repository_path = Path('apps/api/src/people-intake/prisma-certificate-import.repository.ts')
repository = repository_path.read_text()
repository = replace_once(
    repository,
    "import { PrismaService } from '../database/prisma.service';",
    "import type { Prisma } from '../generated/prisma/client';\nimport { PrismaService } from '../database/prisma.service';\n\ntype EvidenceWithFileAndImport = Prisma.CorePeopleIntakeEvidenceGetPayload<{\n  include: { file: true; certificateImports: true };\n}>;\n\ntype ImportWithEvidenceAndIntake = Prisma.CoreCertificateImportGetPayload<{\n  include: { evidence: { include: { intake: true } } };\n}>;",
    'Prisma payload aliases',
)
repository = replace_pattern_once(
    repository,
    r'^(\s*)payload,\n(\s*)personCount: payload\.people\.length,',
    r'\1payload: payload as unknown as Prisma.InputJsonValue,\n\2personCount: payload.people.length,',
    'Prisma JSON payload conversion',
)
repository = replace_once(
    repository,
    '  private evidence(record: any): EvidenceFileSummary {',
    '  private evidence(record: EvidenceWithFileAndImport): EvidenceFileSummary {',
    'repository evidence payload type',
)
repository = replace_once(
    repository,
    '  private importRecord(record: any): CertificateImportRecord {',
    '  private importRecord(record: ImportWithEvidenceAndIntake): CertificateImportRecord {',
    'repository import payload type',
)
repository_path.write_text(repository)
