import { Request, Response, NextFunction } from 'express';
import {
  getInstitutionsForUser,
  getInstitutionByIdForUser
} from '../services/institution.service.js';

/**
 * GET /api/v1/institutions
 *
 * Lists all institutions within the caller's permitted scope.
 * Scoped strictly to institutions where the authenticated caller holds an active membership.
 * Adheres to canonical API specification §8.4 and response envelope §6.1.
 */
export async function listInstitutionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const institutions = await getInstitutionsForUser(userId);

    res.status(200).json({
      data: {
        institutions
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/institutions/:institutionId
 *
 * Reads permitted institution details for the specified institution.
 * Enforces tenant data isolation: verifies active membership before returning institution data.
 * Adheres to canonical API specification §8.4, response envelope §6.1, and error envelope §6.2.
 */
export async function getInstitutionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const institutionId = Array.isArray(req.params.institutionId)
      ? req.params.institutionId[0]
      : req.params.institutionId;

    const result = await getInstitutionByIdForUser(institutionId, userId);

    if (!result.success) {
      const statusCode = result.error === 'FORBIDDEN' ? 403 : 404;
      res.status(statusCode).json({
        error: {
          code: result.error,
          message: result.message
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        institution: result.institution
      }
    });
  } catch (err) {
    next(err);
  }
}
