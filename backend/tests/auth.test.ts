import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, MAX_PASSWORD_INPUT_LENGTH } from '../src/utils/password.js';
import {
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  JWT_ISSUER,
  JWT_AUDIENCE
} from '../src/utils/token.js';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getCsrfCookieOptions,
  getClearCookieOptions,
  getClearCsrfCookieOptions
} from '../src/utils/cookies.js';
import { env } from '../src/config/env.js';
import * as jose from 'jose';

describe('Authentication Utilities Foundation (Decision Q-01)', () => {
  describe('Password Hashing (@node-rs/argon2)', () => {
    it('should successfully hash a password using Argon2id', async () => {
      const password = 'StrongPassword#2026';
      const hash = await hashPassword(password);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash).not.toBe(password);
    });

    it('should verify correct password against hash', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const hash = await hashPassword('ActualPassword');
      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should fail safely on invalid or malformed hash without throwing', async () => {
      expect(await verifyPassword('password', 'not-a-valid-argon-hash')).toBe(false);
      expect(await verifyPassword('', 'hash')).toBe(false);
    });

    it('should reject password exceeding MAX_PASSWORD_INPUT_LENGTH', async () => {
      const hugePassword = 'A'.repeat(MAX_PASSWORD_INPUT_LENGTH + 1);
      await expect(hashPassword(hugePassword)).rejects.toThrow('Password exceeds maximum allowed length');
      expect(await verifyPassword(hugePassword, '$argon2id$v=19$m=19456,t=2,p=1$dummy$dummy')).toBe(false);
    });
  });

  describe('JWT Token Handling (jose)', () => {
    it('should create and verify a valid access token with type: access, iss, aud, and sub', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const token = await createAccessToken(userId, { role: 'INSTITUTION_ADMIN' });

      expect(typeof token).toBe('string');

      const payload = await verifyAccessToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('access');
      expect(payload.iss).toBe(JWT_ISSUER);
      expect(payload.aud).toBe(JWT_AUDIENCE);
      expect(payload.role).toBe('INSTITUTION_ADMIN');
      expect(payload.exp).toBeDefined();
    });

    it('should reject access token verification with invalid secret or tampered token', async () => {
      const userId = 'user-123';
      const validToken = await createAccessToken(userId);
      const tamperedToken = validToken.substring(0, validToken.length - 5) + 'xxxxx';

      await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
    });

    it('should create a refresh token with type: refresh, jti, familyId, iss, and aud', async () => {
      const userId = 'user-family-test';
      const { token, tokenId, familyId } = await createRefreshToken(userId);

      expect(token).toBeDefined();
      expect(tokenId).toBeDefined();
      expect(familyId).toBeDefined();

      const payload = await verifyRefreshToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('refresh');
      expect(payload.iss).toBe(JWT_ISSUER);
      expect(payload.aud).toBe(JWT_AUDIENCE);
      expect(payload.jti).toBe(tokenId);
      expect(payload.familyId).toBe(familyId);
    });

    it('should strictly reject refresh tokens when verified as access tokens', async () => {
      const userId = 'cross-token-test-user';
      const { token: refreshToken } = await createRefreshToken(userId);

      // Refresh token passed to access token verifier must fail
      await expect(verifyAccessToken(refreshToken)).rejects.toThrow();
    });

    it('should strictly reject access tokens when verified as refresh tokens', async () => {
      const userId = 'cross-token-test-user';
      const accessToken = await createAccessToken(userId);

      // Access token passed to refresh token verifier must fail
      await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
    });

    it('should reject tokens with mismatched token type even if signed with access secret', async () => {
      const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
      const spoofedToken = await new jose.SignJWT({ sub: 'user-spoof', type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(accessSecret);

      await expect(verifyAccessToken(spoofedToken)).rejects.toThrow('Invalid token type: expected access token');
    });

    it('should compute deterministic SHA-256 token hash for database storage', () => {
      const rawToken = 'sample.jwt.token.string';
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits in hex
      expect(hash1).not.toBe(rawToken);
    });
  });

  describe('Cookie Configuration Helpers', () => {
    it('should provide HttpOnly access token cookie options with provisional 15-minute maxAge', () => {
      const options = getAccessTokenCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(env.ACCESS_TOKEN_LIFETIME_SEC * 1000);
      expect(options.maxAge).toBe(900 * 1000); // 15 minutes provisional default
    });

    it('should provide path-scoped HttpOnly refresh token cookie options with provisional 7-day maxAge', () => {
      const options = getRefreshTokenCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/api/v1/auth'); // Path-scoped per Q-01 §4.1
      expect(options.maxAge).toBe(env.REFRESH_TOKEN_LIFETIME_SEC * 1000);
      expect(options.maxAge).toBe(604800 * 1000); // 7 days provisional default
    });

    it('should provide readable non-HttpOnly CSRF cookie options', () => {
      const options = getCsrfCookieOptions();

      expect(options.httpOnly).toBe(false); // Accessible to JavaScript client
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
    });

    it('should provide clear cookie options with default httpOnly: true for auth cookies', () => {
      const options = getClearCookieOptions('/api/v1/auth');

      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/api/v1/auth');
      expect(options.maxAge).toBe(0);
    });

    it('should provide clear cookie options with httpOnly: false for CSRF cookie', () => {
      const options = getClearCsrfCookieOptions();

      expect(options.httpOnly).toBe(false);
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(0);
    });
  });

  describe('Environment Configuration Validation (Decision Q-01)', () => {
    it('should reject environment configuration when JWT_ACCESS_SECRET equals JWT_REFRESH_SECRET', async () => {
      const { validateEnv } = await import('../src/validators/env.validator.js');

      expect(() =>
        validateEnv({
          JWT_ACCESS_SECRET: 'identical_secret_used_for_both_tokens_32chars!',
          JWT_REFRESH_SECRET: 'identical_secret_used_for_both_tokens_32chars!',
          CSRF_SECRET: 'csrf_secret_min32chars_long_and_distinct_value!!'
        })
      ).toThrow('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct secrets');
    });

    it('should reject environment configuration when CSRF_SECRET matches a JWT secret', async () => {
      const { validateEnv } = await import('../src/validators/env.validator.js');

      expect(() =>
        validateEnv({
          JWT_ACCESS_SECRET: 'access_secret_min32chars_long_and_distinct_value!!',
          JWT_REFRESH_SECRET: 'refresh_secret_min32chars_long_and_distinct_val!!',
          CSRF_SECRET: 'access_secret_min32chars_long_and_distinct_value!!'
        })
      ).toThrow('CSRF_SECRET must be distinct from JWT secrets');
    });

    it('should reject production environment when CLIENT_URL is localhost or not HTTPS', async () => {
      const { validateEnv } = await import('../src/validators/env.validator.js');

      expect(() =>
        validateEnv({
          NODE_ENV: 'production',
          CLIENT_URL: 'http://localhost:5173',
          JWT_ACCESS_SECRET: 'prod_secure_jwt_access_secret_32chars_minimum!',
          JWT_REFRESH_SECRET: 'prod_secure_jwt_refresh_secret_32chars_minimum!',
          CSRF_SECRET: 'prod_secure_csrf_secret_32chars_minimum_length!'
        })
      ).toThrow('CLIENT_URL must be an HTTPS URL and cannot use localhost in production');
    });

    it('should accept valid production configuration with distinct secrets and HTTPS CLIENT_URL', async () => {
      const { validateEnv } = await import('../src/validators/env.validator.js');

      const config = validateEnv({
        NODE_ENV: 'production',
        CLIENT_URL: 'https://approval.aicte.gov.in',
        JWT_ACCESS_SECRET: 'prod_secure_jwt_access_secret_32chars_minimum!',
        JWT_REFRESH_SECRET: 'prod_secure_jwt_refresh_secret_32chars_minimum!',
        CSRF_SECRET: 'prod_secure_csrf_secret_32chars_minimum_length!'
      });

      expect(config.NODE_ENV).toBe('production');
      expect(config.CLIENT_URL).toBe('https://approval.aicte.gov.in');
    });
  });
});
