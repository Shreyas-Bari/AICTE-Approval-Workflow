import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service.js';

/**
 * POST /api/v1/applications
 *
 * Creates an application draft for an institution (§8.5).
 * Validates tenant membership and category eligibility.
 * Returns 201 Created adhering to standard success envelope (§6.1).
 */
export async function createApplicationDraftHandler(
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

    const result = await ApplicationService.createDraft(userId, req.body);

    if (!result.success) {
      if (result.error === 'FORBIDDEN') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: result.message
          }
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.message
        }
      });
      return;
    }

    res.status(201).json({
      data: {
        application: result.application
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/applications
 *
 * Lists all applications within the caller's institution scope (§8.5).
 */
export async function listApplicationsHandler(
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

    const applications = await ApplicationService.listApplicationsForUser(userId);

    res.status(200).json({
      data: {
        applications
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/applications/:applicationId
 *
 * Reads permitted application summary by ID (§8.5).
 * Enforces tenant isolation with anti-enumeration.
 */
export async function getApplicationByIdHandler(
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

    const applicationId = Array.isArray(req.params.applicationId)
      ? req.params.applicationId[0]
      : req.params.applicationId;

    const result = await ApplicationService.getApplicationById(userId, applicationId);

    if (!result.success) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: result.message
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        application: result.application
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/applications/:applicationId
 *
 * Edits draft-only application fields (§8.5).
 * Enforces that only applications in 'DRAFT' status may be modified (FR-005).
 */
export async function updateApplicationDraftHandler(
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

    const applicationId = Array.isArray(req.params.applicationId)
      ? req.params.applicationId[0]
      : req.params.applicationId;

    const result = await ApplicationService.updateDraft(userId, applicationId, req.body);

    if (!result.success) {
      if (result.error === 'CONFLICT') {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: result.message
          }
        });
        return;
      }

      if (result.error === 'FORBIDDEN') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: result.message
          }
        });
        return;
      }

      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: result.message
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        application: result.application
      }
    });
  } catch (err) {
    next(err);
  }
}
