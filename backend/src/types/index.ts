export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
