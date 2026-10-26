import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { MAX_PASSWORD_INPUT_LENGTH } from '../utils/password.js';

export { MAX_PASSWORD_INPUT_LENGTH };
export const MIN_PASSWORD_INPUT_LENGTH = 8;

/**
 * Field-level validation error detail matching the API specification envelope (§6.2).
 */
export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
}

/**
 * Standard API validation error response body.
 */
export interface ValidationErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: ValidationErrorDetail[];
  };
}

/**
 * Zod validation schema for POST /api/v1/auth/login.
 *
 * Rules:
 * - email: Valid email address format, trimmed and lowercased. Non-empty.
 * - password: Non-empty string, maximum 1024 characters (aligned with MAX_PASSWORD_INPUT_LENGTH).
 * - strict: Unknown fields are strictly rejected.
 */
export const loginSchema = z
  .object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string'
      })
      .trim()
      .toLowerCase()
      .min(1, 'Email cannot be empty')
      .email('Invalid email address format'),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
      })
      .min(1, 'Password cannot be empty')
      .max(
        MAX_PASSWORD_INPUT_LENGTH,
        `Password exceeds maximum allowed length of ${MAX_PASSWORD_INPUT_LENGTH} characters`
      )
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Zod validation schema for POST /api/v1/auth/change-password.
 *
 * Rules:
 * - currentPassword: Non-empty string, maximum 1024 characters.
 * - newPassword: Minimum 8 characters, maximum 1024 characters.
 * - refine: New password cannot be identical to current password.
 * - strict: Unknown fields are strictly rejected.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: 'Current password is required',
        invalid_type_error: 'Current password must be a string'
      })
      .min(1, 'Current password cannot be empty')
      .max(
        MAX_PASSWORD_INPUT_LENGTH,
        `Current password exceeds maximum allowed length of ${MAX_PASSWORD_INPUT_LENGTH} characters`
      ),
    newPassword: z
      .string({
        required_error: 'New password is required',
        invalid_type_error: 'New password must be a string'
      })
      .min(
        MIN_PASSWORD_INPUT_LENGTH,
        `New password must be at least ${MIN_PASSWORD_INPUT_LENGTH} characters long`
      )
      .max(
        MAX_PASSWORD_INPUT_LENGTH,
        `New password exceeds maximum allowed length of ${MAX_PASSWORD_INPUT_LENGTH} characters`
      )
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be identical to current password',
    path: ['newPassword']
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Generic Express request body validation middleware factory.
 * Enforces schema validation, attaches sanitized data to req.body, and returns
 * standardized 400 Bad Request error responses matching API envelope conventions.
 * Never exposes raw submitted passwords or secret values in error payloads.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
        let field = issue.path.join('.');
        if (!field && 'keys' in issue && Array.isArray((issue as { keys: unknown[] }).keys)) {
          field = (issue as { keys: string[] }).keys.join(', ');
        }
        return {
          field: field || 'body',
          code: issue.code.toUpperCase(),
          message: issue.message
        };
      });

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request payload contains invalid or missing fields',
          details
        }
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Pre-configured validation middleware for POST /api/v1/auth/login.
 */
export const validateLoginRequest = validateBody(loginSchema);

/**
 * Pre-configured validation middleware for POST /api/v1/auth/change-password.
 */
export const validateChangePasswordRequest = validateBody(changePasswordSchema);
