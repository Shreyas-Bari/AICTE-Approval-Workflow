import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    DATABASE_URL: z.string().optional(),
    DIRECT_URL: z.string().optional(),
    // Authentication secrets (approved Decision Q-01)
    JWT_ACCESS_SECRET: z.string().min(32).default('dev_insecure_jwt_access_secret_min32chars_long!'),
    JWT_REFRESH_SECRET: z.string().min(32).default('dev_insecure_jwt_refresh_secret_min32chars_long!'),
    CSRF_SECRET: z.string().min(32).default('dev_insecure_csrf_secret_min32chars_long!'),
    // Provisional token lifetimes in seconds (Decision Q-01 §4.1, §5.3)
    ACCESS_TOKEN_LIFETIME_SEC: z.coerce.number().int().positive().default(900), // 15 minutes (provisional default)
    REFRESH_TOKEN_LIFETIME_SEC: z.coerce.number().int().positive().default(604800) // 7 days (provisional default)
  })
  .superRefine((data, ctx) => {
    // Distinct secret enforcement across all environments
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct secrets.',
        path: ['JWT_REFRESH_SECRET']
      });
    }
    if (data.CSRF_SECRET === data.JWT_ACCESS_SECRET || data.CSRF_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CSRF_SECRET must be distinct from JWT secrets.',
        path: ['CSRF_SECRET']
      });
    }

    if (data.NODE_ENV === 'production') {
      // Production URL fail-closed requirement
      if (data.CLIENT_URL.includes('localhost') || !data.CLIENT_URL.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_URL must be an HTTPS URL and cannot use localhost in production.',
          path: ['CLIENT_URL']
        });
      }

      if (data.JWT_ACCESS_SECRET.startsWith('dev_insecure')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET must be explicitly set to a secure 32+ character secret in production.',
          path: ['JWT_ACCESS_SECRET']
        });
      }
      if (data.JWT_REFRESH_SECRET.startsWith('dev_insecure')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET must be explicitly set to a secure 32+ character secret in production.',
          path: ['JWT_REFRESH_SECRET']
        });
      }
      if (data.CSRF_SECRET.startsWith('dev_insecure')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CSRF_SECRET must be explicitly set to a secure 32+ character secret in production.',
          path: ['CSRF_SECRET']
        });
      }
    }
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
