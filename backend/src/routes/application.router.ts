import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import {
  createApplicationDraftHandler,
  listApplicationsHandler,
  getApplicationByIdHandler,
  updateApplicationDraftHandler
} from '../controllers/application.controller.js';
import {
  validateCreateApplicationDraft,
  validateUpdateApplicationDraft,
  validateApplicationIdParam
} from '../validators/application.validator.js';

export const applicationRouter = Router();

// All application operations require CSRF protection and authentication (§8.5)
applicationRouter.use(csrfProtection, authenticate);

// POST /api/v1/applications - Create an application draft with institution/category (§8.5)
applicationRouter.post('/', validateCreateApplicationDraft, createApplicationDraftHandler);

// GET /api/v1/applications - Search/list applications within caller's institution scope (§8.5)
applicationRouter.get('/', listApplicationsHandler);

// GET /api/v1/applications/:applicationId - Read permitted application summary (§8.5)
applicationRouter.get('/:applicationId', validateApplicationIdParam, getApplicationByIdHandler);

// PATCH /api/v1/applications/:applicationId - Edit draft-only fields (§8.5, FR-005)
applicationRouter.patch(
  '/:applicationId',
  validateApplicationIdParam,
  validateUpdateApplicationDraft,
  updateApplicationDraftHandler
);
