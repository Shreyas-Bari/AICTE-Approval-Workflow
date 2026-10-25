import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './database/index.js';

let isShuttingDown = false;

async function startServer(): Promise<void> {
  // Connect to database if credentials are configured
  if (env.DATABASE_URL) {
    try {
      await connectDatabase();
    } catch (err) {
      logger.warn(
        'Database connection could not be established at startup; server continuing in degraded mode. ' +
        'Process liveness checks remain available, but readiness will report not_ready.'
      );
    }
  } else {
    logger.warn(
      'DATABASE_URL is not configured; running in database-disconnected mode. ' +
      'Process liveness checks remain available, but readiness will report not_ready.'
    );
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`AICTE Backend API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`CORS allowed origin: ${env.CLIENT_URL}`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/health`);
    logger.info(`Liveness check available at http://localhost:${env.PORT}/health/live`);
    logger.info(`Readiness check available at http://localhost:${env.PORT}/health/ready`);
  });

  server.on('error', (err) => {
    logger.error('HTTP server encountered an error during startup/runtime:', err);
    process.exit(1);
  });

  // Handle graceful process shutdown
  async function handleGracefulShutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Initiating graceful server termination...`);

    // Safety timer to prevent hanging terminations
    const timer = setTimeout(() => {
      logger.error('Forceful shutdown triggered after 10s timeout.');
      process.exit(1);
    }, 10000);
    timer.unref();

    server.close(async (err) => {
      if (err) {
        logger.error('Error during HTTP server shutdown:', err);
      } else {
        logger.info('HTTP server closed successfully.');
      }

      try {
        await disconnectDatabase();
      } catch (dbErr) {
        logger.error('Error during database disconnection:', dbErr);
      }

      process.exit(err ? 1 : 0);
    });
  }

  process.on('SIGTERM', () => void handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void handleGracefulShutdown('SIGINT'));
}

void startServer().catch((err) => {
  logger.error('Fatal unhandled error during server startup:', err);
  process.exit(1);
});
