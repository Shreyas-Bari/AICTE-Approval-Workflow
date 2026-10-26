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

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
