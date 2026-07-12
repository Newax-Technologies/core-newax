-- CreateTable
CREATE TABLE "core_http_rate_limit_buckets" (
    "key_hash" CHAR(64) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "core_http_rate_limit_buckets_pkey" PRIMARY KEY ("key_hash")
);

-- CreateIndex
CREATE INDEX "core_http_rate_limit_buckets_reset_at_idx" ON "core_http_rate_limit_buckets"("reset_at");
