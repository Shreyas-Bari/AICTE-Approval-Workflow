import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/api.router.js';
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

  app.use(express.json());
  app.use(requestLogger);

  // Mount API routers
  app.use('/api', apiRouter);

  // Error handling and route fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app: Express = createApp();
