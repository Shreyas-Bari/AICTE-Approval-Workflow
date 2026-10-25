import { HealthResponse, LivenessResponse, ReadinessResponse } from '../types/index.js';
import { checkDatabaseHealth } from '../database/index.js';

export class HealthService {
  /**
   * Returns current general health status (backward compatible).
   * Internal environment details (e.g. NODE_ENV) and database credentials are omitted
   * to avoid exposing infrastructure configurations on public health endpoints.
   */
  public static getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '0.1.0'
    };
  }

  /**
   * Returns process liveness status.
   * Verifies only that the process is alive and responsive to HTTP traffic.
   * Never depends on external services (such as databases).
   */
  public static getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    };
  }

  /**
   * Returns application readiness status based on critical dependencies.
   * Distinguishes process liveness, overall readiness, and database connectivity.
   * Returns HTTP 200 when ready, HTTP 503 when degraded or unconfigured.
   * Never leaks connection strings, credentials, or raw driver internals.
   */
  public static async getReadiness(): Promise<{ statusCode: number; data: ReadinessResponse }> {
    const dbCheck = await checkDatabaseHealth();
    const isReady = dbCheck.status === 'connected';

    const response: ReadinessResponse = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        process: {
          status: 'up'
        },
        database: dbCheck
      }
    };

    return {
      statusCode: isReady ? 200 : 503,
      data: response
    };
  }
}
