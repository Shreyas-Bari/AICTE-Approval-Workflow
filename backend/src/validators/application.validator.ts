import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationErrorDetail } from './auth.validator.js';

/**
 * Route parameter validation schema for application endpoints (:applicationId).
 */
export const applicationIdParamSchema = z
  .object({
    applicationId: z
      .string({
        required_error: 'Application ID is required',
        invalid_type_error: 'Application ID must be a string'
      })
      .uuid('Invalid application ID format; must be a valid UUID')
  })
  .strict();

/**
 * Request body validation schema for creating an application draft (§8.5).
 * Rejects unauthorized client-supplied authoritative fields (e.g. status, internalReference).
 */
export const createApplicationDraftSchema = z
  .object({
    institutionId: z
      .string({
        required_error: 'institutionId is required',
        invalid_type_error: 'institutionId must be a string'
      })
      .uuid('institutionId must be a valid UUID'),
    categoryId: z
      .string({
        required_error: 'categoryId is required',
        invalid_type_error: 'categoryId must be a string'
      })
      .uuid('categoryId must be a valid UUID'),
    academicCycle: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'academicCycle must be in YYYY-YYYY format (e.g. 2024-2025)')
      .optional(),
    intakePayload: z.record(z.unknown()).optional()
  })
  .strict();

/**
 * Request body validation schema for updating an application draft (§8.5).
 */
export const updateApplicationDraftSchema = z
  .object({
    intakePayload: z.record(z.unknown()).optional()
  })
  .strict();

export type CreateApplicationDraftBody = z.infer<typeof createApplicationDraftSchema>;
export type UpdateApplicationDraftBody = z.infer<typeof updateApplicationDraftSchema>;
export type ApplicationIdParam = z.infer<typeof applicationIdParamSchema>;

/**
 * Middleware: Validates route parameter :applicationId.
 */
export function validateApplicationIdParam(req: Request, res: Response, next: NextFunction): void {
  const result = applicationIdParamSchema.safeParse(req.params);

  if (!result.success) {
    const details: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'applicationId',
      code: issue.code.toUpperCase(),
      message: issue.message
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid route parameters',
        details
      }
    });
    return;
  }

  next();
}

/**
 * Middleware: Validates body for POST /api/v1/applications.
 */
export function validateCreateApplicationDraft(req: Request, res: Response, next: NextFunction): void {
  const result = createApplicationDraftSchema.safeParse(req.body);

  if (!result.success) {
    const details: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      code: issue.code.toUpperCase(),
      message: issue.message
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid application draft request body',
        details
      }
    });
    return;
  }

  req.body = result.data;
  next();
}

/**
 * Middleware: Validates body for PATCH /api/v1/applications/:applicationId.
 */
export function validateUpdateApplicationDraft(req: Request, res: Response, next: NextFunction): void {
  const result = updateApplicationDraftSchema.safeParse(req.body);

  if (!result.success) {
    const details: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      code: issue.code.toUpperCase(),
      message: issue.message
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid application draft update body',
        details
      }
    });
    return;
  }

  req.body = result.data;
  next();
}
