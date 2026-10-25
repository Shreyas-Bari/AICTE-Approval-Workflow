import { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';

export function getHealth(_req: Request, res: Response): void {
  const healthData = HealthService.getHealth();
  res.status(200).json(healthData);
}

export function getLiveness(_req: Request, res: Response): void {
  const livenessData = HealthService.getLiveness();
  res.status(200).json(livenessData);
}

export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const { statusCode, data } = await HealthService.getReadiness();
  res.status(statusCode).json(data);
}
