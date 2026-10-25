import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`AICTE Backend API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`CORS allowed origin: ${env.CLIENT_URL}`);
  logger.info(`Health check available at http://localhost:${env.PORT}/api/health`);
});

// Handle graceful process shutdown
function handleGracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Initiating graceful server termination...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during HTTP server shutdown:', err);
      process.exit(1);
    }
    logger.info('HTTP server closed successfully. Process exiting.');
    process.exit(0);
  });

  // Safety timer to prevent hanging terminations
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
