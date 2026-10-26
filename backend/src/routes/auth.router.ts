import { Router } from 'express';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler
} from '../controllers/auth.controller.js';
import {
  validateLoginRequest,
  validateChangePasswordRequest
} from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';

export const authRouter = Router();

/**
 * POST /api/v1/auth/login
 * Pipeline: CSRF protection -> Request body validation -> Login controller handler
 */
authRouter.post('/login', csrfProtection, validateLoginRequest, loginHandler);

/**
 * POST /api/v1/auth/refresh
 * Pipeline: CSRF protection -> Token rotation controller handler
 */
authRouter.post('/refresh', csrfProtection, refreshHandler);

/**
 * POST /api/v1/auth/logout
 * Pipeline: CSRF protection -> Idempotent logout controller handler
 * (Does not require authenticate middleware so logout succeeds even with expired access token)
 */
authRouter.post('/logout', csrfProtection, logoutHandler);

/**
 * POST /api/v1/auth/change-password
 * Pipeline: CSRF protection -> Authentication -> Request body validation -> Change password controller handler
 */
authRouter.post(
  '/change-password',
  csrfProtection,
  authenticate,
  validateChangePasswordRequest,
  changePasswordHandler
);
