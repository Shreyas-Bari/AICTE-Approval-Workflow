export {
  prisma,
  getDatabaseClient,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  type DatabaseHealthResult
} from './client.js';
