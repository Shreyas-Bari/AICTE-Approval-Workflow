import crypto from 'node:crypto';
import * as jose from 'jose';
import { env } from '../config/env.js';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.js';

export const JWT_ISSUER = 'aicte-backend';
export const JWT_AUDIENCE = 'aicte-client';

function getAccessSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

function getRefreshSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_REFRESH_SECRET);
}

/**
 * Generate a signed JWT access token for an authenticated user.
 * Lifespan is provisional (default: 15 minutes / 900 seconds).
 * Embeds explicit type: 'access' claim and issuer/audience.
 *
 * @param userId - Unique user identifier (sub claim)
 * @param additionalClaims - Optional safe claims (no sensitive data)
 * @returns Cryptographically signed JWT string
 */
export async function createAccessToken(
  userId: string,
  additionalClaims: Record<string, unknown> = {}
): Promise<string> {
  const secret = getAccessSecretKey();

  return new jose.SignJWT({ ...additionalClaims, sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_LIFETIME_SEC}s`)
    .sign(secret);
}

/**
 * Generate a signed JWT refresh token for single-use rotation.
 * Lifespan is provisional (default: 7 days / 604800 seconds).
 * Embeds explicit type: 'refresh' claim and issuer/audience.
 *
 * @param userId - Unique user identifier (sub claim)
 * @param familyId - Token family identifier UUID for tracking rotation and detecting reuse
 * @param tokenId - Optional unique token ID (jti claim); generated as UUID if not provided
 * @returns Object containing raw JWT, tokenId, and familyId
 */
export async function createRefreshToken(
  userId: string,
  familyId: string = crypto.randomUUID(),
  tokenId: string = crypto.randomUUID()
): Promise<{ token: string; tokenId: string; familyId: string }> {
  const secret = getRefreshSecretKey();

  const token = await new jose.SignJWT({ sub: userId, familyId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(tokenId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.REFRESH_TOKEN_LIFETIME_SEC}s`)
    .sign(secret);

  return { token, tokenId, familyId };
}

/**
 * Compute the SHA-256 cryptographic hash of a raw token.
 * Raw refresh tokens must NEVER be stored in the database.
 * Only their SHA-256 hash is stored in PostgreSQL.
 *
 * @param rawToken - Raw JWT string
 * @returns Hex-encoded SHA-256 hash
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Verify and decode a JWT access token.
 * Strictly verifies HS256 algorithm, issuer, audience, and type: 'access' claim.
 *
 * @param token - Raw JWT access token string
 * @returns Verified payload containing subject (userId)
 * @throws jose.errors.JWTExpired if expired, or other JWT verification errors
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = getAccessSecretKey();
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });

  if (payload.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }

  return payload as AccessTokenPayload;
}

/**
 * Verify and decode a JWT refresh token.
 * Strictly verifies HS256 algorithm, issuer, audience, type: 'refresh' claim, jti, and familyId.
 *
 * @param token - Raw JWT refresh token string
 * @returns Verified payload containing subject, jti, and familyId
 * @throws jose.errors.JWTExpired if expired, or other JWT verification errors
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const secret = getRefreshSecretKey();
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }

  if (!payload.jti || typeof payload.jti !== 'string') {
    throw new Error('Refresh token is missing jti claim');
  }

  const familyId = payload.familyId;
  if (!familyId || typeof familyId !== 'string') {
    throw new Error('Refresh token is missing familyId claim');
  }

  return {
    ...payload,
    sub: payload.sub as string,
    type: 'refresh',
    jti: payload.jti,
    familyId
  };
}
