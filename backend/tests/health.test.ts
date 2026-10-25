import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../src/app.js';
import * as databaseModule from '../src/database/index.js';
import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Health and Readiness Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health and GET /health (General Health)', () => {
    it('should return 200 OK with valid health status metadata and no leaked environment details on /api/health', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptimeSeconds');
      expect(response.body).toHaveProperty('version');

      // Ensure environment, database credentials, and internal details are NOT exposed
      expect(response.body).not.toHaveProperty('environment');
      expect(response.body).not.toHaveProperty('NODE_ENV');
      expect(response.body).not.toHaveProperty('database');
      expect(response.body).not.toHaveProperty('DATABASE_URL');
      expect(response.body).not.toHaveProperty('checks');
    });

    it('should return 200 OK with identical payload on root /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('version', '0.1.0');
    });
  });

  describe('GET /health/live and GET /api/health/live (Process Liveness)', () => {
    it('should return 200 OK verifying process liveness without database dependency', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptimeSeconds: expect.any(Number)
      });

      // Liveness must never leak configuration or depend on external services
      expect(response.body).not.toHaveProperty('checks');
      expect(response.body).not.toHaveProperty('database');
    });

    it('should return 200 OK on /api/health/live as well', async () => {
      const response = await request(app).get('/api/health/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /health/ready and GET /api/health/ready (Application & Dependency Readiness)', () => {
    it('should return 200 OK when database ping succeeds, distinguishing process and database status', async () => {
      vi.spyOn(databaseModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        status: 'connected',
        latencyMs: 3
      });

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptimeSeconds).toBeDefined();
      expect(response.body.checks).toEqual({
        process: {
          status: 'up'
        },
        database: {
          status: 'connected',
          latencyMs: 3
        }
      });

      // Must not expose credentials or connection strings
      expect(JSON.stringify(response.body)).not.toContain('postgresql://');
      expect(JSON.stringify(response.body)).not.toContain('neon.tech');
    });

    it('should return 503 Service Unavailable with safe sanitized message when database ping fails', async () => {
      vi.spyOn(databaseModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        status: 'disconnected',
        error: 'Database service is unavailable'
      });

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not_ready');
      expect(response.body.checks).toEqual({
        process: {
          status: 'up'
        },
        database: {
          status: 'disconnected',
          error: 'Database service is unavailable'
        }
      });

      // Ensure no raw driver internals, passwords, or hostnames leak
      expect(JSON.stringify(response.body)).not.toContain('P1001');
      expect(JSON.stringify(response.body)).not.toContain('password');
      expect(JSON.stringify(response.body)).not.toContain('neon.tech');
    });

    it('should return 503 Service Unavailable when database is unconfigured', async () => {
      vi.spyOn(databaseModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        status: 'unconfigured',
        error: 'Database configuration is missing'
      });

      const response = await request(app).get('/api/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not_ready');
      expect(response.body.checks.process.status).toBe('up');
      expect(response.body.checks.database).toEqual({
        status: 'unconfigured',
        error: 'Database configuration is missing'
      });
    });
  });

  describe('Route fallback and error handling', () => {
    it('should return 404 with structured error response for unmapped endpoints', async () => {
      const response = await request(app).get('/api/unmapped-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error.message).toContain('/api/unmapped-endpoint');
    });

    it('should return 400 when receiving malformed JSON payload', async () => {
      const response = await request(app)
        .post('/api/health')
        .set('Content-Type', 'application/json')
        .send('{"invalidJson": true,');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'MALFORMED_JSON');
    });
  });

  describe('Database Failure Boundary & Error Sanitization', () => {
    it('should keep /health/live functional returning 200 even when database is completely down', async () => {
      vi.spyOn(databaseModule, 'checkDatabaseHealth').mockRejectedValueOnce(
        new Error('Fatal database connection failure')
      );

      const response = await request(app).get('/health/live');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptimeSeconds: expect.any(Number)
      });
    });

    it('should catch unhandled Prisma connection failure, returning 503 without leaking driver internals or hostnames', async () => {
      const testApp = express();
      testApp.get('/api/test-db-fail', () => {
        const error = new Error("Can't reach database server at `ep-sample-pooler.us-east-2.aws.neon.tech`:`5432`");
        error.name = 'PrismaClientInitializationError';
        (error as unknown as { code: string }).code = 'P1001';
        throw error;
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/api/test-db-fail');
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is unavailable'
        }
      });
      // Verify raw hostnames, ports, error codes, and driver messages are NEVER in the body
      expect(JSON.stringify(response.body)).not.toContain('P1001');
      expect(JSON.stringify(response.body)).not.toContain('5432');
      expect(JSON.stringify(response.body)).not.toContain('neon.tech');
    });

    it('should catch unhandled missing database configuration error, returning 503 DATABASE_UNCONFIGURED', async () => {
      const testApp = express();
      testApp.get('/api/test-db-unconfigured', () => {
        throw new Error('Database configuration missing: DATABASE_URL is required for database-dependent operations.');
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/api/test-db-unconfigured');
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: {
          code: 'DATABASE_UNCONFIGURED',
          message: 'Database service is not configured'
        }
      });
    });

    it('should catch runtime Prisma query error, returning 500 DATABASE_ERROR without leaking query internals', async () => {
      const testApp = express();
      testApp.get('/api/test-db-query-error', () => {
        const error = new Error('Unique constraint failed on the constraint: users_email_key');
        error.name = 'PrismaClientKnownRequestError';
        (error as unknown as { code: string }).code = 'P2002';
        throw error;
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/api/test-db-query-error');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred while processing the request'
        }
      });
      expect(JSON.stringify(response.body)).not.toContain('users_email_key');
    });
  });
});
