import { HealthResponse } from '../types/index.js';

export class HealthService {
  /**
   * Returns current process health status.
   * Internal environment details (e.g. NODE_ENV) and database status are omitted
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
}
