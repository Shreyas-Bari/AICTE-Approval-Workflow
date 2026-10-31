import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import {
  listInstitutionsHandler,
  getInstitutionByIdHandler
} from '../controllers/institution.controller.js';
import { validateInstitutionIdParam } from '../validators/institution.validator.js';

export const institutionRouter = Router();

// All institution operations require CSRF protection and authentication
institutionRouter.use(csrfProtection, authenticate);

// GET /api/v1/institutions - List institutions within caller's permitted scope (§8.4)
institutionRouter.get('/', listInstitutionsHandler);

// GET /api/v1/institutions/:institutionId - Read permitted institution details (§8.4)
institutionRouter.get('/:institutionId', validateInstitutionIdParam, getInstitutionByIdHandler);
