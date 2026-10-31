import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationErrorDetail } from './auth.validator.js';

/**
 * Zod schema for validating route parameters on institution endpoints.
 * Enforces valid UUID v4 format for institutionId.
 */
export const institutionIdParamSchema = z
  .object({
    institutionId: z
      .string({
        required_error: 'Institution ID is required',
        invalid_type_error: 'Institution ID must be a string'
      })
      .uuid('Invalid institution ID format; must be a valid UUID')
  })
  .strict();

export type InstitutionIdParam = z.infer<typeof institutionIdParamSchema>;

/**
 * Validation middleware for endpoints requiring :institutionId in route parameters.
 * Validates that the supplied parameter conforms to UUID format before passing to controller.
 * Returns standardized 400 VALIDATION_ERROR matching API envelope (§6.2).
 */
export function validateInstitutionIdParam(req: Request, res: Response, next: NextFunction): void {
  const result = institutionIdParamSchema.safeParse(req.params);

  if (!result.success) {
    const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
      const field = issue.path.join('.') || 'institutionId';
      return {
        field,
        code: issue.code.toUpperCase(),
        message: issue.message
      };
    });

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
