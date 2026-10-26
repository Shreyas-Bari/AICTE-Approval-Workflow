export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

export interface LivenessResponse {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface DatabaseCheckResult {
  status: 'connected' | 'disconnected' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    process: {
      status: 'up';
    };
    database: DatabaseCheckResult;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export * from './auth.js';
