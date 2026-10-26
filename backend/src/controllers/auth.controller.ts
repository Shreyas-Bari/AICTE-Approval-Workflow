import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { getDatabaseClient } from '../database/index.js';
import {
  getUserCredentialByUserId,
  createRefreshTokenRecord,
  rotateRefreshToken,
  revokeFamilyOnLogout,
  updateUserPassword
} from '../services/auth.persistence.service.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken
} from '../utils/token.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions
} from '../utils/cookies.js';
import { LoginInput, ChangePasswordInput } from '../validators/auth.validator.js';
import { logger } from '../utils/logger.js';

// Constant timing pad hash used for anti-enumeration
const DUMMY_ARGON_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0ZHVtbXlzYWx0$ZHVtbXloYXNoZHVtbXloYXNoZHVtbXloYXNoZHVtbXloYXNo';

/**
 * POST /api/v1/auth/login
 *
 * Authenticates user credentials via Argon2id, generates access and refresh tokens,
 * persists only the refresh token SHA-256 hash, and sets HttpOnly cookies.
 *
 * Security Requirements:
 * - Anti-enumeration: returns identical 401 INVALID_CREDENTIALS for unknown users,
 *   missing credentials, and incorrect passwords.
 * - Account Status: immediately rejects non-ACTIVE accounts with 403 ACCOUNT_SUSPENDED.
 * - Storage Boundary: access/refresh tokens are stored strictly in HttpOnly cookies.
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;
    const normalizedEmail = email.trim().toLowerCase();

    const prisma = getDatabaseClient();
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail
      },
      select: {
        id: true,
        status: true,
        email: true,
        displayName: true
      }
    });

    if (!user) {
      await verifyPassword('dummy_password_timing_pad', DUMMY_ARGON_HASH);
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or inactive. Access revoked.'
        }
      });
      return;
    }

    const credential = await getUserCredentialByUserId(user.id);
    if (!credential || !credential.passwordHash) {
      await verifyPassword('dummy_password_timing_pad', DUMMY_ARGON_HASH);
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    const isValidPassword = await verifyPassword(password, credential.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Generate tokens and single-use rotation family
    const familyId = crypto.randomUUID();
    const accessToken = await createAccessToken(user.id, {
      email: user.email ?? undefined
    });
    const { token: rawRefreshToken } = await createRefreshToken(user.id, familyId);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_LIFETIME_SEC * 1000);

    // Persist refresh token hash
    await createRefreshTokenRecord(user.id, tokenHash, familyId, expiresAt);

    // Set secure HttpOnly cookies per Decision Q-01
    res.cookie('access_token', accessToken, getAccessTokenCookieOptions());
    res.cookie('refresh_token', rawRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          status: user.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 *
 * Rotates the refresh token atomically under strict single-use semantics.
 * Handles every RotationResult variant explicitly.
 * Only SUCCESS issues replacement cookies; all failures clear cookies.
 */
export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      res.cookie('access_token', '', getClearCookieOptions('/'));
      res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token cookie is missing'
        }
      });
      return;
    }

    // Verify token cryptographic format and signature
    try {
      await verifyRefreshToken(rawRefreshToken);
    } catch (err: unknown) {
      res.cookie('access_token', '', getClearCookieOptions('/'));
      res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
      const isExpired = err instanceof Error && err.name === 'JWTExpired';
      res.status(401).json({
        error: {
          code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
          message: isExpired
            ? 'Refresh token has expired. Please log in again.'
            : 'Refresh token signature or format is invalid'
        }
      });
      return;
    }

    const clientIp =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.socket.remoteAddress) || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    const result = await rotateRefreshToken(rawRefreshToken, clientIp, userAgent);

    switch (result.status) {
      case 'SUCCESS': {
        res.cookie('access_token', result.accessToken, getAccessTokenCookieOptions());
        res.cookie('refresh_token', result.newRefreshToken, getRefreshTokenCookieOptions());
        res.status(200).json({
          data: {
            message: 'Token rotated successfully'
          }
        });
        return;
      }

      case 'REUSE_DETECTED': {
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(401).json({
          error: {
            code: 'TOKEN_REUSE_DETECTED',
            message: 'Session expired due to concurrent activity. Please log in again.'
          }
        });
        return;
      }

      case 'USER_SUSPENDED':
      case 'USER_INACTIVE': {
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(403).json({
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Account is suspended or inactive. Access revoked.'
          }
        });
        return;
      }

      case 'TOKEN_EXPIRED': {
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token has expired. Please log in again.'
          }
        });
        return;
      }

      case 'FAMILY_ALREADY_REVOKED': {
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(401).json({
          error: {
            code: 'TOKEN_INVALID',
            message: 'Refresh token family has been revoked. Please log in again.'
          }
        });
        return;
      }

      case 'TOKEN_NOT_FOUND': {
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(401).json({
          error: {
            code: 'TOKEN_INVALID',
            message: 'Refresh token is invalid. Please log in again.'
          }
        });
        return;
      }

      default: {
        const exhaustiveCheck: never = result;
        res.cookie('access_token', '', getClearCookieOptions('/'));
        res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected token rotation error occurred'
          }
        });
        return;
      }
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Idempotently terminates the current session.
 * Clears both access_token and refresh_token cookies unconditionally.
 * Revokes the token family in PostgreSQL if the refresh token is verifiable.
 */
export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;

    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      try {
        const payload = await verifyRefreshToken(rawRefreshToken);
        if (payload.sub && payload.familyId) {
          await revokeFamilyOnLogout(payload.sub, payload.familyId);
        }
      } catch (err) {
        logger.warn(
          'Logout refresh token revocation skipped or failed:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    // Always unconditionally clear both cookies
    res.cookie('access_token', '', getClearCookieOptions('/'));
    res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));

    res.status(200).json({
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/me
 *
 * Returns the authenticated user's safe profile, active role keys, and active institution memberships.
 * Strictly excludes password hashes, refresh token records, and internal security metadata.
 * Uses the authenticated principal populated by the authenticate middleware.
 */
export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const prisma = getDatabaseClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        userRoles: {
          where: { revokedAt: null },
          select: {
            id: true,
            role: {
              select: {
                id: true,
                key: true,
                name: true,
                description: true
              }
            }
          }
        },
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            institutionId: true,
            membershipRole: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this session no longer exists'
        }
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or inactive. Access revoked.'
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          roles: user.userRoles.map((ur) => ur.role),
          memberships: user.memberships
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/change-password
 *
 * Verifies current password against stored Argon2id hash, updates to new password hash,
 * transactionally revokes all active refresh tokens, and clears cookies to force re-login.
 * Never logs or returns submitted passwords or hashes.
 */
export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const credential = await getUserCredentialByUserId(userId);
    if (!credential || !credential.passwordHash) {
      res.status(400).json({
        error: {
          code: 'CREDENTIAL_NOT_FOUND',
          message: 'No existing password credential found for this account'
        }
      });
      return;
    }

    const isCurrentValid = await verifyPassword(currentPassword, credential.passwordHash);
    if (!isCurrentValid) {
      res.status(400).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Current password is incorrect'
        }
      });
      return;
    }

    const newPasswordHash = await hashPassword(newPassword);
    const result = await updateUserPassword(userId, newPasswordHash);

    if (result.status === 'USER_NOT_FOUND') {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this session no longer exists'
        }
      });
      return;
    }

    // Decision Q-01 §5.2: Revoke tokens across all devices and clear cookies to force re-authentication
    res.cookie('access_token', '', getClearCookieOptions('/'));
    res.cookie('refresh_token', '', getClearCookieOptions('/api/v1/auth'));

    res.status(200).json({
      data: {
        message: 'Password changed successfully. Please log in again.'
      }
    });
  } catch (err) {
    next(err);
  }
}
