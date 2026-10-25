import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

function sanitizeErrorMessage(msg: string): string {
  // Redact connection strings, credentials, and hostnames
  let sanitized = msg.replace(/postgres(ql)?:\/\/[^@\s]+@[^\s]+/gi, 'postgresql://[redacted]');
  sanitized = sanitized.replace(/(password|secret|key|token)=[^&\s]+/gi, '$1=[redacted]');
  sanitized = sanitized.replace(/ep-[a-z0-9-]+\.[a-z0-9-]+\.aws\.neon\.tech/gi, '[database-host]');
  return sanitized;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle JSON parsing syntax errors gracefully
  const isSyntaxError =
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400;

  if (isSyntaxError) {
    res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON payload'
      }
    });
    return;
  }

  // Handle missing database configuration errors
  const isDbConfigError =
    err instanceof Error &&
    err.message.includes('DATABASE_URL is required');

  if (isDbConfigError) {
    logger.error('Database configuration error in request pipeline:', err.message);
    res.status(503).json({
      error: {
        code: 'DATABASE_UNCONFIGURED',
        message: 'Database service is not configured'
      }
    });
    return;
  }

  // Handle Prisma driver / database connectivity / query errors
  const isPrismaError =
    err instanceof Error &&
    (err.name.startsWith('PrismaClient') ||
      ('code' in err && typeof (err as { code: unknown }).code === 'string' && /^[P][0-9]{4}$/.test((err as { code: string }).code)));

  if (isPrismaError) {
    const isConnError =
      err.name === 'PrismaClientInitializationError' ||
      ('code' in err && (err as { code: string }).code === 'P1001');

    logger.error('Database error in request pipeline:', err.message);
    res.status(isConnError ? 503 : 500).json({
      error: {
        code: isConnError ? 'DATABASE_UNAVAILABLE' : 'DATABASE_ERROR',
        message: isConnError
          ? 'Database service is unavailable'
          : 'A database error occurred while processing the request'
      }
    });
    return;
  }

  const rawMessage = err instanceof Error ? err.message : 'Internal server error';
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected server error occurred' : sanitizeErrorMessage(rawMessage)
    }
  });
}
