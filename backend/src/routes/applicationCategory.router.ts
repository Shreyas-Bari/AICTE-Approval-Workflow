import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import {
  listApplicationCategoriesHandler,
  getApplicationCategoryByIdHandler
} from '../controllers/applicationCategory.controller.js';
import { validateCategoryIdParam } from '../validators/applicationCategory.validator.js';

export const applicationCategoryRouter = Router();

// All application category operations require CSRF protection and authentication (§8.4)
applicationCategoryRouter.use(csrfProtection, authenticate);

// GET /api/v1/application-categories - List approved categories for this release (§8.4)
applicationCategoryRouter.get('/', listApplicationCategoriesHandler);

// GET /api/v1/application-categories/:categoryId - Read category metadata & applicability (§8.4)
applicationCategoryRouter.get('/:categoryId', validateCategoryIdParam, getApplicationCategoryByIdHandler);
