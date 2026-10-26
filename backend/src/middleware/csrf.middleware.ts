import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { getCsrfCookieOptions } from '../utils/cookies.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically signed CSRF token using HMAC-SHA256.
 * Format: <nonce>.<timestamp>.<signature>
 *
 * Architectural Note on Session Binding (Decision Q-01 §4.2):
 * In this foundation checkpoint prior to the implementation of login endpoints, tokens are
 * issued per browser session and bound to the client through the readable XSRF-TOKEN cookie.
 * Strict double-submit matching (header === cookie) prevents cross-origin attackers from reusing
 * an arbitrary signed token obtained elsewhere, because browser Same-Origin Policy forbids reading
 * the victim's cookie. Downstream authentication endpoints will further bind the CSRF payload
 * to authenticated user credentials.
 */
export function generateCsrfToken(): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  const data = `${nonce}.${timestamp}`;
  const signature = crypto.createHmac('sha256', env.CSRF_SECRET).update(data).digest('base64url');
  return `${nonce}.${timestamp}.${signature}`;
}

/**
 * Verify a cryptographically signed CSRF token against CSRF_SECRET.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [nonce, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 36);

  if (isNaN(timestamp) || Date.now() - timestamp > CSRF_MAX_AGE_MS || timestamp > Date.now() + 60000) {
    return false; // Expired or future timestamp
  }

  const data = `${nonce}.${timestampStr}`;
  const expectedSignature = crypto.createHmac('sha256', env.CSRF_SECRET).update(data).digest('base64url');

  if (providedSignature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Validate that the request Origin or Referer header matches the configured CLIENT_URL.
 */
export function validateAllowedOrigin(req: Request): boolean {
  const allowedOrigin = new URL(env.CLIENT_URL).origin;

  const originHeader = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (originHeader && typeof originHeader === 'string') {
    try {
      return new URL(originHeader).origin === allowedOrigin;
    } catch {
      return false;
    }
  }

  const refererHeader = Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer;
  if (refererHeader && typeof refererHeader === 'string') {
    try {
      return new URL(refererHeader).origin === allowedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * CSRF Defense-in-Depth Middleware:
 * 1. Safe methods (GET, HEAD, OPTIONS) populate/refresh the readable XSRF-TOKEN cookie.
 * 2. Mutating methods (POST, PUT, PATCH, DELETE) require:
 *    a. Rigorous allowed-origin validation (Origin/Referer header match CLIENT_URL).
 *    b. Presence of XSRF-TOKEN cookie in browser cookie jar.
 *    c. Presence of x-xsrf-token or x-csrf-token in custom request header.
 *    d. Timing-safe equality match between header token and cookie token (double-submit defense).
 *    e. Cryptographic HMAC signature and freshness verification against CSRF_SECRET.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe read-only HTTP methods
  if (SAFE_METHODS.has(req.method)) {
    const existingCookie = req.cookies?.['XSRF-TOKEN'];
    if (!existingCookie || !verifyCsrfToken(existingCookie)) {
      const newToken = generateCsrfToken();
      res.cookie('XSRF-TOKEN', newToken, getCsrfCookieOptions());
    }
    return next();
  }

  // Mutating HTTP methods (POST, PUT, PATCH, DELETE)
  // Layer 1: Rigorous Origin Validation
  if (!validateAllowedOrigin(req)) {
    res.status(403).json({
      error: {
        code: 'CSRF_ORIGIN_INVALID',
        message: 'Cross-site request blocked: Origin does not match allowed client origin'
      }
    });
    return;
  }

  // Layer 2: Cookie Presence Check
  const cookieToken = req.cookies?.['XSRF-TOKEN'];
  if (!cookieToken || typeof cookieToken !== 'string') {
    res.status(403).json({
      error: {
        code: 'CSRF_COOKIE_MISSING',
        message: 'CSRF protection cookie is missing from request'
      }
    });
    return;
  }

  // Layer 3: Header Token Presence Check
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  if (!headerToken || typeof headerToken !== 'string') {
    res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF protection token is missing in request headers'
      }
    });
    return;
  }

  // Layer 4: Double-Submit Token Matching (Timing-Safe Equality)
  const headerBuf = Buffer.from(headerToken);
  const cookieBuf = Buffer.from(cookieToken);
  if (headerBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(headerBuf, cookieBuf)) {
    res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token in header does not match session cookie'
      }
    });
    return;
  }

  // Layer 5: Cryptographic Token Signature Verification
  if (!verifyCsrfToken(headerToken)) {
    res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF protection token is invalid or expired'
      }
    });
    return;
  }

  next();
}
