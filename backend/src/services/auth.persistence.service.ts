import { PrismaClient, Prisma } from '@prisma/client';
import { UserCredential, RefreshToken } from '../types/auth.js';
import { prisma as defaultPrisma } from '../database/client.js';
import { hashToken, createAccessToken, createRefreshToken } from '../utils/token.js';
import { runWithTransactionRetry } from '../utils/transaction.js';
import { env } from '../config/env.js';

// -----------------------------------------------------------------------------
// Discriminated Union Return Types
// -----------------------------------------------------------------------------

export type RotationResult =
  | {
      status: 'SUCCESS';
      accessToken: string;
      newRefreshToken: string;
      userId: string;
      familyId: string;
    }
  | {
      status: 'REUSE_DETECTED';
      userId: string;
      familyId: string;
    }
  | {
      status: 'FAMILY_ALREADY_REVOKED';
      userId: string;
      familyId: string;
      presentedReason: string | null;
    }
  | {
      status: 'USER_SUSPENDED';
      userId: string;
      familyId: string;
    }
  | {
      status: 'USER_INACTIVE';
      userId: string;
      familyId: string;
    }
  | {
      status: 'TOKEN_EXPIRED';
      userId?: string;
      familyId?: string;
    }
  | {
      status: 'TOKEN_NOT_FOUND';
    };

export type LogoutResult =
  | { status: 'SUCCESS'; affectedCount: number }
  | { status: 'USER_NOT_FOUND' }
  | { status: 'FAMILY_NOT_FOUND' }
  | { status: 'FORBIDDEN' };

export type ChangePasswordResult =
  | { status: 'SUCCESS'; revokedTokensCount: number }
  | { status: 'USER_NOT_FOUND' };

export type SuspendUserResult =
  | { status: 'SUCCESS'; revokedTokensCount: number }
  | { status: 'USER_NOT_FOUND' };

// -----------------------------------------------------------------------------
// Strongly Typed Prisma Client & Delegate Interfaces
// -----------------------------------------------------------------------------

/**
 * Strongly typed delegate interface for Prisma UserCredential model operations.
 * Mirrors Prisma's generated UserCredentialDelegate with full compile-time validation.
 */
export interface UserCredentialDelegate {
  create(args: {
    data: {
      userId: string;
      passwordHash: string;
      passwordChangedAt?: Date;
    };
  }): Promise<UserCredential>;

  findUnique(args: {
    where: {
      userId: string;
    };
  }): Promise<UserCredential | null>;
}

/**
 * Strongly typed delegate interface for Prisma RefreshToken model operations.
 * Mirrors Prisma's generated RefreshTokenDelegate with full compile-time validation.
 */
export interface RefreshTokenDelegate {
  create(args: {
    data: {
      userId: string;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
      isRevoked?: boolean;
      consumedAt?: Date | null;
      revokedAt?: Date | null;
      revocationReason?: string | null;
    };
  }): Promise<RefreshToken>;
}

/**
 * Properly typed Prisma database client interface for authentication persistence operations.
 * Integrates PrismaClient or TransactionClient with typed model delegates, guaranteeing
 * type safety in all development environments without relying on Language Server cache state.
 */
export type AuthDatabaseClient = (PrismaClient | Prisma.TransactionClient) & {
  userCredential: UserCredentialDelegate;
  refreshToken: RefreshTokenDelegate;
};

// -----------------------------------------------------------------------------
// Credential Persistence Functions
// -----------------------------------------------------------------------------

/**
 * Creates a new credential record for a user.
 * Validates inputs and maps to `user_credentials` table.
 *
 * @param userId - Target user identifier UUID
 * @param passwordHash - Stored Argon2id hash string
 * @param client - Optional Prisma client or transaction client
 */
export async function createUserCredential(
  userId: string,
  passwordHash: string,
  client: AuthDatabaseClient = defaultPrisma as unknown as AuthDatabaseClient
): Promise<UserCredential> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID must be a non-empty string');
  }
  if (!passwordHash || typeof passwordHash !== 'string') {
    throw new Error('Password hash must be a non-empty string');
  }

  return await client.userCredential.create({
    data: {
      userId,
      passwordHash
    }
  });
}

/**
 * Retrieves a user's credential record by user ID.
 * Returns null if no credential exists.
 *
 * @param userId - Unique user identifier UUID
 * @param client - Optional Prisma client or transaction client
 */
export async function getUserCredentialByUserId(
  userId: string,
  client: AuthDatabaseClient = defaultPrisma as unknown as AuthDatabaseClient
): Promise<UserCredential | null> {
  if (!userId || typeof userId !== 'string') {
    return null;
  }

  return await client.userCredential.findUnique({
    where: { userId }
  });
}

/**
 * Atomically updates a user's password and revokes all active refresh tokens.
 * Enforces Tier 1 (users) -> Tier 2 (refresh_tokens) -> Tier 3 (user_credentials) lock hierarchy.
 * Asserts exactly 1 credential row updated; aborts transaction if assertion fails.
 *
 * @param userId - Unique user identifier UUID
 * @param newPasswordHash - New Argon2id password hash
 * @param db - Optional PrismaClient for dependency injection
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string,
  db: PrismaClient = defaultPrisma
): Promise<ChangePasswordResult> {
  if (!userId || !newPasswordHash) {
    throw new Error('User ID and new password hash are required');
  }

  return await runWithTransactionRetry('updateUserPassword', () =>
    db.$transaction(async (tx) => {
      // Tier 1: User lock FOR UPDATE
      const userRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${userId}::uuid
        FOR UPDATE;
      `;

      if (userRows.length === 0) {
        return { status: 'USER_NOT_FOUND' };
      }

      // Tier 2: Deterministic multi-row lock & revoke all active refresh tokens
      const lockedTokens = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "refresh_tokens"
        WHERE "user_id" = ${userId}::uuid
          AND "is_revoked" = false
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      let revokedTokensCount = 0;
      if (lockedTokens.length > 0) {
        revokedTokensCount = await tx.$executeRaw`
          UPDATE "refresh_tokens"
          SET "is_revoked" = true,
              "revoked_at" = NOW(),
              "revocation_reason" = 'PASSWORD_CHANGED'
          WHERE "user_id" = ${userId}::uuid
            AND "is_revoked" = false;
        `;
      }

      // Tier 3: Update user_credentials and assert exactly 1 row updated
      const affected = await tx.$executeRaw`
        UPDATE "user_credentials"
        SET "password_hash" = ${newPasswordHash},
            "password_changed_at" = NOW(),
            "updated_at" = NOW()
        WHERE "user_id" = ${userId}::uuid;
      `;

      if (affected !== 1) {
        throw new Error(
          `CREDENTIAL_UPDATE_ABORT: Expected exactly 1 credential row updated for user ${userId}, got ${affected}`
        );
      }

      return { status: 'SUCCESS', revokedTokensCount };
    })
  );
}

// -----------------------------------------------------------------------------
// Refresh Token Record Persistence Functions
// -----------------------------------------------------------------------------

/**
 * Creates a refresh token persistence record using ONLY the token hash.
 * Raw refresh tokens must NEVER be passed or stored.
 *
 * @param userId - Target user UUID
 * @param tokenHash - 64-character hex-encoded SHA-256 digest
 * @param familyId - Rotation family UUID
 * @param expiresAt - Expiration timestamp
 * @param client - Optional Prisma client or transaction client
 */
export async function createRefreshTokenRecord(
  userId: string,
  tokenHash: string,
  familyId: string,
  expiresAt: Date,
  client: AuthDatabaseClient = defaultPrisma as unknown as AuthDatabaseClient
): Promise<RefreshToken> {
  if (!userId || !familyId || !tokenHash || !expiresAt) {
    throw new Error('userId, tokenHash, familyId, and expiresAt are required');
  }

  // Enforce 64-character hex hash format
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) {
    throw new Error('tokenHash must be a 64-character lowercase hexadecimal SHA-256 string');
  }

  return await client.refreshToken.create({
    data: {
      userId,
      tokenHash,
      familyId,
      expiresAt,
      isRevoked: false
    }
  });
}

// -----------------------------------------------------------------------------
// Atomic Refresh Token Rotation & Invariant Sweep
// -----------------------------------------------------------------------------

/**
 * Rotates a refresh token atomically under strict single-use semantics.
 * - Enforces lock order: Tier 1 (users FOR SHARE) -> Tier 2 (family tokens ORDER BY id ASC FOR UPDATE).
 * - Detects confirmed reuse (consumed token re-presented) and revokes the entire family with REUSE_DETECTED.
 * - Handles already-revoked tokens by preserving the existing row and sweeping surviving siblings with FAMILY_REVOKED.
 * - Evaluates account suspension early and revokes all user tokens with ACCOUNT_SUSPENDED.
 * - Issues a replacement token and marks the presented token consumed in the same transaction.
 *
 * @param rawPresentedToken - Raw JWT refresh token string presented by client
 * @param clientIp - Optional client IP for audit logging
 * @param userAgent - Optional client user-agent for audit logging
 * @param db - Optional PrismaClient for dependency injection
 */
export async function rotateRefreshToken(
  rawPresentedToken: string,
  clientIp = 'unknown',
  userAgent = 'unknown',
  db: PrismaClient = defaultPrisma
): Promise<RotationResult> {
  if (!rawPresentedToken || typeof rawPresentedToken !== 'string') {
    return { status: 'TOKEN_NOT_FOUND' };
  }

  const presentedHash = hashToken(rawPresentedToken);

  return await runWithTransactionRetry('rotateRefreshToken', () =>
    db.$transaction(async (tx) => {
      // Step 0: Untrusted candidate lookup by token hash
      const candidates = await tx.$queryRaw<Array<{ id: string; user_id: string; family_id: string }>>`
        SELECT "id", "user_id", "family_id"
        FROM "refresh_tokens"
        WHERE "token_hash" = ${presentedHash}
        LIMIT 1;
      `;

      const candidate = candidates[0];
      if (!candidate) {
        return { status: 'TOKEN_NOT_FOUND' };
      }

      // Tier 1: User lock FOR SHARE
      const userRows = await tx.$queryRaw<Array<{ id: string; email: string | null; status: string }>>`
        SELECT "id", "email", "status"
        FROM "users"
        WHERE "id" = ${candidate.user_id}::uuid
        FOR SHARE;
      `;

      const user = userRows[0];
      if (!user) {
        return { status: 'TOKEN_NOT_FOUND' };
      }

      // Early Non-Active Gate: If user is not ACTIVE (SUSPENDED or INACTIVE), revoke ALL user refresh tokens
      if (user.status !== 'ACTIVE') {
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "refresh_tokens"
          WHERE "user_id" = ${user.id}::uuid
            AND "is_revoked" = false
          ORDER BY "id" ASC
          FOR UPDATE;
        `;

        await tx.$executeRaw`
          UPDATE "refresh_tokens"
          SET "is_revoked" = true,
              "revoked_at" = NOW(),
              "revocation_reason" = 'ACCOUNT_SUSPENDED'
          WHERE "user_id" = ${user.id}::uuid
            AND "is_revoked" = false;
        `;

        return {
          status: user.status === 'INACTIVE' ? 'USER_INACTIVE' : 'USER_SUSPENDED',
          userId: user.id,
          familyId: candidate.family_id
        };
      }

      // Tier 2: Deterministic multi-row lock on the entire candidate family (ORDER BY id ASC)
      const lockedFamilyTokens = await tx.$queryRaw<Array<{
        id: string;
        user_id: string;
        family_id: string;
        token_hash: string;
        is_revoked: boolean;
        consumed_at: Date | null;
        revoked_at: Date | null;
        revocation_reason: string | null;
        expires_at: Date;
      }>>`
        SELECT "id", "user_id", "family_id", "token_hash", "is_revoked",
               "consumed_at", "revoked_at", "revocation_reason", "expires_at"
        FROM "refresh_tokens"
        WHERE "family_id" = ${candidate.family_id}::uuid
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      const token = lockedFamilyTokens.find((t) => t.token_hash === presentedHash);

      // Revalidate candidate metadata against locked rows
      if (!token || token.user_id !== user.id) {
        return { status: 'TOKEN_NOT_FOUND' };
      }

      // Branch A: Expired Token
      if (new Date(token.expires_at) <= new Date()) {
        return { status: 'TOKEN_EXPIRED', userId: user.id, familyId: token.family_id };
      }

      // Branch B: Already Revoked Token (Dead Family)
      // Family tokens are ALREADY locked; sweep surviving unrevoked siblings with FAMILY_REVOKED
      if (token.is_revoked) {
        await tx.$executeRaw`
          UPDATE "refresh_tokens"
          SET "is_revoked" = true,
              "revoked_at" = NOW(),
              "revocation_reason" = 'FAMILY_REVOKED'
          WHERE "family_id" = ${token.family_id}::uuid
            AND "is_revoked" = false;
        `;

        return {
          status: 'FAMILY_ALREADY_REVOKED',
          userId: user.id,
          familyId: token.family_id,
          presentedReason: token.revocation_reason
        };
      }

      // Branch C: Confirmed Reuse Detected (Consumed and unrevoked token presented again)
      // Family tokens are ALREADY locked; revoke the entire family with REUSE_DETECTED
      if (token.consumed_at !== null) {
        await tx.$executeRaw`
          UPDATE "refresh_tokens"
          SET "is_revoked" = true,
              "revoked_at" = NOW(),
              "revocation_reason" = 'REUSE_DETECTED'
          WHERE "family_id" = ${token.family_id}::uuid
            AND "is_revoked" = false;
        `;

        return { status: 'REUSE_DETECTED', userId: user.id, familyId: token.family_id };
      }

      // Branch D: Legitimate Rotation (Active, Unconsumed & Valid)
      // 1. Consume presented token (mark consumed, NOT revoked)
      await tx.$executeRaw`
        UPDATE "refresh_tokens"
        SET "consumed_at" = NOW()
        WHERE "id" = ${token.id}::uuid;
      `;

      // 2. Generate child refresh token in the same family
      const childRefresh = await createRefreshToken(user.id, token.family_id);
      const childHash = hashToken(childRefresh.token);
      const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_LIFETIME_SEC * 1000);

      // 3. Insert child refresh token record
      await tx.$executeRaw`
        INSERT INTO "refresh_tokens" (
          "id", "user_id", "token_hash", "family_id", "is_revoked",
          "consumed_at", "revoked_at", "revocation_reason", "expires_at", "created_at"
        ) VALUES (
          gen_random_uuid(), ${user.id}::uuid, ${childHash}, ${token.family_id}::uuid, false,
          NULL, NULL, NULL, ${newExpiresAt}, NOW()
        );
      `;

      // 4. Issue new access token
      const newAccessToken = await createAccessToken(user.id, {
        email: user.email ?? undefined
      });

      return {
        status: 'SUCCESS',
        accessToken: newAccessToken,
        newRefreshToken: childRefresh.token,
        userId: user.id,
        familyId: token.family_id
      };
    })
  );
}

// -----------------------------------------------------------------------------
// Revocation Operations
// -----------------------------------------------------------------------------

/**
 * Revokes an entire refresh-token family upon user logout.
 * - Tier 1: User lock FOR SHARE.
 * - Tier 2: Family lock ORDER BY id ASC FOR UPDATE.
 * - Validates authenticated user ownership of the family.
 *
 * @param userId - Authenticated user UUID
 * @param familyId - Target family UUID to revoke
 * @param db - Optional PrismaClient for dependency injection
 */
export async function revokeFamilyOnLogout(
  userId: string,
  familyId: string,
  db: PrismaClient = defaultPrisma
): Promise<LogoutResult> {
  if (!userId || !familyId) {
    throw new Error('User ID and Family ID are required');
  }

  return await runWithTransactionRetry('revokeFamilyOnLogout', () =>
    db.$transaction(async (tx) => {
      // Tier 1: User lock FOR SHARE
      const userRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${userId}::uuid
        FOR SHARE;
      `;

      if (userRows.length === 0) {
        return { status: 'USER_NOT_FOUND' };
      }

      // Tier 2: Deterministic multi-row lock on family tokens
      const familyTokens = await tx.$queryRaw<Array<{ id: string; user_id: string }>>`
        SELECT "id", "user_id"
        FROM "refresh_tokens"
        WHERE "family_id" = ${familyId}::uuid
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      if (familyTokens.length === 0) {
        return { status: 'FAMILY_NOT_FOUND' };
      }

      // Ownership check: Prevent cross-user family revocation
      if (familyTokens[0].user_id !== userId) {
        return { status: 'FORBIDDEN' };
      }

      // Revoke all unrevoked tokens in this family
      const affected = await tx.$executeRaw`
        UPDATE "refresh_tokens"
        SET "is_revoked" = true,
            "revoked_at" = NOW(),
            "revocation_reason" = 'LOGOUT'
        WHERE "family_id" = ${familyId}::uuid
          AND "is_revoked" = false;
      `;

      return { status: 'SUCCESS', affectedCount: affected };
    })
  );
}

/**
 * Administratively suspends a user and revokes all active refresh tokens across all families.
 * - Tier 1: Updates users.status = 'SUSPENDED' FOR UPDATE.
 * - Tier 2: Locks all user tokens ORDER BY id ASC FOR UPDATE and revokes with ACCOUNT_SUSPENDED.
 *
 * @param targetUserId - Target user UUID to suspend
 * @param db - Optional PrismaClient for dependency injection
 */
export async function suspendUserAndRevokeSessions(
  targetUserId: string,
  db: PrismaClient = defaultPrisma
): Promise<SuspendUserResult> {
  if (!targetUserId) {
    throw new Error('Target user ID is required');
  }

  return await runWithTransactionRetry('suspendUserAndRevokeSessions', () =>
    db.$transaction(async (tx) => {
      // Tier 1: User lock & status mutation FOR UPDATE
      const updatedUsers = await tx.$executeRaw`
        UPDATE "users"
        SET "status" = 'SUSPENDED',
            "updated_at" = NOW()
        WHERE "id" = ${targetUserId}::uuid;
      `;

      if (updatedUsers !== 1) {
        return { status: 'USER_NOT_FOUND' };
      }

      // Tier 2: Deterministic multi-row lock & revoke ALL user refresh tokens
      const lockedTokens = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "refresh_tokens"
        WHERE "user_id" = ${targetUserId}::uuid
          AND "is_revoked" = false
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      let revokedCount = 0;
      if (lockedTokens.length > 0) {
        revokedCount = await tx.$executeRaw`
          UPDATE "refresh_tokens"
          SET "is_revoked" = true,
              "revoked_at" = NOW(),
              "revocation_reason" = 'ACCOUNT_SUSPENDED'
          WHERE "user_id" = ${targetUserId}::uuid
            AND "is_revoked" = false;
        `;
      }

      return { status: 'SUCCESS', revokedTokensCount: revokedCount };
    })
  );
}
