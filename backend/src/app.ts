import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRouter } from './routes/api.router.js';
import { healthRouter } from './routes/health.router.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middleware
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(requestLogger);

  // Mount root health checks (§8.1 /health/live, /health/ready)
  app.use('/health', healthRouter);

  // Mount API routers
  app.use('/api', apiRouter);

  // Error handling and route fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app: Express = createApp();
