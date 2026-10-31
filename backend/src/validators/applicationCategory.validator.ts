import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationErrorDetail } from './auth.validator.js';

/**
 * Zod schema for validating route parameters on application category endpoints.
 * Enforces valid UUID v4 format for categoryId.
 */
export const categoryIdParamSchema = z
  .object({
    categoryId: z
      .string({
        required_error: 'Category ID is required',
        invalid_type_error: 'Category ID must be a string'
      })
      .uuid('Invalid category ID format; must be a valid UUID')
  })
  .strict();

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;

/**
 * Validation middleware for endpoints requiring :categoryId in route parameters.
 * Validates that the supplied parameter conforms to UUID format.
 * Returns standardized 400 VALIDATION_ERROR matching API envelope (§6.2).
 */
export function validateCategoryIdParam(req: Request, res: Response, next: NextFunction): void {
  const result = categoryIdParamSchema.safeParse(req.params);

  if (!result.success) {
    const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
      const field = issue.path.join('.') || 'categoryId';
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
