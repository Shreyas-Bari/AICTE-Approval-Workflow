-- Migration: add_auth_credentials_and_tokens
-- Generated offline for Phase 3 Checkpoint 9 (CP-9).
-- Target Database: Neon PostgreSQL
-- Decision Reference: Decision Q-01 Option B / CP-9 Persistence Design
-- DO NOT EXECUTE AGAINST LIVE DATABASE WITHOUT OWNER AUTHORIZATION.

-- CreateTable: user_credentials
CREATE TABLE "user_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "family_id" UUID NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "consumed_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "revocation_reason" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique 1:1 relation between User and UserCredential
CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials"("user_id");

-- CreateIndex: Unique SHA-256 token hash lookup
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex: Performance indexes on refresh_tokens
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey: user_credentials -> users(id) ON DELETE CASCADE
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: refresh_tokens -> users(id) ON DELETE CASCADE
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints: refresh_tokens integrity constraints

-- 1. Token hash format: exactly 64 lowercase hexadecimal characters (SHA-256 digest)
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_format_check"
    CHECK (length("token_hash") = 64 AND "token_hash" ~ '^[a-f0-9]{64}$');

-- 2. Token expiry must be strictly later than creation timestamp
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_expiry_after_created_check"
    CHECK ("expires_at" > "created_at");

-- 3. Revocation consistency:
-- If is_revoked = false, both revoked_at and revocation_reason must be NULL.
-- If is_revoked = true, both revoked_at and revocation_reason must be non-NULL.
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_revocation_consistency_check"
    CHECK (
        ("is_revoked" = false AND "revoked_at" IS NULL AND "revocation_reason" IS NULL) OR
        ("is_revoked" = true AND "revoked_at" IS NOT NULL AND "revocation_reason" IS NOT NULL)
    );
