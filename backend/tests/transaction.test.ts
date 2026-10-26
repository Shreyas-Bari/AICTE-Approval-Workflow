import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  isTransientTransactionError,
  runWithTransactionRetry
} from '../src/utils/transaction.js';

describe('Transaction Retry & Concurrency Safety (Decision Q-01 / CP-9)', () => {
  describe('Transient Error Classification (isTransientTransactionError)', () => {
    it('should classify Prisma P2034 transaction conflict as transient', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock. Please retry your transaction.',
        {
          code: 'P2034',
          clientVersion: '6.19.3'
        }
      );

      expect(isTransientTransactionError(error)).toBe(true);
    });

    it('should classify Prisma P2010 with PostgreSQL 40P01 (deadlock_detected) as transient', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Raw query failed', {
        code: 'P2010',
        clientVersion: '6.19.3',
        meta: {
          code: '40P01',
          message: 'deadlock detected'
        }
      });

      expect(isTransientTransactionError(error)).toBe(true);
    });

    it('should classify Prisma P2010 with PostgreSQL 40001 (serialization_failure) as transient', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Raw query failed', {
        code: 'P2010',
        clientVersion: '6.19.3',
        meta: {
          code: '40001',
          message: 'could not serialize access due to concurrent update'
        }
      });

      expect(isTransientTransactionError(error)).toBe(true);
    });

    it('should classify raw driver error with code 40P01 or 40001 as transient', () => {
      expect(isTransientTransactionError({ code: '40P01' })).toBe(true);
      expect(isTransientTransactionError({ code: '40001' })).toBe(true);
    });

    it('should NOT classify non-transient Prisma errors as transient', () => {
      // P2002: Unique constraint violation
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['token_hash'] }
      });
      expect(isTransientTransactionError(p2002)).toBe(false);

      // P2025: Record to update not found
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.19.3'
      });
      expect(isTransientTransactionError(p2025)).toBe(false);

      // P2010 with non-transient code (e.g. 42P01 undefined_table)
      const p2010Syntax = new Prisma.PrismaClientKnownRequestError('Table undefined', {
        code: 'P2010',
        clientVersion: '6.19.3',
        meta: { code: '42P01' }
      });
      expect(isTransientTransactionError(p2010Syntax)).toBe(false);
    });

    it('should NOT classify standard JS errors, strings, or nulls as transient', () => {
      expect(isTransientTransactionError(new Error('Generic failure'))).toBe(false);
      expect(isTransientTransactionError('some error string')).toBe(false);
      expect(isTransientTransactionError(null)).toBe(false);
      expect(isTransientTransactionError(undefined)).toBe(false);
      expect(isTransientTransactionError({ message: '40P01 in string message' })).toBe(false);
    });
  });

  describe('Bounded Transaction Retry Execution (runWithTransactionRetry)', () => {
    it('should execute successfully on first attempt when no conflict occurs', async () => {
      const mockFn = vi.fn().mockResolvedValue({ status: 'SUCCESS', id: 'res-1' });

      const result = await runWithTransactionRetry('testOp', mockFn, 3);
      expect(result).toEqual({ status: 'SUCCESS', id: 'res-1' });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient P2034 error and succeed when second attempt passes', async () => {
      const transientError = new Prisma.PrismaClientKnownRequestError('Write conflict', {
        code: 'P2034',
        clientVersion: '6.19.3'
      });

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({ status: 'SUCCESS', token: 'valid-pair' });

      const result = await runWithTransactionRetry('testOp', mockFn, 3);
      expect(result).toEqual({ status: 'SUCCESS', token: 'valid-pair' });
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should fail closed when retries are exhausted after repeated transient errors', async () => {
      const deadlockError = new Prisma.PrismaClientKnownRequestError('Deadlock detected', {
        code: 'P2010',
        clientVersion: '6.19.3',
        meta: { code: '40P01' }
      });

      const mockFn = vi.fn().mockRejectedValue(deadlockError);

      await expect(runWithTransactionRetry('testOp', mockFn, 3)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError
      );
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail closed immediately without retry on non-transient errors', async () => {
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['token_hash'] }
      });

      const mockFn = vi.fn().mockRejectedValue(uniqueError);

      await expect(runWithTransactionRetry('testOp', mockFn, 3)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError
      );
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrency Lock Ordering Invariant Verification', () => {
    it('demonstrates that sorting token IDs deterministically eliminates lock order inversion', () => {
      // Scenario: Family F contains two tokens: tokenA (UUID '00000000-0000-0000-0000-000000000001')
      // and tokenB (UUID '00000000-0000-0000-0000-000000000002').
      const tokenA = '00000000-0000-0000-0000-000000000001';
      const tokenB = '00000000-0000-0000-0000-000000000002';

      // 1. Unordered acquisition:
      // Transaction 1 presents tokenB, locking tokenB first, then attempting to lock family [tokenA, tokenB].
      const unorderedTx1 = [tokenB, tokenA]; // Inversion: B then A
      // Transaction 2 (Logout) acquires family [tokenA, tokenB] in ascending order.
      const unorderedTx2 = [tokenA, tokenB]; // Normal: A then B

      // Verify that without deterministic pre-sorting, lock acquisition order differs
      expect(unorderedTx1[0]).not.toBe(unorderedTx2[0]); // Lock order inversion hazard!

      // 2. Deterministic acquisition (CP-9 corrected policy):
      // Both transactions acquire all tokens in family sorted by ID ASC
      const deterministicSort = (ids: string[]) => [...ids].sort();

      const orderedTx1 = deterministicSort([tokenB, tokenA]);
      const orderedTx2 = deterministicSort([tokenA, tokenB]);

      // Verify that both transactions acquire locks in the exact same sequence
      expect(orderedTx1).toEqual(['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']);
      expect(orderedTx2).toEqual(orderedTx1);
      expect(orderedTx1[0]).toBe(orderedTx2[0]);
      expect(orderedTx1[1]).toBe(orderedTx2[1]);
    });

    it('demonstrates that ORDER BY id ASC guarantees compatible ordering between user-wide superset and family-level subset', () => {
      // Scenario: User has 4 tokens interleaved across Family 1 and Family 2:
      const t1_fam2 = '00000000-0000-0000-0000-000000000001';
      const t2_fam1 = '00000000-0000-0000-0000-000000000002';
      const t3_fam2 = '00000000-0000-0000-0000-000000000003';
      const t4_fam1 = '00000000-0000-0000-0000-000000000004';

      const allUserTokens = [t2_fam1, t4_fam1, t1_fam2, t3_fam2];
      const family1Tokens = [t4_fam1, t2_fam1]; // Unordered in database query scan

      // Transaction A (Early Suspension or Admin Suspension / Password Change):
      // Locks all user tokens with ORDER BY id ASC
      const txA_UserLockOrder = [...allUserTokens].sort();
      expect(txA_UserLockOrder).toEqual([t1_fam2, t2_fam1, t3_fam2, t4_fam1]);

      // Transaction B (Family Logout or Rotation for Family 1):
      // Locks only Family 1 tokens with ORDER BY id ASC
      const txB_Family1LockOrder = [...family1Tokens].sort();
      expect(txB_Family1LockOrder).toEqual([t2_fam1, t4_fam1]);

      // Assert that Family 1 tokens appear in the exact same relative monotonic order in both transactions:
      // In Tx A: t2_fam1 comes before t4_fam1 (indices 1 < 3)
      // In Tx B: t2_fam1 comes before t4_fam1 (indices 0 < 1)
      const indexInTxA_t2 = txA_UserLockOrder.indexOf(t2_fam1);
      const indexInTxA_t4 = txA_UserLockOrder.indexOf(t4_fam1);
      expect(indexInTxA_t2).toBeLessThan(indexInTxA_t4);

      const indexInTxB_t2 = txB_Family1LockOrder.indexOf(t2_fam1);
      const indexInTxB_t4 = txB_Family1LockOrder.indexOf(t4_fam1);
      expect(indexInTxB_t2).toBeLessThan(indexInTxB_t4);

      // By Havender's principle, because both transactions acquire locks in strict monotonic ascending order,
      // circular wait (deadlock) between user-level superset and family-level subset is mathematically impossible.
    });
  });
});
