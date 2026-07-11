-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "core_organizations" (
    "id" UUID NOT NULL,
    "parent_organization_id" UUID,
    "legal_name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "organization_type" VARCHAR(64) NOT NULL,
    "registration_number" VARCHAR(128),
    "tax_number" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "core_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_organization_relationships" (
    "id" UUID NOT NULL,
    "source_organization_id" UUID NOT NULL,
    "target_organization_id" UUID NOT NULL,
    "relationship_type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_organization_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_people" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(128) NOT NULL,
    "middle_name" VARCHAR(128),
    "last_name" VARCHAR(128) NOT NULL,
    "preferred_name" VARCHAR(128),
    "date_of_birth" DATE,
    "gender" VARCHAR(32),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "core_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_person_identifiers" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "identifier_type" VARCHAR(64) NOT NULL,
    "identifier_value" VARCHAR(255) NOT NULL,
    "issuing_authority" VARCHAR(255),
    "issuing_country_code" CHAR(2),
    "valid_from" DATE,
    "valid_until" DATE,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_person_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_users" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'invited',
    "last_login_at" TIMESTAMPTZ(6),
    "locked_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "core_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_user_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "identity_type" VARCHAR(32) NOT NULL,
    "identity_value" VARCHAR(320) NOT NULL,
    "normalized_value" VARCHAR(320) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_user_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credential_type" VARCHAR(32) NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_token_hash" VARCHAR(128) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_memberships" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "membership_type" VARCHAR(64) NOT NULL,
    "reference_number" VARCHAR(128),
    "job_title" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "role_type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(160) NOT NULL,
    "module_code" VARCHAR(64) NOT NULL,
    "resource" VARCHAR(96) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "risk_level" VARCHAR(32) NOT NULL DEFAULT 'standard',
    "description" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "effect" VARCHAR(16) NOT NULL DEFAULT 'allow',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "core_membership_roles" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by_user_id" UUID,
    "revoked_by_user_id" UUID,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_membership_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_contact_methods" (
    "id" UUID NOT NULL,
    "contact_type" VARCHAR(32) NOT NULL,
    "contact_value" VARCHAR(320) NOT NULL,
    "normalized_value" VARCHAR(320) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_contact_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_person_contact_methods" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "contact_method_id" UUID NOT NULL,
    "label" VARCHAR(64),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_person_contact_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_organization_contact_methods" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_method_id" UUID NOT NULL,
    "label" VARCHAR(64),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_organization_contact_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_addresses" (
    "id" UUID NOT NULL,
    "line_1" VARCHAR(255) NOT NULL,
    "line_2" VARCHAR(255),
    "locality" VARCHAR(128),
    "city" VARCHAR(128) NOT NULL,
    "district" VARCHAR(128),
    "province" VARCHAR(128),
    "postal_code" VARCHAR(32),
    "country_code" CHAR(2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_person_addresses" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "address_type" VARCHAR(32) NOT NULL,
    "label" VARCHAR(64),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_person_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_organization_addresses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "address_type" VARCHAR(32) NOT NULL,
    "label" VARCHAR(64),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_organization_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_object_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(96) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "category" VARCHAR(96),
    "description" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_object_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_objects" (
    "id" UUID NOT NULL,
    "object_type_id" UUID NOT NULL,
    "owning_organization_id" UUID NOT NULL,
    "parent_object_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "reference_code" VARCHAR(128),
    "serial_number" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "core_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_object_assignments" (
    "id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "assignment_type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "assigned_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_object_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_object_addresses" (
    "id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "address_type" VARCHAR(32) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_object_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_files" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "storage_provider" VARCHAR(64) NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "checksum" VARCHAR(128) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "actor_user_id" UUID,
    "module_code" VARCHAR(64) NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "entity_type" VARCHAR(128) NOT NULL,
    "entity_id" VARCHAR(128),
    "outcome" VARCHAR(32) NOT NULL DEFAULT 'success',
    "sensitivity" VARCHAR(32) NOT NULL DEFAULT 'standard',
    "previous_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "correlation_id" UUID,
    "request_id" VARCHAR(128),
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_external_references" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "domain_code" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(128) NOT NULL,
    "entity_id" VARCHAR(128) NOT NULL,
    "external_system" VARCHAR(128) NOT NULL,
    "external_key" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_external_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "core_organizations_parent_organization_id_idx" ON "core_organizations"("parent_organization_id");

-- CreateIndex
CREATE INDEX "core_organizations_organization_type_status_idx" ON "core_organizations"("organization_type", "status");

-- CreateIndex
CREATE INDEX "core_organizations_display_name_idx" ON "core_organizations"("display_name");

-- CreateIndex
CREATE INDEX "core_organization_relationships_source_organization_id_rela_idx" ON "core_organization_relationships"("source_organization_id", "relationship_type", "status");

-- CreateIndex
CREATE INDEX "core_organization_relationships_target_organization_id_rela_idx" ON "core_organization_relationships"("target_organization_id", "relationship_type", "status");

-- CreateIndex
CREATE INDEX "core_people_last_name_first_name_idx" ON "core_people"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "core_people_status_idx" ON "core_people"("status");

-- CreateIndex
CREATE INDEX "core_person_identifiers_identifier_type_identifier_value_idx" ON "core_person_identifiers"("identifier_type", "identifier_value");

-- CreateIndex
CREATE UNIQUE INDEX "core_person_identifiers_person_id_identifier_type_identifie_key" ON "core_person_identifiers"("person_id", "identifier_type", "identifier_value");

-- CreateIndex
CREATE UNIQUE INDEX "core_users_person_id_key" ON "core_users"("person_id");

-- CreateIndex
CREATE INDEX "core_users_status_idx" ON "core_users"("status");

-- CreateIndex
CREATE INDEX "core_user_identities_user_id_is_primary_idx" ON "core_user_identities"("user_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "core_user_identities_identity_type_normalized_value_key" ON "core_user_identities"("identity_type", "normalized_value");

-- CreateIndex
CREATE INDEX "core_user_credentials_user_id_credential_type_status_idx" ON "core_user_credentials"("user_id", "credential_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_user_sessions_session_token_hash_key" ON "core_user_sessions"("session_token_hash");

-- CreateIndex
CREATE INDEX "core_user_sessions_user_id_status_expires_at_idx" ON "core_user_sessions"("user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "core_memberships_person_id_status_idx" ON "core_memberships"("person_id", "status");

-- CreateIndex
CREATE INDEX "core_memberships_organization_id_membership_type_status_idx" ON "core_memberships"("organization_id", "membership_type", "status");

-- CreateIndex
CREATE INDEX "core_roles_role_type_status_idx" ON "core_roles"("role_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_roles_organization_id_code_key" ON "core_roles"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "core_permissions_code_key" ON "core_permissions"("code");

-- CreateIndex
CREATE INDEX "core_permissions_module_code_resource_action_idx" ON "core_permissions"("module_code", "resource", "action");

-- CreateIndex
CREATE INDEX "core_permissions_status_idx" ON "core_permissions"("status");

-- CreateIndex
CREATE INDEX "core_role_permissions_permission_id_idx" ON "core_role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "core_membership_roles_membership_id_valid_until_revoked_at_idx" ON "core_membership_roles"("membership_id", "valid_until", "revoked_at");

-- CreateIndex
CREATE INDEX "core_membership_roles_role_id_idx" ON "core_membership_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_contact_methods_contact_type_normalized_value_key" ON "core_contact_methods"("contact_type", "normalized_value");

-- CreateIndex
CREATE INDEX "core_person_contact_methods_person_id_is_primary_status_idx" ON "core_person_contact_methods"("person_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_person_contact_methods_person_id_contact_method_id_lab_key" ON "core_person_contact_methods"("person_id", "contact_method_id", "label");

-- CreateIndex
CREATE INDEX "core_organization_contact_methods_organization_id_is_primar_idx" ON "core_organization_contact_methods"("organization_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_organization_contact_methods_organization_id_contact_m_key" ON "core_organization_contact_methods"("organization_id", "contact_method_id", "label");

-- CreateIndex
CREATE INDEX "core_addresses_country_code_province_city_idx" ON "core_addresses"("country_code", "province", "city");

-- CreateIndex
CREATE INDEX "core_person_addresses_person_id_is_primary_status_idx" ON "core_person_addresses"("person_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_person_addresses_person_id_address_id_address_type_key" ON "core_person_addresses"("person_id", "address_id", "address_type");

-- CreateIndex
CREATE INDEX "core_organization_addresses_organization_id_is_primary_stat_idx" ON "core_organization_addresses"("organization_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_organization_addresses_organization_id_address_id_addr_key" ON "core_organization_addresses"("organization_id", "address_id", "address_type");

-- CreateIndex
CREATE UNIQUE INDEX "core_object_types_code_key" ON "core_object_types"("code");

-- CreateIndex
CREATE INDEX "core_object_types_category_status_idx" ON "core_object_types"("category", "status");

-- CreateIndex
CREATE INDEX "core_objects_object_type_id_status_idx" ON "core_objects"("object_type_id", "status");

-- CreateIndex
CREATE INDEX "core_objects_parent_object_id_idx" ON "core_objects"("parent_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_objects_owning_organization_id_reference_code_key" ON "core_objects"("owning_organization_id", "reference_code");

-- CreateIndex
CREATE INDEX "core_object_assignments_object_id_status_valid_until_idx" ON "core_object_assignments"("object_id", "status", "valid_until");

-- CreateIndex
CREATE INDEX "core_object_assignments_membership_id_status_idx" ON "core_object_assignments"("membership_id", "status");

-- CreateIndex
CREATE INDEX "core_object_addresses_object_id_is_primary_status_idx" ON "core_object_addresses"("object_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_object_addresses_object_id_address_id_address_type_key" ON "core_object_addresses"("object_id", "address_id", "address_type");

-- CreateIndex
CREATE INDEX "core_files_organization_id_status_created_at_idx" ON "core_files"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "core_files_storage_provider_storage_key_key" ON "core_files"("storage_provider", "storage_key");

-- CreateIndex
CREATE INDEX "core_audit_logs_organization_id_created_at_idx" ON "core_audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "core_audit_logs_actor_user_id_created_at_idx" ON "core_audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "core_audit_logs_module_code_action_created_at_idx" ON "core_audit_logs"("module_code", "action", "created_at");

-- CreateIndex
CREATE INDEX "core_audit_logs_entity_type_entity_id_idx" ON "core_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "core_audit_logs_correlation_id_idx" ON "core_audit_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "core_external_references_domain_code_entity_type_entity_id_idx" ON "core_external_references"("domain_code", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_external_references_organization_id_external_system_ex_key" ON "core_external_references"("organization_id", "external_system", "external_key");

-- AddForeignKey
ALTER TABLE "core_organizations" ADD CONSTRAINT "core_organizations_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_relationships" ADD CONSTRAINT "core_organization_relationships_source_organization_id_fkey" FOREIGN KEY ("source_organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_relationships" ADD CONSTRAINT "core_organization_relationships_target_organization_id_fkey" FOREIGN KEY ("target_organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_person_identifiers" ADD CONSTRAINT "core_person_identifiers_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "core_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_users" ADD CONSTRAINT "core_users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "core_people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_identities" ADD CONSTRAINT "core_user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_credentials" ADD CONSTRAINT "core_user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_sessions" ADD CONSTRAINT "core_user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_memberships" ADD CONSTRAINT "core_memberships_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "core_people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_memberships" ADD CONSTRAINT "core_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_roles" ADD CONSTRAINT "core_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "core_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_membership_roles" ADD CONSTRAINT "core_membership_roles_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "core_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_membership_roles" ADD CONSTRAINT "core_membership_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_membership_roles" ADD CONSTRAINT "core_membership_roles_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_membership_roles" ADD CONSTRAINT "core_membership_roles_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_person_contact_methods" ADD CONSTRAINT "core_person_contact_methods_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "core_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_person_contact_methods" ADD CONSTRAINT "core_person_contact_methods_contact_method_id_fkey" FOREIGN KEY ("contact_method_id") REFERENCES "core_contact_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_contact_methods" ADD CONSTRAINT "core_organization_contact_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_contact_methods" ADD CONSTRAINT "core_organization_contact_methods_contact_method_id_fkey" FOREIGN KEY ("contact_method_id") REFERENCES "core_contact_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_person_addresses" ADD CONSTRAINT "core_person_addresses_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "core_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_person_addresses" ADD CONSTRAINT "core_person_addresses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "core_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_addresses" ADD CONSTRAINT "core_organization_addresses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organization_addresses" ADD CONSTRAINT "core_organization_addresses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "core_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_objects" ADD CONSTRAINT "core_objects_object_type_id_fkey" FOREIGN KEY ("object_type_id") REFERENCES "core_object_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_objects" ADD CONSTRAINT "core_objects_owning_organization_id_fkey" FOREIGN KEY ("owning_organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_objects" ADD CONSTRAINT "core_objects_parent_object_id_fkey" FOREIGN KEY ("parent_object_id") REFERENCES "core_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_object_assignments" ADD CONSTRAINT "core_object_assignments_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "core_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_object_assignments" ADD CONSTRAINT "core_object_assignments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "core_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_object_assignments" ADD CONSTRAINT "core_object_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_object_addresses" ADD CONSTRAINT "core_object_addresses_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "core_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_object_addresses" ADD CONSTRAINT "core_object_addresses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "core_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_files" ADD CONSTRAINT "core_files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_files" ADD CONSTRAINT "core_files_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_external_references" ADD CONSTRAINT "core_external_references_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

