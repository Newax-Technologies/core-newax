-- CreateTable
CREATE TABLE "core_authentication_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "identity_fingerprint" CHAR(64) NOT NULL,
    "outcome" VARCHAR(64) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_authentication_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "core_user_credentials_user_id_credential_type_key" ON "core_user_credentials"("user_id", "credential_type");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_user_id_occurred_at_idx" ON "core_authentication_attempts"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_identity_fingerprint_occurred_at_idx" ON "core_authentication_attempts"("identity_fingerprint", "occurred_at");

-- CreateIndex
CREATE INDEX "core_authentication_attempts_outcome_occurred_at_idx" ON "core_authentication_attempts"("outcome", "occurred_at");

-- AddForeignKey
ALTER TABLE "core_authentication_attempts" ADD CONSTRAINT "core_authentication_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
