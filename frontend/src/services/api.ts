import { ApiHealthStatus } from '../types';

export async function checkBackendHealth(): Promise<ApiHealthStatus> {
  const response = await fetch('/api/health', {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API health check returned HTTP ${response.status}`);
  }

  return response.json();
}
