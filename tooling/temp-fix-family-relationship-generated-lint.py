from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


repository_path = Path('apps/api/src/people/prisma-person-relationship.repository.ts')
repository = repository_path.read_text()
repository = replace_once(
    repository,
    "import type { Prisma } from '../generated/prisma/client';\n",
    '',
    'unused Prisma import',
)
repository_path.write_text(repository)

service_path = Path('packages/people/src/services/person-relationship.service.ts')
service = service_path.read_text()
service = replace_once(
    service,
    "import type { PersonRelationshipEventPublisher } from '../events/person-relationship-event';",
    "import type {\n  PersonRelationshipEventName,\n  PersonRelationshipEventPublisher,\n} from '../events/person-relationship-event';",
    'relationship event imports',
)
service = replace_once(
    service,
    "import { PEOPLE_PERMISSIONS, type PeoplePermission } from '../permissions/people-permissions';",
    "import { PEOPLE_PERMISSIONS, type PeoplePermission } from '../permissions/people-permissions';\nimport type { PersonIdentifierRecord, PersonRecord } from '../types/person';",
    'person type imports',
)
service = service.replace("import('../types/person').PersonRecord", 'PersonRecord')
service = service.replace("import('../types/person').PersonIdentifierRecord", 'PersonIdentifierRecord')
service = service.replace(
    "import('../events/person-relationship-event').PersonRelationshipEventName",
    'PersonRelationshipEventName',
)
service_path.write_text(service)
