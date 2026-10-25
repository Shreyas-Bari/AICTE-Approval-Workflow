import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface DatabaseEnvConfig {
  DATABASE_URL: string;
  DIRECT_URL?: string;
}

export function validateEnv(rawEnv: Record<string, unknown> = process.env): EnvConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('Environment configuration validation failed:', formatted);
    throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}

/**
 * Validates that required database configuration is present.
 * Used by database-dependent operations (e.g. database client initialization, readiness checks).
 * Allows database-independent tests and process-liveness checks to run without database credentials,
 * while ensuring database-dependent operations fail clearly and safely when configuration is missing.
 */
export function validateDatabaseEnv(config: EnvConfig = validateEnv()): DatabaseEnvConfig {
  const databaseUrl = config.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      'Database configuration missing: DATABASE_URL is required for database-dependent operations. ' +
      'Please configure backend/.env using backend/.env.example.'
    );
  }
  return {
    DATABASE_URL: databaseUrl,
    DIRECT_URL: config.DIRECT_URL?.trim() || undefined
  };
}
