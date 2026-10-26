import { Prisma } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Classifies whether a caught error is a recognized transient transaction conflict
 * suitable for automatic retry under Prisma and PostgreSQL.
 */
export function isTransientTransactionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: Transaction failed due to write conflict or deadlock
    if (error.code === 'P2034') {
      return true;
    }

    // P2010: Raw query failed. Check structured PostgreSQL SQLSTATE in meta.code
    if (error.code === 'P2010' && typeof error.meta?.code === 'string') {
      const sqlState = error.meta.code;
      // 40P01: deadlock_detected, 40001: serialization_failure
      if (sqlState === '40P01' || sqlState === '40001') {
        return true;
      }
    }
  }

  // Check native driver error codes if propagated
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const rawCode = (error as { code?: unknown }).code;
    if (rawCode === '40P01' || rawCode === '40001') {
      return true;
    }
  }

  return false;
}

/**
 * Executes a transaction callback with bounded retries and jittered backoff.
 * Only recognized transient conflicts (40P01, 40001, P2034) are retried.
 * Retries rerun the entire transaction from the start.
 * Fails closed if retries are exhausted or non-retryable error occurs.
 */
export async function runWithTransactionRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      if (isTransientTransactionError(error) && attempt < maxRetries) {
        const jitterMs = Math.floor(Math.random() * 25);
        const delayMs = Math.pow(2, attempt) * 25 + jitterMs;
        logger.warn(
          `Database transaction conflict encountered in ${operationName} (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms.`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Non-retryable error or retries exhausted -> fail closed
      throw error;
    }
  }
}
