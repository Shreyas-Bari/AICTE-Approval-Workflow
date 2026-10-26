import { describe, it, expect } from 'vitest';
import { prisma } from '../src/database/client.js';
import * as fs from 'fs';
import * as path from 'path';

describe('CP-9 Credential and Refresh-Token Persistence Schema & Migration', () => {
  describe('Prisma Client Model Delegates', () => {
    it('should expose userCredential delegate on PrismaClient', () => {
      expect(prisma.userCredential).toBeDefined();
      expect(typeof prisma.userCredential.create).toBe('function');
      expect(typeof prisma.userCredential.findUnique).toBe('function');
      expect(typeof prisma.userCredential.update).toBe('function');
      expect(typeof prisma.userCredential.delete).toBe('function');
    });

    it('should expose refreshToken delegate on PrismaClient', () => {
      expect(prisma.refreshToken).toBeDefined();
      expect(typeof prisma.refreshToken.create).toBe('function');
      expect(typeof prisma.refreshToken.findUnique).toBe('function');
      expect(typeof prisma.refreshToken.update).toBe('function');
      expect(typeof prisma.refreshToken.delete).toBe('function');
      expect(typeof prisma.refreshToken.findMany).toBe('function');
    });
  });

  describe('Offline Migration SQL Validation (add_auth_credentials_and_tokens)', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../prisma/migrations/add_auth_credentials_and_tokens/migration.sql'
    );

    it('should exist as an offline migration file', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('should contain accurate DDL for user_credentials and refresh_tokens', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Table creations
      expect(sql).toContain('CREATE TABLE "user_credentials"');
      expect(sql).toContain('CREATE TABLE "refresh_tokens"');

      // user_credentials columns
      expect(sql).toContain('"password_hash" TEXT NOT NULL');
      expect(sql).toContain('"password_changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP');

      // refresh_tokens columns & single-use rotation fields
      expect(sql).toContain('"token_hash" VARCHAR(64) NOT NULL');
      expect(sql).toContain('"family_id" UUID NOT NULL');
      expect(sql).toContain('"is_revoked" BOOLEAN NOT NULL DEFAULT false');
      expect(sql).toContain('"consumed_at" TIMESTAMPTZ');
      expect(sql).toContain('"revoked_at" TIMESTAMPTZ');
      expect(sql).toContain('"revocation_reason" TEXT');
      expect(sql).toContain('"expires_at" TIMESTAMPTZ NOT NULL');

      // Unique indexes
      expect(sql).toContain('CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials"("user_id")');
      expect(sql).toContain('CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash")');

      // Performance indexes
      expect(sql).toContain('CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id")');
      expect(sql).toContain('CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id")');
      expect(sql).toContain('CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at")');

      // Foreign keys with CASCADE
      expect(sql).toContain('REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    it('should contain all three required PostgreSQL CHECK constraints', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // 1. Hash format check: exactly 64 lowercase hex characters
      expect(sql).toContain('refresh_tokens_token_hash_format_check');
      expect(sql).toContain('length("token_hash") = 64');
      expect(sql).toContain("^[a-f0-9]{64}$");

      // 2. Token expiry strictly after creation check
      expect(sql).toContain('refresh_tokens_expiry_after_created_check');
      expect(sql).toContain('"expires_at" > "created_at"');

      // 3. Bi-directional revocation consistency check
      expect(sql).toContain('refresh_tokens_revocation_consistency_check');
      expect(sql).toContain('"is_revoked" = false AND "revoked_at" IS NULL AND "revocation_reason" IS NULL');
      expect(sql).toContain('"is_revoked" = true AND "revoked_at" IS NOT NULL AND "revocation_reason" IS NOT NULL');
    });
  });
});
