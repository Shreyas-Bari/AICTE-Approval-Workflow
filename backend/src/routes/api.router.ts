import { Router } from 'express';
import { healthRouter } from './health.router.js';
import { authRouter } from './auth.router.js';
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

apiRouter.use('/v1', v1Router);
