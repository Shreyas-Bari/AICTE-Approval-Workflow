import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.js';
import { getDatabaseClient } from '../database/index.js';

/**
 * Authentication Middleware with Per-Request Account Status Verification.
 *
 * Adheres strictly to Decision Q-01:
 * 1. Extracts the short-lived access token from the HttpOnly access_token cookie.
 * 2. Cryptographically validates the JWT signature and expiration using Web Crypto / jose.
 * 3. Enforces immediate per-request account status verification against PostgreSQL:
 *    Even if the JWT is cryptographically valid, a suspended or inactive account
 *    is immediately rejected with 403 Forbidden (ACCOUNT_SUSPENDED).
 * 4. Populates req.user with verified identity context.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Extract token from HttpOnly access_token cookie.
  // Architectural boundary (Decision Q-01): Browser SPAs authenticate exclusively via
  // HttpOnly cookies. Browser storage (localStorage/sessionStorage) is strictly prohibited.
  // Authorization Bearer header is supported solely as a secondary fallback for non-browser
  // tooling/testing (e.g. automated integration tests, CLI, external inspection tools).
  let token = req.cookies?.access_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. No valid session cookie found.'
      }
    });
    return;
  }

  // Verify JWT signature & expiration
  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.name === 'JWTExpired';
    res.status(401).json({
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: isExpired ? 'Access token has expired' : 'Access token signature or format is invalid'
      }
    });
    return;
  }

  const userId = payload.sub;
  if (!userId) {
    res.status(401).json({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Access token is missing subject identity'
      }
    });
    return;
  }

  // Immediate per-request account status check against Neon PostgreSQL
  try {
    const prisma = getDatabaseClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        email: true,
        displayName: true
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

    req.user = user;
    next();
  } catch (dbError: unknown) {
    next(dbError);
  }
}
