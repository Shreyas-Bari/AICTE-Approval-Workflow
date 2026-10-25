import { Router } from 'express';
import { getHealth, getLiveness, getReadiness } from '../controllers/health.controller.js';

export const healthRouter = Router();

// General health check (backward compatible)
healthRouter.get('/', getHealth);

// Process liveness check (§8.1 /health/live)
healthRouter.get('/live', getLiveness);

// Dependency readiness check (§8.1 /health/ready)
healthRouter.get('/ready', getReadiness);
