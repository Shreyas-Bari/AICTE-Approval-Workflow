import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import {
  generateCsrfToken,
  verifyCsrfToken,
  csrfProtection
} from '../src/middleware/csrf.middleware.js';
import { env } from '../src/config/env.js';

describe('CSRF Defense-in-Depth Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(csrfProtection);

    app.get('/api/test-safe', (_req, res) => {
      res.json({ message: 'safe' });
    });

    app.post('/api/test-mutation', (req, res) => {
      res.json({ message: 'mutation success', body: req.body });
    });
  });

  describe('Cryptographic Token Generation and Verification', () => {
    it('should generate a valid signed token that passes verification', () => {
      const token = generateCsrfToken();
      expect(typeof token).toBe('string');
      expect(verifyCsrfToken(token)).toBe(true);
    });

    it('should reject tampered or forged tokens', () => {
      const token = generateCsrfToken();
      const tampered = token.substring(0, token.length - 4) + 'zzzz';
      expect(verifyCsrfToken(tampered)).toBe(false);
      expect(verifyCsrfToken('invalid.token.signature')).toBe(false);
      expect(verifyCsrfToken('')).toBe(false);
    });
  });

  describe('Safe HTTP Methods (GET, HEAD, OPTIONS)', () => {
    it('should allow GET requests without origin or token and attach XSRF-TOKEN cookie', async () => {
      const res = await request(app).get('/api/test-safe');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('safe');

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader || ''];
      expect(cookies.some((c: string) => c.startsWith('XSRF-TOKEN='))).toBe(true);
    });
  });

  describe('Mutating HTTP Methods (POST, PUT, PATCH, DELETE)', () => {
    it('should block mutating request with 403 CSRF_ORIGIN_INVALID when origin does not match CLIENT_URL', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', 'http://malicious-attacker.com')
        .set('Cookie', [`XSRF-TOKEN=${token}`])
        .set('x-xsrf-token', token)
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_ORIGIN_INVALID');
    });

    it('should block mutating request with 403 CSRF_ORIGIN_INVALID when origin and referer are completely missing', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Cookie', [`XSRF-TOKEN=${token}`])
        .set('x-xsrf-token', token)
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_ORIGIN_INVALID');
    });

    it('should block mutating request with 403 CSRF_COOKIE_MISSING when CSRF cookie is absent', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', env.CLIENT_URL)
        .set('x-xsrf-token', token)
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_COOKIE_MISSING');
    });

    it('should block mutating request with 403 CSRF_TOKEN_MISSING when origin and cookie are valid but header token is missing', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${token}`])
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should block mutating request with 403 CSRF_TOKEN_MISMATCH when header token does not match cookie token', async () => {
      const tokenA = generateCsrfToken();
      const tokenB = generateCsrfToken(); // Distinct valid signed token

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${tokenA}`])
        .set('x-xsrf-token', tokenB)
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISMATCH');
      expect(res.body.error.message).toContain('does not match session cookie');
    });

    it('should block mutating request with 403 CSRF_TOKEN_INVALID when token signature is invalid', async () => {
      const invalidToken = 'nonce.timestamp.invalidsignature';

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${invalidToken}`])
        .set('x-xsrf-token', invalidToken)
        .send({ data: 123 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should permit mutating request when both allowed origin and valid signed matching cookie + header tokens are present', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Origin', env.CLIENT_URL)
        .set('Cookie', [`XSRF-TOKEN=${token}`])
        .set('x-xsrf-token', token)
        .send({ name: 'Valid Submission' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('mutation success');
      expect(res.body.body.name).toBe('Valid Submission');
    });

    it('should accept allowed origin from Referer header if Origin header is omitted with matching tokens', async () => {
      const token = generateCsrfToken();

      const res = await request(app)
        .post('/api/test-mutation')
        .set('Referer', `${env.CLIENT_URL}/applications/new`)
        .set('Cookie', [`XSRF-TOKEN=${token}`])
        .set('x-xsrf-token', token)
        .send({ name: 'Valid via Referer' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('mutation success');
    });
  });
});
