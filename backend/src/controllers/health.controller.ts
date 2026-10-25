import { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';

export function getHealth(_req: Request, res: Response): void {
  const healthData = HealthService.getHealth();
  res.status(200).json(healthData);
}
