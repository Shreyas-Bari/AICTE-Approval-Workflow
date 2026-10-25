import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth
} from '../src/database/index.js';
import { prisma as prismaFromClient } from '../src/database/client.js';
import { env } from '../src/config/env.js';

describe('Prisma Database Client Foundation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client Singleton & Reusability', () => {
    it('should export a singleton PrismaClient instance across module imports', () => {
      expect(prisma).toBeDefined();
      // Ensure importing from index and client returns the exact same object reference (singleton)
      expect(prisma).toBe(prismaFromClient);
      expect(typeof prisma.user).toBe('object');
    });

    it('should maintain stable client methods for queries and lifecycle management', () => {
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
      expect(typeof prisma.$queryRaw).toBe('function');
    });
  });

  describe('connectDatabase()', () => {
    it('should successfully establish connection when valid configuration is present', async () => {
      const connectSpy = vi.spyOn(prisma, '$connect').mockResolvedValueOnce(undefined);

      await expect(connectDatabase()).resolves.toBeUndefined();
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw safe sanitized error when database connection fails without leaking internals', async () => {
      vi.spyOn(prisma, '$connect').mockRejectedValueOnce(
        new Error('P1001: Can\'t reach database server at ep-sample-pooler.us-east-2.aws.neon.tech:5432')
      );

      await expect(connectDatabase()).rejects.toThrow(
        'Failed to connect to database: database service is unreachable or credentials are invalid'
      );
    });

    it('should reject when DATABASE_URL is missing without exposing system secrets', async () => {
      const originalUrl = env.DATABASE_URL;
      try {
        (env as { DATABASE_URL?: string }).DATABASE_URL = '';
        await expect(connectDatabase()).rejects.toThrow(
          'DATABASE_URL is required for database-dependent operations'
        );
      } finally {
        (env as { DATABASE_URL?: string }).DATABASE_URL = originalUrl;
      }
    });
  });

  describe('disconnectDatabase()', () => {
    it('should invoke prisma.$disconnect gracefully', async () => {
      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValueOnce(undefined);

      await expect(disconnectDatabase()).resolves.toBeUndefined();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkDatabaseHealth()', () => {
    it('should return connected status with latency when ping query succeeds', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ 1: 1 }]);

      const result = await checkDatabaseHealth();
      expect(result.status).toBe('connected');
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should return disconnected status with safe sanitized error when ping query fails', async () => {
      vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(
        new Error('P1001: Can\'t reach database server at ep-sample-pooler.us-east-2.aws.neon.tech:5432')
      );

      const result = await checkDatabaseHealth();
      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Database service is unavailable');
      // Ensure raw error message, driver internals, host, and ports are NOT leaked
      expect(result.error).not.toContain('P1001');
      expect(result.error).not.toContain('neon.tech');
      expect(result.error).not.toContain('5432');
    });

    it('should return unconfigured status when DATABASE_URL is not set', async () => {
      const originalUrl = env.DATABASE_URL;
      try {
        (env as { DATABASE_URL?: string }).DATABASE_URL = '';

        const result = await checkDatabaseHealth();
        expect(result.status).toBe('unconfigured');
        expect(result.error).toBe('Database configuration is missing');
        expect(result.latencyMs).toBeUndefined();
      } finally {
        (env as { DATABASE_URL?: string }).DATABASE_URL = originalUrl;
      }
    });
  });
});
