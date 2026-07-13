import json
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path}, found {count}")
    file.write_text(text.replace(old, new, 1))


schema_path = Path('apps/api/prisma/schema.prisma')
schema = schema_path.read_text()
if schema.count('  organizationRelationships CoreOrganizationRelationship[]\n') != 1:
    raise SystemExit('Unexpected CoreTenant relation layout.')
schema = schema.replace(
    '  organizationRelationships CoreOrganizationRelationship[]\n',
    '  organizationRelationships CoreOrganizationRelationship[]\n  objects                   CoreObject[]\n',
    1,
)
old_object = '''model CoreObject {
  id                   String    @id @default(uuid()) @db.Uuid
  objectTypeId         String    @map("object_type_id") @db.Uuid
  owningOrganizationId String    @map("owning_organization_id") @db.Uuid
  parentObjectId       String?   @map("parent_object_id") @db.Uuid
  name                 String    @db.VarChar(255)
  referenceCode        String?   @map("reference_code") @db.VarChar(128)
  serialNumber         String?   @map("serial_number") @db.VarChar(128)
  status               String    @default("active") @db.VarChar(32)
  description          String?   @db.Text
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime? @map("deleted_at") @db.Timestamptz(6)

  objectType         CoreObjectType         @relation(fields: [objectTypeId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  owningOrganization CoreOrganization       @relation("ObjectOwningOrganization", fields: [owningOrganizationId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  parentObject       CoreObject?            @relation("ObjectHierarchy", fields: [parentObjectId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  childObjects       CoreObject[]           @relation("ObjectHierarchy")
  assignments        CoreObjectAssignment[]
  objectAddresses    CoreObjectAddress[]

  @@unique([owningOrganizationId, referenceCode])
  @@index([objectTypeId, status])
  @@index([parentObjectId])
  @@map("core_objects")
}'''
new_object = '''model CoreObject {
  id                   String    @id @default(uuid()) @db.Uuid
  tenantId             String    @map("tenant_id") @db.Uuid
  objectTypeId         String    @map("object_type_id") @db.Uuid
  owningOrganizationId String    @map("owning_organization_id") @db.Uuid
  parentObjectId       String?   @map("parent_object_id") @db.Uuid
  name                 String    @db.VarChar(255)
  referenceCode        String?   @map("reference_code") @db.VarChar(128)
  serialNumber         String?   @map("serial_number") @db.VarChar(128)
  status               String    @default("active") @db.VarChar(32)
  description          String?   @db.Text
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime? @map("deleted_at") @db.Timestamptz(6)

  tenant             CoreTenant             @relation(fields: [tenantId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  objectType         CoreObjectType         @relation(fields: [objectTypeId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  owningOrganization CoreOrganization       @relation("ObjectOwningOrganization", fields: [tenantId, owningOrganizationId], references: [tenantId, id], onDelete: Restrict, onUpdate: Cascade)
  parentObject       CoreObject?            @relation("ObjectHierarchy", fields: [tenantId, parentObjectId], references: [tenantId, id], onDelete: Restrict, onUpdate: Cascade)
  childObjects       CoreObject[]           @relation("ObjectHierarchy")
  assignments        CoreObjectAssignment[]
  objectAddresses    CoreObjectAddress[]

  @@unique([tenantId, id])
  @@unique([owningOrganizationId, referenceCode])
  @@index([tenantId, owningOrganizationId, objectTypeId, status])
  @@index([tenantId, parentObjectId])
  @@map("core_objects")
}'''
if schema.count(old_object) != 1:
    raise SystemExit('Expected one CoreObject model to replace.')
schema_path.write_text(schema.replace(old_object, new_object, 1))

package_path = Path('apps/api/package.json')
package = json.loads(package_path.read_text())
marker = 'pnpm --filter @newax/addresses build && '
if marker not in package['scripts']['build:foundation']:
    raise SystemExit('Addresses build marker not found.')
package['scripts']['build:foundation'] = package['scripts']['build:foundation'].replace(
    marker,
    marker + 'pnpm --filter @newax/objects build && ',
    1,
)
package['dependencies']['@newax/objects'] = 'workspace:*'
package['dependencies'] = dict(sorted(package['dependencies'].items()))
package_path.write_text(json.dumps(package, indent=2) + '\n')

replace_once(
    'apps/api/src/app.module.ts',
    "import { OrganizationsModule } from './organizations/organizations.module';\n",
    "import { ObjectsModule } from './objects/objects.module';\nimport { OrganizationsModule } from './organizations/organizations.module';\n",
)
replace_once(
    'apps/api/src/app.module.ts',
    '    AddressesModule,\n',
    '    AddressesModule,\n    ObjectsModule,\n',
)

registry_path = Path('registry/module-registry.json')
registry = json.loads(registry_path.read_text())
if registry['registry_version'] != '0.1.11':
    raise SystemExit('Unexpected registry version.')
registry['registry_version'] = '0.1.12'
registry['last_updated'] = '2026-07-13'
if any(module['module_key'] == 'objects' for module in registry['modules']):
    raise SystemExit('Objects registry entry already exists.')
index = next(i for i, module in enumerate(registry['modules']) if module['module_key'] == 'addresses') + 1
registry['modules'].insert(index, {
    'module_name': 'Objects',
    'module_key': 'objects',
    'module_layer': 'foundation',
    'module_version': '0.1.0',
    'module_status': 'draft',
    'module_owner': 'NEWAX Engineering',
    'description': 'Maintains Tenant-owned identity for individually identifiable non-human entities such as vehicles, devices, equipment, facilities, rooms, machines, sensors, and property units.',
    'dependencies': [
        {'module_key': 'tenants', 'version': '>=0.1.0'},
        {'module_key': 'organizations', 'version': '>=0.2.0'},
    ],
    'required_permissions': ['objects.types.manage', 'objects.create', 'objects.view'],
    'exposed_events': ['object.type_registered', 'object.created'],
    'consumed_events': [],
    'configuration_options': [],
    'database_ownership': ['core_object_types', 'core_objects'],
    'tenant_scope': 'tenant_and_current_organization_scoped',
    'documentation_path': 'packages/objects/README.md',
    'changelog_path': 'packages/objects/CHANGELOG.md',
    'compatibility_notes': 'Object Types are global reusable definitions. Object instances carry immutable tenant_id and owning_organization_id. Assignments, locations, transfers, lifecycle operations, domain extensions, and HTTP endpoints remain deferred.',
})
registry_path.write_text(json.dumps(registry, indent=2) + '\n')

replace_once(
    'docs/decisions/README.md',
    '| [ADR 0029](0029-build-current-organization-addresses-http-api.md)         | Accepted | Expose bounded current-Organization address creation and listing without accepting client-supplied Tenant or Organization authority.             |\n',
    '| [ADR 0029](0029-build-current-organization-addresses-http-api.md)         | Accepted | Expose bounded current-Organization address creation and listing without accepting client-supplied Tenant or Organization authority.             |\n| [ADR 0030](0030-build-object-registry-foundation.md)                     | Accepted | Establish Tenant-safe Object Type registration and current-Organization Object creation and listing.                                             |\n',
)
replace_once(
    'docs/decisions/README.md',
    'The ADRs form a deliberate sequence rather than twenty-nine independent opinions wandering around the repository unsupervised.',
    'The ADRs form a deliberate sequence rather than thirty independent opinions wandering around the repository unsupervised.',
)
replace_once(
    'docs/decisions/README.md',
    '- ADR 0029 exposes those Organization address operations through strict trusted-context HTTP contracts without exposing canonical-registry internals.\n',
    '- ADR 0029 exposes those Organization address operations through strict trusted-context HTTP contracts without exposing canonical-registry internals.\n- ADR 0030 establishes Tenant-safe Object identity and same-Tenant hierarchy while deferring assignments, locations, lifecycle operations, and HTTP exposure.\n',
)
