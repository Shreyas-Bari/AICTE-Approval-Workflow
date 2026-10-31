import { Request, Response, NextFunction } from 'express';
import { ApplicationCategoryService } from '../services/applicationCategory.service.js';

/**
 * GET /api/v1/application-categories
 *
 * Lists only categories and configurations approved for this release (§8.4).
 * Adheres to standard success envelope (§6.1).
 */
export async function listApplicationCategoriesHandler(
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

    const { categories, version } = ApplicationCategoryService.listApprovedCategories();

    res.status(200).json({
      data: {
        categories
      },
      meta: {
        catalogueVersion: version
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/application-categories/:categoryId
 *
 * Reads permitted category metadata and applicability status (§8.4).
 * Returns 404 NOT_FOUND if the category identifier is not in the approved active catalogue.
 * Adheres to standard success envelope (§6.1) and error envelope (§6.2).
 */
export async function getApplicationCategoryByIdHandler(
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

    const categoryId = Array.isArray(req.params.categoryId)
      ? req.params.categoryId[0]
      : req.params.categoryId;

    const category = ApplicationCategoryService.getCategoryById(categoryId);

    if (!category) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Application category not found or not active in the current catalogue release'
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        category
      }
    });
  } catch (err) {
    next(err);
  }
}
