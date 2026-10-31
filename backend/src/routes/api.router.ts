import { Router } from 'express';
import { healthRouter } from './health.router.js';
import { authRouter } from './auth.router.js';
import { institutionRouter } from './institution.router.js';
import { applicationCategoryRouter } from './applicationCategory.router.js';
import { applicationRouter } from './application.router.js';
import { getMeHandler } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';

export const apiRouter = Router();

// Health check endpoint mounted at /api/health
apiRouter.use('/health', healthRouter);

// Version 1 API router (/api/v1)
export const v1Router = Router();

// Authentication session lifecycle routes (/api/v1/auth/*)
v1Router.use('/auth', authRouter);

// Canonical current-user profile endpoint (§8.2: GET /api/v1/me)
v1Router.get('/me', csrfProtection, authenticate, getMeHandler);

// Canonical institutions endpoints (§8.4: /api/v1/institutions/*)
v1Router.use('/institutions', institutionRouter);

// Canonical application categories catalogue endpoints (§8.4: /api/v1/application-categories/*)
v1Router.use('/application-categories', applicationCategoryRouter);

// Canonical applications and intake endpoints (§8.5: /api/v1/applications/*)
v1Router.use('/applications', applicationRouter);

apiRouter.use('/v1', v1Router);
