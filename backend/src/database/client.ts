import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { validateDatabaseEnv } from '../validators/env.validator.js';
import { logger } from '../utils/logger.js';

// Maintain a single PrismaClient across hot module reloads in non-production environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseHealthResult {
  status: 'connected' | 'disconnected' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

/**
 * Connect to PostgreSQL via Prisma Client.
 * Validates database environment and establishes connection.
 * Throws a sanitized error if connection fails, preventing credential exposure.
 */
export async function connectDatabase(): Promise<void> {
  // Validate database environment variables
  validateDatabaseEnv(env);

  try {
    await prisma.$connect();
    logger.info('Database client successfully established connection to PostgreSQL');
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    logger.error('Failed to establish database connection:', errorDetail);
    throw new Error('Failed to connect to database: database service is unreachable or credentials are invalid');
  }
}

/**
 * Gracefully disconnect Prisma Client from the database.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database client disconnected successfully');
  } catch (err) {
    logger.error('Error during database disconnection:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/**
 * Check database connectivity using a lightweight ping query.
 * Distinguishes unconfigured, connected, and disconnected states.
 * Guarantees no sensitive credentials, connection strings, or raw internals are returned.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return {
      status: 'unconfigured',
      error: 'Database configuration is missing'
    };
  }

  const startTime = Date.now();
  try {
    // Lightweight ping query using raw query
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return {
      status: 'connected',
      latencyMs
    };
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    logger.error('Database health ping failed:', errorDetail);
    return {
      status: 'disconnected',
      error: 'Database service is unavailable'
    };
  }
}
