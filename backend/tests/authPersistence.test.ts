import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createUserCredential,
  getUserCredentialByUserId,
  updateUserPassword,
  createRefreshTokenRecord,
  rotateRefreshToken,
  revokeFamilyOnLogout,
  suspendUserAndRevokeSessions
} from '../src/services/auth.persistence.service.js';
import { createRefreshToken, hashToken } from '../src/utils/token.js';

describe('Auth Persistence Service (Decision Q-01 / CP-9)', () => {
  let mockPrisma: any;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      userCredential: {
        create: vi.fn(),
        findUnique: vi.fn()
      },
      refreshToken: {
        create: vi.fn()
      }
    };

    mockPrisma = {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => await cb(mockTx)),
      userCredential: {
        create: vi.fn(),
        findUnique: vi.fn()
      },
      refreshToken: {
        create: vi.fn()
      }
    };
  });

  describe('User Credential Persistence', () => {
    it('should successfully create a user credential record', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const passwordHash = '$argon2id$v=19$m=19456,t=2,p=1$dummy$dummy';

      mockPrisma.userCredential.create.mockResolvedValue({
        id: 'cred-1',
        userId,
        passwordHash,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await createUserCredential(userId, passwordHash, mockPrisma);
      expect(result.userId).toBe(userId);
      expect(result.passwordHash).toBe(passwordHash);
      expect(mockPrisma.userCredential.create).toHaveBeenCalledWith({
        data: { userId, passwordHash }
      });
    });

    it('should reject credential creation with empty userId or passwordHash', async () => {
      await expect(createUserCredential('', 'hash', mockPrisma)).rejects.toThrow();
      await expect(createUserCredential('user-1', '', mockPrisma)).rejects.toThrow();
    });

    it('should retrieve a user credential record by userId', async () => {
      const userId = 'user-test-123';
      mockPrisma.userCredential.findUnique.mockResolvedValue({
        id: 'cred-1',
        userId,
        passwordHash: 'hash-val'
      });

      const cred = await getUserCredentialByUserId(userId, mockPrisma);
      expect(cred).not.toBeNull();
      expect(cred?.userId).toBe(userId);
      expect(mockPrisma.userCredential.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
    });

    it('should return null when credential is not found or userId is invalid', async () => {
      mockPrisma.userCredential.findUnique.mockResolvedValue(null);

      expect(await getUserCredentialByUserId('missing-user', mockPrisma)).toBeNull();
      expect(await getUserCredentialByUserId('', mockPrisma)).toBeNull();
    });
  });

  describe('Password Update & User-Wide Revocation (updateUserPassword)', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const newHash = '$argon2id$v=19$m=19456,t=2,p=1$new$hash';

    it('should return USER_NOT_FOUND if user does not exist in Tier 1 lock query', async () => {
      // Tier 1 returns empty
      mockTx.$queryRaw.mockResolvedValueOnce([]);

      const result = await updateUserPassword(userId, newHash, mockPrisma);
      expect(result.status).toBe('USER_NOT_FOUND');
    });

    it('should successfully update password and revoke all active tokens', async () => {
      // Tier 1: User found
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId }]);
      // Tier 2: 2 active tokens locked
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1' }, { id: 'tok-2' }]);
      // Tier 2: UPDATE refresh_tokens sets 2 rows
      mockTx.$executeRaw.mockResolvedValueOnce(2);
      // Tier 3: UPDATE user_credentials sets 1 row
      mockTx.$executeRaw.mockResolvedValueOnce(1);

      const result = await updateUserPassword(userId, newHash, mockPrisma);
      expect(result.status).toBe('SUCCESS');
      if (result.status === 'SUCCESS') {
        expect(result.revokedTokensCount).toBe(2);
      }
    });

    it('should abort and rollback transaction if credential update affects 0 rows', async () => {
      // Tier 1: User found
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId }]);
      // Tier 2: No active tokens
      mockTx.$queryRaw.mockResolvedValueOnce([]);
      // Tier 3: UPDATE user_credentials affects 0 rows (anomaly)
      mockTx.$executeRaw.mockResolvedValueOnce(0);

      await expect(updateUserPassword(userId, newHash, mockPrisma)).rejects.toThrow(
        'CREDENTIAL_UPDATE_ABORT'
      );
    });
  });

  describe('Refresh Token Record Creation (createRefreshTokenRecord)', () => {
    it('should create a refresh token record with valid 64-character SHA-256 hash', async () => {
      const userId = 'user-1';
      const familyId = 'family-1';
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 60000);

      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'tok-1',
        userId,
        tokenHash,
        familyId,
        expiresAt,
        isRevoked: false
      });

      const record = await createRefreshTokenRecord(
        userId,
        tokenHash,
        familyId,
        expiresAt,
        mockPrisma
      );
      expect(record.tokenHash).toBe(tokenHash);
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          tokenHash,
          familyId,
          expiresAt,
          isRevoked: false
        }
      });
    });

    it('should reject refresh token record creation if tokenHash is not 64-character lowercase hex', async () => {
      const expiresAt = new Date(Date.now() + 60000);

      // Too short
      await expect(
        createRefreshTokenRecord('user-1', 'abc', 'fam-1', expiresAt, mockPrisma)
      ).rejects.toThrow('64-character');

      // Non-hex
      await expect(
        createRefreshTokenRecord('user-1', 'z'.repeat(64), 'fam-1', expiresAt, mockPrisma)
      ).rejects.toThrow('64-character');

      // Uppercase hex
      await expect(
        createRefreshTokenRecord('user-1', 'A'.repeat(64), 'fam-1', expiresAt, mockPrisma)
      ).rejects.toThrow('64-character');
    });
  });

  describe('Atomic Single-Use Refresh Token Rotation (rotateRefreshToken)', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440002';
    const familyId = '550e8400-e29b-41d4-a716-446655440003';

    it('should return TOKEN_NOT_FOUND when token string is empty or candidate lookup returns empty', async () => {
      expect(await rotateRefreshToken('', 'ip', 'ua', mockPrisma)).toEqual({
        status: 'TOKEN_NOT_FOUND'
      });

      mockTx.$queryRaw.mockResolvedValueOnce([]); // Candidate lookup returns empty
      expect(await rotateRefreshToken('some-raw-token', 'ip', 'ua', mockPrisma)).toEqual({
        status: 'TOKEN_NOT_FOUND'
      });
    });

    it('should return TOKEN_NOT_FOUND when user record is not found in Tier 1', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      mockTx.$queryRaw.mockResolvedValueOnce([]); // User not found

      expect(await rotateRefreshToken('valid-raw-token', 'ip', 'ua', mockPrisma)).toEqual({
        status: 'TOKEN_NOT_FOUND'
      });
    });

    it('should trigger early suspension gate and revoke all user tokens when user is SUSPENDED', async () => {
      const { token } = await createRefreshToken(userId, familyId);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User is SUSPENDED
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'test@aicte.in', status: 'SUSPENDED' }]);
      // User tokens lock query
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1' }, { id: 'tok-other-fam' }]);
      // Revoke execution
      mockTx.$executeRaw.mockResolvedValueOnce(2);

      const result = await rotateRefreshToken(token, 'ip', 'ua', mockPrisma);
      expect(result.status).toBe('USER_SUSPENDED');
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('newRefreshToken');
      expect(mockTx.$executeRaw).toHaveBeenCalled();
    });

    it('should deny rotation, revoke user tokens, and issue no replacement tokens when user is INACTIVE', async () => {
      const { token } = await createRefreshToken(userId, familyId);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User is INACTIVE
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'inactive@aicte.in', status: 'INACTIVE' }]);
      // User tokens lock query
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1' }, { id: 'tok-inactive-fam' }]);
      // Revoke execution
      mockTx.$executeRaw.mockResolvedValueOnce(2);

      const result = await rotateRefreshToken(token, 'ip', 'ua', mockPrisma);

      // 1. Inactive account denied rotation with USER_INACTIVE status
      expect(result.status).toBe('USER_INACTIVE');

      // 2. No replacement refresh token or access token is issued
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('newRefreshToken');

      // 3. User tokens locked deterministically and revoked with ACCOUNT_SUSPENDED
      expect(mockTx.$queryRaw).toHaveBeenCalledTimes(3);
      expect(mockTx.$executeRaw).toHaveBeenCalled();
    });

    it('should return TOKEN_EXPIRED when token expires_at is in the past', async () => {
      const { token } = await createRefreshToken(userId, familyId);
      const hash = hashToken(token);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User ACTIVE
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'test@aicte.in', status: 'ACTIVE' }]);
      // Tier 2: Family lock returning expired token
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 'tok-1',
          user_id: userId,
          family_id: familyId,
          token_hash: hash,
          is_revoked: false,
          consumed_at: null,
          revoked_at: null,
          revocation_reason: null,
          expires_at: new Date(Date.now() - 10000) // Past
        }
      ]);

      const result = await rotateRefreshToken(token, 'ip', 'ua', mockPrisma);
      expect(result.status).toBe('TOKEN_EXPIRED');
    });

    it('should sweep surviving siblings with FAMILY_REVOKED when presenting an already-revoked token', async () => {
      const { token } = await createRefreshToken(userId, familyId);
      const hash = hashToken(token);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User ACTIVE
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'test@aicte.in', status: 'ACTIVE' }]);
      // Tier 2: Family lock returning already-revoked token (e.g. LOGOUT)
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 'tok-1',
          user_id: userId,
          family_id: familyId,
          token_hash: hash,
          is_revoked: true,
          consumed_at: null,
          revoked_at: new Date(),
          revocation_reason: 'LOGOUT',
          expires_at: new Date(Date.now() + 60000)
        }
      ]);

      const result = await rotateRefreshToken(token, 'ip', 'ua', mockPrisma);
      expect(result.status).toBe('FAMILY_ALREADY_REVOKED');
      if (result.status === 'FAMILY_ALREADY_REVOKED') {
        expect(result.presentedReason).toBe('LOGOUT');
      }
      expect(mockTx.$executeRaw).toHaveBeenCalled();
    });

    it('should trigger confirmed reuse detection and revoke family when presenting a consumed token', async () => {
      const { token } = await createRefreshToken(userId, familyId);
      const hash = hashToken(token);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User ACTIVE
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'test@aicte.in', status: 'ACTIVE' }]);
      // Tier 2: Family lock returning consumed token (consumed_at !== null)
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 'tok-1',
          user_id: userId,
          family_id: familyId,
          token_hash: hash,
          is_revoked: false,
          consumed_at: new Date(), // Already rotated!
          revoked_at: null,
          revocation_reason: null,
          expires_at: new Date(Date.now() + 60000)
        }
      ]);

      const result = await rotateRefreshToken(token, 'ip', 'ua', mockPrisma);
      expect(result.status).toBe('REUSE_DETECTED');
      expect(mockTx.$executeRaw).toHaveBeenCalled();
    });

    it('should successfully rotate an active, unconsumed token', async () => {
      const { token } = await createRefreshToken(userId, familyId);
      const hash = hashToken(token);

      // Step 0: Candidate lookup
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId, family_id: familyId }]);
      // Tier 1: User ACTIVE
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId, email: 'user@aicte.gov.in', status: 'ACTIVE' }]);
      // Tier 2: Family lock returning active token
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 'tok-1',
          user_id: userId,
          family_id: familyId,
          token_hash: hash,
          is_revoked: false,
          consumed_at: null,
          revoked_at: null,
          revocation_reason: null,
          expires_at: new Date(Date.now() + 60000)
        }
      ]);
      // Consume update
      mockTx.$executeRaw.mockResolvedValueOnce(1);
      // Child token insert
      mockTx.$executeRaw.mockResolvedValueOnce(1);

      const result = await rotateRefreshToken(token, '127.0.0.1', 'Vitest', mockPrisma);
      expect(result.status).toBe('SUCCESS');
      if (result.status === 'SUCCESS') {
        expect(result.accessToken).toBeDefined();
        expect(result.newRefreshToken).toBeDefined();
        expect(result.familyId).toBe(familyId);
        expect(result.userId).toBe(userId);
      }
    });
  });

  describe('Family Logout Revocation (revokeFamilyOnLogout)', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440004';
    const familyId = '550e8400-e29b-41d4-a716-446655440005';

    it('should return USER_NOT_FOUND if user does not exist in Tier 1', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([]); // User not found
      const result = await revokeFamilyOnLogout(userId, familyId, mockPrisma);
      expect(result.status).toBe('USER_NOT_FOUND');
    });

    it('should return FAMILY_NOT_FOUND if family has no tokens in Tier 2', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId }]); // User found
      mockTx.$queryRaw.mockResolvedValueOnce([]); // Family empty
      const result = await revokeFamilyOnLogout(userId, familyId, mockPrisma);
      expect(result.status).toBe('FAMILY_NOT_FOUND');
    });

    it('should return FORBIDDEN if family belongs to another user', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId }]); // User found
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: 'other-user-uuid' }]);

      const result = await revokeFamilyOnLogout(userId, familyId, mockPrisma);
      expect(result.status).toBe('FORBIDDEN');
    });

    it('should successfully revoke family tokens with LOGOUT', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: userId }]); // User found
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1', user_id: userId }]);
      mockTx.$executeRaw.mockResolvedValueOnce(1);

      const result = await revokeFamilyOnLogout(userId, familyId, mockPrisma);
      expect(result.status).toBe('SUCCESS');
      if (result.status === 'SUCCESS') {
        expect(result.affectedCount).toBe(1);
      }
    });
  });

  describe('Administrative Account Suspension (suspendUserAndRevokeSessions)', () => {
    const targetUserId = '550e8400-e29b-41d4-a716-446655440006';

    it('should return USER_NOT_FOUND if user update affects 0 rows', async () => {
      mockTx.$executeRaw.mockResolvedValueOnce(0); // 0 rows updated
      const result = await suspendUserAndRevokeSessions(targetUserId, mockPrisma);
      expect(result.status).toBe('USER_NOT_FOUND');
    });

    it('should successfully suspend user and revoke all refresh tokens across all families', async () => {
      mockTx.$executeRaw.mockResolvedValueOnce(1); // User updated to SUSPENDED
      mockTx.$queryRaw.mockResolvedValueOnce([{ id: 'tok-1' }, { id: 'tok-2' }]); // 2 tokens locked
      mockTx.$executeRaw.mockResolvedValueOnce(2); // 2 tokens revoked with ACCOUNT_SUSPENDED

      const result = await suspendUserAndRevokeSessions(targetUserId, mockPrisma);
      expect(result.status).toBe('SUCCESS');
      if (result.status === 'SUCCESS') {
        expect(result.revokedTokensCount).toBe(2);
      }
    });
  });
});
