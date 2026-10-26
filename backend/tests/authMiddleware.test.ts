import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { createAccessToken, createRefreshToken } from '../src/utils/token.js';
import * as databaseModule from '../src/database/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Authentication Middleware (Decision Q-01)', () => {
  let app: Express;
  const mockFindUnique = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindUnique.mockReset();

    // Mock Prisma database client
    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findUnique: mockFindUnique
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);

    app = express();
    app.use(cookieParser());
    app.use(express.json());

    // Protected route
    app.get('/api/protected', authenticate, (req, res) => {
      res.json({ message: 'authorized', user: req.user });
    });

    app.use(errorHandler);
  });

  describe('Token Extraction & Validation', () => {
    it('should reject request with 401 UNAUTHORIZED when no token is present', async () => {
      const res = await request(app).get('/api/protected');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with 401 TOKEN_INVALID when token format or signature is invalid', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', ['access_token=malformed.invalid.token']);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('should strictly reject request with 401 TOKEN_INVALID when a refresh token is supplied as access token', async () => {
      const userId = 'refresh-as-access-attacker';
      const { token: refreshToken } = await createRefreshToken(userId);

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${refreshToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('should accept valid token delivered via HttpOnly access_token cookie', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'ACTIVE',
        email: 'officer@aicte.gov.in',
        displayName: 'AICTE Officer'
      });

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('authorized');
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.status).toBe('ACTIVE');
    });

    it('should accept valid token delivered via Authorization Bearer header as secondary fallback', async () => {
      const userId = '22222222-2222-2222-2222-222222222222';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'ACTIVE',
        email: 'applicant@college.edu',
        displayName: 'College Principal'
      });

      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userId);
    });
  });

  describe('Per-Request Account Status Enforcement (Immediate Suspension Gate)', () => {
    it('should reject with 401 USER_NOT_FOUND when user does not exist in database', async () => {
      const userId = '33333333-3333-3333-3333-333333333333';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should immediately reject with 403 ACCOUNT_SUSPENDED when user status is SUSPENDED, even if JWT is cryptographically valid', async () => {
      const userId = '44444444-4444-4444-4444-444444444444';
      const token = await createAccessToken(userId); // Fresh unexpired token

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'SUSPENDED',
        email: 'suspended@college.edu',
        displayName: 'Suspended User'
      });

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
      expect(res.body.error.message).toContain('Account is suspended or inactive');
    });

    it('should immediately reject with 403 ACCOUNT_SUSPENDED when user status is INACTIVE', async () => {
      const userId = '55555555-5555-5555-5555-555555555555';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'INACTIVE',
        email: 'inactive@college.edu',
        displayName: 'Inactive User'
      });

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('should pass database errors to errorHandler, returning 500/503 sanitized response', async () => {
      const userId = '66666666-6666-6666-6666-666666666666';
      const token = await createAccessToken(userId);

      const dbError = new Error("Can't reach database server at ep-sweet-breeze-pooler.aws.neon.tech");
      dbError.name = 'PrismaClientInitializationError';
      mockFindUnique.mockRejectedValueOnce(dbError);

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
      expect(res.body.error.message).not.toContain('neon.tech');
    });
  });
});
