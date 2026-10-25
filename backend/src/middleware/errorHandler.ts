import { Request, Response, NextFunction } from 'express';

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

  const message = err instanceof Error ? err.message : 'Internal server error';
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected server error occurred' : message
    }
  });
}
