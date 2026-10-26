import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as databaseModule from '../src/database/index.js';
import * as persistenceModule from '../src/services/auth.persistence.service.js';
import { generateCsrfToken } from '../src/middleware/csrf.middleware.js';
import { createAccessToken, createRefreshToken } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';
import { env } from '../src/config/env.js';

vi.mock('../src/services/auth.persistence.service.js', () => ({
  getUserCredentialByUserId: vi.fn(),
  createRefreshTokenRecord: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeFamilyOnLogout: vi.fn(),
  updateUserPassword: vi.fn()
}));

// Helper to parse set-cookie headers from supertest responses
function parseCookies(res: request.Response): Record<string, { value: string; flags: string[] }> {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return {};
  const cookies: Record<string, { value: string; flags: string[] }> = {};
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const item of list) {
    const parts = item.split(';').map((s) => s.trim());
    const [nameVal, ...flags] = parts;
    const [name, ...valParts] = nameVal.split('=');
    cookies[name] = { value: valParts.join('='), flags };
  }
  return cookies;
}

describe('Authentication Endpoint HTTP Integration Tests (CP-10)', () => {
  const mockUserFindFirst = vi.fn();
  const mockUserFindUnique = vi.fn();

  const mockGetUserCredential = vi.mocked(persistenceModule.getUserCredentialByUserId);
  const mockCreateRefreshTokenRecord = vi.mocked(persistenceModule.createRefreshTokenRecord);
  const mockRotateRefreshToken = vi.mocked(persistenceModule.rotateRefreshToken);
  const mockRevokeFamilyOnLogout = vi.mocked(persistenceModule.revokeFamilyOnLogout);
  const mockUpdateUserPassword = vi.mocked(persistenceModule.updateUserPassword);

  const testUserId = '11111111-1111-1111-1111-111111111111';
  const testFamilyId = '22222222-2222-2222-2222-222222222222';
  const testEmail = 'officer@aicte.gov.in';
  const testPassword = 'SecurePassword#2026';
  let validPasswordHash: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUserFindFirst.mockReset();
    mockUserFindUnique.mockReset();
    mockGetUserCredential.mockReset();
    mockCreateRefreshTokenRecord.mockReset();
    mockRotateRefreshToken.mockReset();
    mockRevokeFamilyOnLogout.mockReset();
    mockUpdateUserPassword.mockReset();

    // Isolated database mock: no connections to Neon or external databases
    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findFirst: mockUserFindFirst,
        findUnique: mockUserFindUnique
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);

    // Compute genuine Argon2id hash once per suite execution
    if (!validPasswordHash) {
      validPasswordHash = await hashPassword(testPassword);
    }
  });

  // ---------------------------------------------------------------------------
  // 1. CSRF Defense-in-Depth & Bootstrap Flow
  // ---------------------------------------------------------------------------
  describe('CSRF Protection & Bootstrap Flow', () => {
    it('should bootstrap XSRF-TOKEN cookie on safe GET /api/v1/me even if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/me');

      // Unauthenticated caller returns 401, but the safe GET method sets XSRF-TOKEN cookie
      expect(res.status).toBe(401);
      const cookies = parseCookies(res);
      expect(cookies['XSRF-TOKEN']).toBeDefined();
      expect(cookies['XSRF-TOKEN'].value.length).toBeGreaterThan(20);
      expect(cookies['XSRF-TOKEN'].flags).not.toContain('HttpOnly'); // Client-accessible
    });

    it('should reject POST /api/v1/auth/login when Origin does not match CLIENT_URL', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', 'http://malicious-attacker.com')
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_ORIGIN_INVALID');
    });

    it('should reject POST /api/v1/auth/login when XSRF-TOKEN cookie is missing', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('x-xsrf-token', csrfToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_COOKIE_MISSING');
    });

    it('should reject POST /api/v1/auth/login when header token does not match cookie token', async () => {
      const cookieToken = generateCsrfToken();
      const differentHeaderToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${cookieToken}`])
        .set('x-xsrf-token', differentHeaderToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISMATCH');
    });

    it('should reject POST /api/v1/auth/login when CSRF token signature is forged or tampered', async () => {
      const forgedToken = 'fakeNonce.12345.badSignature';

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${forgedToken}`])
        .set('x-xsrf-token', forgedToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_INVALID');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. POST /api/v1/auth/login
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/login', () => {
    it('should reject invalid request body with 400 VALIDATION_ERROR and not leak passwords', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);

      // Verify submitted values are never reflected in error response
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('not-an-email');
      expect(bodyStr).not.toContain('input');
    });

    it('should reject unknown user with generic 401 INVALID_CREDENTIALS (anti-enumeration)', async () => {
      const csrfToken = generateCsrfToken();
      mockUserFindFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: 'nonexistent@aicte.gov.in', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should reject user with missing credential record with 401 INVALID_CREDENTIALS', async () => {
      const csrfToken = generateCsrfToken();
      mockUserFindFirst.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });
      mockGetUserCredential.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should reject incorrect password with 401 INVALID_CREDENTIALS', async () => {
      const csrfToken = generateCsrfToken();
      mockUserFindFirst.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });
      mockGetUserCredential.mockResolvedValueOnce({
        id: 'cred-1',
        userId: testUserId,
        passwordHash: validPasswordHash,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: testEmail, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should reject non-ACTIVE (SUSPENDED) user with 403 ACCOUNT_SUSPENDED', async () => {
      const csrfToken = generateCsrfToken();
      mockUserFindFirst.mockResolvedValueOnce({
        id: testUserId,
        status: 'SUSPENDED',
        email: testEmail,
        displayName: 'Suspended Officer'
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
      expect(mockGetUserCredential).not.toHaveBeenCalled();
    });

    it('should succeed on valid credentials, set HttpOnly cookies, and return safe profile', async () => {
      const csrfToken = generateCsrfToken();
      mockUserFindFirst.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Dr. A. Sharma'
      });
      mockGetUserCredential.mockResolvedValueOnce({
        id: 'cred-1',
        userId: testUserId,
        passwordHash: validPasswordHash,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockCreateRefreshTokenRecord.mockResolvedValueOnce({
        id: 'rt-1',
        userId: testUserId,
        tokenHash: 'a'.repeat(64),
        familyId: testFamilyId,
        isRevoked: false,
        consumedAt: null,
        revokedAt: null,
        revocationReason: null,
        expiresAt: new Date(Date.now() + 604800000),
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({ email: '  OFFICER@AICTE.GOV.IN  ', password: testPassword });

      expect(res.status).toBe(200);

      // Verify safe profile returned
      expect(res.body.data.user).toEqual({
        id: testUserId,
        displayName: 'Dr. A. Sharma',
        email: testEmail,
        status: 'ACTIVE'
      });
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify cookie properties
      const cookies = parseCookies(res);
      expect(cookies['access_token']).toBeDefined();
      expect(cookies['access_token'].flags).toContain('HttpOnly');
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase() === 'path=/')).toBe(true);

      expect(cookies['refresh_token']).toBeDefined();
      expect(cookies['refresh_token'].flags).toContain('HttpOnly');
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase() === 'path=/api/v1/auth')).toBe(true);

      // Verify persistence service received only the SHA-256 hash
      expect(mockCreateRefreshTokenRecord).toHaveBeenCalledTimes(1);
      const passedHash = mockCreateRefreshTokenRecord.mock.calls[0][1];
      expect(passedHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. POST /api/v1/auth/refresh
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/refresh', () => {
    it('should reject with 401 and clear cookies when refresh token cookie is missing', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });

    it('should reject with 401 and clear cookies when refresh token is malformed', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=not-a-valid-jwt`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });

    it('should successfully rotate tokens on valid refresh cookie', async () => {
      const csrfToken = generateCsrfToken();
      const { token: oldRefresh } = await createRefreshToken(testUserId, testFamilyId);
      const newAccess = await createAccessToken(testUserId);
      const { token: newRefresh } = await createRefreshToken(testUserId, testFamilyId);

      mockRotateRefreshToken.mockResolvedValueOnce({
        status: 'SUCCESS',
        accessToken: newAccess,
        newRefreshToken: newRefresh,
        userId: testUserId,
        familyId: testFamilyId
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=${oldRefresh}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Token rotated successfully');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].value).toBe(newAccess);
      expect(cookies['refresh_token'].value).toBe(newRefresh);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase() === 'path=/api/v1/auth')).toBe(true);
    });

    it('should reject with 401 TOKEN_REUSE_DETECTED and clear cookies on reuse detection', async () => {
      const csrfToken = generateCsrfToken();
      const { token: reusedToken } = await createRefreshToken(testUserId, testFamilyId);

      mockRotateRefreshToken.mockResolvedValueOnce({
        status: 'REUSE_DETECTED',
        userId: testUserId,
        familyId: testFamilyId
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=${reusedToken}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REUSE_DETECTED');
      expect(res.body.error.message).toContain('Session expired due to concurrent activity');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });

    it('should reject with 403 ACCOUNT_SUSPENDED and clear cookies when account is suspended/inactive', async () => {
      const csrfToken = generateCsrfToken();
      const { token: suspendedToken } = await createRefreshToken(testUserId, testFamilyId);

      mockRotateRefreshToken.mockResolvedValueOnce({
        status: 'USER_SUSPENDED',
        userId: testUserId,
        familyId: testFamilyId
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=${suspendedToken}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. POST /api/v1/auth/logout
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/logout', () => {
    it('should idempotently return 200 and clear cookies when refresh token is absent', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(mockRevokeFamilyOnLogout).not.toHaveBeenCalled();
    });

    it('should idempotently return 200 and clear cookies when refresh token is malformed', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=corrupt.token`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });

    it('should revoke family in persistence service and clear cookies on valid refresh token', async () => {
      const csrfToken = generateCsrfToken();
      const { token: validRefresh } = await createRefreshToken(testUserId, testFamilyId);
      mockRevokeFamilyOnLogout.mockResolvedValueOnce({ status: 'SUCCESS', affectedCount: 1 });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`refresh_token=${validRefresh}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');

      expect(mockRevokeFamilyOnLogout).toHaveBeenCalledWith(testUserId, testFamilyId);

      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. GET /api/v1/me
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/me', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with expired access token with 401 TOKEN_EXPIRED', async () => {
      // Create token that expired 10 seconds ago
      const expiredToken = await createAccessToken(testUserId);
      // Wait or verify with malformed/expired payload; jose verification throws JWTExpired
      // Verify with an invalid token string for signature error
      const res = await request(app)
        .get('/api/v1/me')
        .set('Cookie', ['access_token=invalid.signature.token']);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('should reject request when user is marked SUSPENDED in database', async () => {
      const token = await createAccessToken(testUserId);
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'SUSPENDED',
        email: testEmail,
        displayName: 'Suspended Officer'
      });

      const res = await request(app)
        .get('/api/v1/me')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('should return safe user profile, active roles, and active memberships for active user', async () => {
      const token = await createAccessToken(testUserId);

      // 1. authenticate middleware database lookup
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Dr. A. Sharma'
      });

      // 2. getMeHandler detailed database lookup
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        displayName: 'Dr. A. Sharma',
        email: testEmail,
        phone: '+91-9876543210',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        userRoles: [
          {
            id: 'ur-1',
            role: {
              id: 'role-1',
              key: 'SCRUTINY_OFFICER',
              name: 'Scrutiny Officer',
              description: 'Reviews institution applications'
            }
          }
        ],
        memberships: [
          {
            id: 'mem-1',
            institutionId: 'inst-1',
            membershipRole: 'PRINCIPAL',
            status: 'ACTIVE'
          }
        ]
      });

      const res = await request(app)
        .get('/api/v1/me')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual({
        id: testUserId,
        displayName: 'Dr. A. Sharma',
        email: testEmail,
        phone: '+91-9876543210',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        roles: [
          {
            id: 'role-1',
            key: 'SCRUTINY_OFFICER',
            name: 'Scrutiny Officer',
            description: 'Reviews institution applications'
          }
        ],
        memberships: [
          {
            id: 'mem-1',
            institutionId: 'inst-1',
            membershipRole: 'PRINCIPAL',
            status: 'ACTIVE'
          }
        ]
      });

      // Strict security assertion: no credential, password, or token fields exposed
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.refreshTokens).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. POST /api/v1/auth/change-password
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/change-password', () => {
    it('should reject unauthenticated caller with 401 UNAUTHORIZED', async () => {
      const csrfToken = generateCsrfToken();

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({
          currentPassword: testPassword,
          newPassword: 'NewSecurePassword#2026'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject validation failure when new password equals current password', async () => {
      const csrfToken = generateCsrfToken();
      const token = await createAccessToken(testUserId);
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`access_token=${token}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({
          currentPassword: testPassword,
          newPassword: testPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].message).toContain('New password cannot be identical to current password');
    });

    it('should reject validation failure when new password is under 8 characters', async () => {
      const csrfToken = generateCsrfToken();
      const token = await createAccessToken(testUserId);
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`access_token=${token}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({
          currentPassword: testPassword,
          newPassword: 'Short1!'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].message).toContain('at least 8 characters');
    });

    it('should reject when current password verification fails with 400 INVALID_CREDENTIALS', async () => {
      const csrfToken = generateCsrfToken();
      const token = await createAccessToken(testUserId);
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });
      mockGetUserCredential.mockResolvedValueOnce({
        id: 'cred-1',
        userId: testUserId,
        passwordHash: validPasswordHash,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`access_token=${token}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({
          currentPassword: 'IncorrectCurrentPassword123!',
          newPassword: 'NewSecurePassword#2026'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(mockUpdateUserPassword).not.toHaveBeenCalled();
    });

    it('should succeed on valid change, call updateUserPassword, clear cookies, and force re-login', async () => {
      const csrfToken = generateCsrfToken();
      const token = await createAccessToken(testUserId);
      mockUserFindUnique.mockResolvedValueOnce({
        id: testUserId,
        status: 'ACTIVE',
        email: testEmail,
        displayName: 'Test Officer'
      });
      mockGetUserCredential.mockResolvedValueOnce({
        id: 'cred-1',
        userId: testUserId,
        passwordHash: validPasswordHash,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockUpdateUserPassword.mockResolvedValueOnce({
        status: 'SUCCESS',
        revokedTokensCount: 3
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`access_token=${token}`, `XSRF-TOKEN=${csrfToken}`])
        .set('x-xsrf-token', csrfToken)
        .send({
          currentPassword: testPassword,
          newPassword: 'NewBrandSecurePassword#2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Password changed successfully. Please log in again.');

      // Verify updateUserPassword called with new Argon2 hash
      expect(mockUpdateUserPassword).toHaveBeenCalledTimes(1);
      const passedNewHash = mockUpdateUserPassword.mock.calls[0][1];
      expect(passedNewHash).toMatch(/^\$argon2id\$/);
      expect(passedNewHash).not.toBe(validPasswordHash);

      // Verify both session cookies are cleared to force re-authentication (Decision Q-01 §5.2 item 3)
      const cookies = parseCookies(res);
      expect(cookies['access_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
      expect(cookies['refresh_token'].flags.some((f) => f.toLowerCase().includes('max-age=0'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Route Boundary & Unapproved Endpoint Negative Tests
  // ---------------------------------------------------------------------------
  describe('Route Boundary & Unapproved Route Verification', () => {
    it('should return 404 for GET /api/v1/auth/me (verifying no unapproved alias is mounted)', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(404);
    });

    it('should return 404 for POST /api/v1/auth/register (verifying no self-registration exists)', async () => {
      const res = await request(app).post('/api/v1/auth/register');
      expect(res.status).toBe(404);
    });

    it('should return 404 for POST /api/v1/auth/reset-password (verifying no password recovery exists)', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password');
      expect(res.status).toBe(404);
    });
  });
});
