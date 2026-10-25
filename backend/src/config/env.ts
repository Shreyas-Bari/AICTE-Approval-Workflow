import dotenv from 'dotenv';
import { validateEnv, validateDatabaseEnv, EnvConfig, DatabaseEnvConfig } from '../validators/env.validator.js';

// Load local environment variables if available
dotenv.config();

export const env: EnvConfig = validateEnv();

export function getDatabaseEnv(): DatabaseEnvConfig {
  return validateDatabaseEnv(env);
}

export { validateEnv, validateDatabaseEnv, EnvConfig, DatabaseEnvConfig };
