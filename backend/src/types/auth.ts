import { UserStatus } from '@prisma/client';

/**
 * Authenticated user context populated on Express request pipeline.
 * Browser clients authenticate exclusively via HttpOnly cookies (Decision Q-01).
 * Authorization Bearer header fallback is reserved strictly for non-browser tooling/testing.
 */
export interface AuthenticatedUser {
  id: string;
  status: UserStatus;
  email: string | null;
  displayName: string;
}

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
  [key: string]: unknown;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
  familyId: string;
  [key: string]: unknown;
}

/**
 * Stored password credential entity (user_credentials table).
 * Decoupled from provider-neutral User model per Decision Q-01.
 */
export interface UserCredential {
  id: string;
  userId: string;
  passwordHash: string;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stored refresh token record entity (refresh_tokens table).
 * Raw tokens are never stored; only tokenHash is persisted per Decision Q-01.
 */
export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  consumedAt: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  expiresAt: Date;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
