import { Router } from 'express';
import { healthRouter } from './health.router.js';

export const apiRouter = Router();

// Health check endpoint mounted at /api/health
apiRouter.use('/health', healthRouter);
