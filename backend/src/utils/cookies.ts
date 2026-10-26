import { CookieOptions } from 'express';
import { env } from '../config/env.js';

/**
 * Cookie options for short-lived access tokens.
 * Access tokens are stored in HttpOnly cookies inaccessible to browser JavaScript.
 */
export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.ACCESS_TOKEN_LIFETIME_SEC * 1000 // Provisional duration (default: 15 minutes)
  };
}

/**
 * Cookie options for refresh tokens.
 * Refresh tokens are stored in HttpOnly cookies strictly scoped to auth endpoints.
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth', // Strictly path-scoped to prevent exposure on regular resource requests
    maxAge: env.REFRESH_TOKEN_LIFETIME_SEC * 1000 // Provisional duration (default: 7 days)
  };
}

/**
 * Cookie options for CSRF protection token.
 * Non-HttpOnly so client-side JavaScript (e.g. Axios) can read it and send in header.
 */
export function getCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false, // Must be readable by React SPA to set request header
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
}

/**
 * Options to clear an authentication or CSRF cookie.
 * @param path - Cookie path (default: '/')
 * @param httpOnly - Whether the cookie was set as HttpOnly (default: true for auth, false for CSRF)
 */
export function getClearCookieOptions(path: string = '/', httpOnly: boolean = true): CookieOptions {
  return {
    httpOnly,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    maxAge: 0
  };
}

/**
 * Options to clear the readable CSRF cookie (httpOnly: false).
 */
export function getClearCsrfCookieOptions(): CookieOptions {
  return getClearCookieOptions('/', false);
}
