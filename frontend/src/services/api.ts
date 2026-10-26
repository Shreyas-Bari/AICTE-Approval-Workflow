import {
  ApiErrorDetail,
  ApiErrorEnvelope,
  ApiHealthStatus,
  ChangePasswordPayload,
  LoginCredentials,
  LoginResponse,
  MeResponse,
  MessageResponse,
} from '../types';

/**
 * Standardized API client error matching the backend error envelope (§6.2).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(
    status: number,
    message: string,
    code: string = 'API_ERROR',
    details?: ApiErrorDetail[],
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiRequestOptions extends RequestInit {
  _isRetry?: boolean;
  skipAuthRefresh?: boolean;
}

/**
 * Reads the readable `XSRF-TOKEN` cookie set by the backend CSRF middleware.
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Resolves the final target URL with configured base URL if specified.
 */
export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const rawBase =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;
  const base = (rawBase as string | undefined)?.replace(/\/+$/, '') || '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}


// ---------------------------------------------------------------------------
// Session Expiration Subscription System
// ---------------------------------------------------------------------------
type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Registers a callback invoked whenever an active session is confirmed expired.
 * Returns an unsubscription function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

/**
 * Notifies all registered listeners that the session has expired.
 */
export function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    try {
      listener();
    } catch (error) {
      console.error('[API Client] Error in session expiration listener:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Single-Flight Refresh Mutex
// ---------------------------------------------------------------------------
let activeRefreshPromise: Promise<boolean> | null = null;

/**
 * Dedicated refresh function executed through an isolated path.
 * Guarantees zero recursive calls to `apiFetch`.
 */
async function executeRefreshRequest(): Promise<boolean> {
  const refreshUrl = resolveApiUrl('/api/v1/auth/refresh');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      return true;
    }

    notifySessionExpired();
    return false;
  } catch {
    notifySessionExpired();
    return false;
  }
}

/**
 * Single-flight refresh mutex:
 * Serializes concurrent refresh calls so that exactly one refresh HTTP request
 * is in flight at any given moment. All concurrent callers share the same promise.
 */
export async function refreshAuthSession(): Promise<boolean> {
  if (!activeRefreshPromise) {
    activeRefreshPromise = executeRefreshRequest().finally(() => {
      activeRefreshPromise = null;
    });
  }
  return activeRefreshPromise;
}

/**
 * Evaluates whether a 401 response is eligible for automatic token refresh.
 */
function isRefreshEligible(endpoint: string, options?: ApiRequestOptions): boolean {
  if (options?._isRetry || options?.skipAuthRefresh) {
    return false;
  }

  const cleanEndpoint = endpoint.split('?')[0].toLowerCase();
  if (
    cleanEndpoint.endsWith('/api/v1/auth/login') ||
    cleanEndpoint.endsWith('/api/v1/auth/refresh') ||
    cleanEndpoint.endsWith('/api/v1/auth/logout')
  ) {
    return false;
  }

  return true;
}

/**
 * Parses response JSON or extracts backend error envelope.
 */
async function parseResponseOrThrow<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let body: unknown = null;
  if (isJson) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as ApiErrorEnvelope | null;
    const errorData = envelope?.error;
    const message = errorData?.message || `Request failed with HTTP status ${response.status}`;
    const code = errorData?.code || `HTTP_${response.status}`;
    const details = errorData?.details;
    const requestId = errorData?.requestId;

    throw new ApiError(response.status, message, code, details, requestId);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Core HTTP Transport (apiFetch)
// ---------------------------------------------------------------------------
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Primary HTTP transport function.
 * Handles credential inclusion, CSRF header attachment, error envelop parsing,
 * and single-flight token refresh retry logic.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();

  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let body = options.body;
  if (
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    body = JSON.stringify(body);
  }

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }


  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', csrfToken);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
    body,
    credentials: 'include',
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401 && isRefreshEligible(endpoint, options)) {
    const refreshSuccessful = await refreshAuthSession();

    if (refreshSuccessful) {
      // Refresh succeeded; replay the request once with fresh headers/cookies
      return apiFetch<T>(endpoint, {
        ...options,
        _isRetry: true,
      });
    }

    // Refresh failed or session expired; reject with safe expired error
    throw new ApiError(401, 'Session expired. Please log in again.', 'SESSION_EXPIRED');
  }

  return parseResponseOrThrow<T>(response);
}

// ---------------------------------------------------------------------------
// API Client Facade
// ---------------------------------------------------------------------------
export const apiClient = {
  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body as BodyInit,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as BodyInit,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body as BodyInit,
    });
  },

  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Submits credentials to POST /api/v1/auth/login.
   */
  login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthRefresh: true,
    });
  },

  /**
   * Requests session termination at POST /api/v1/auth/logout.
   */
  logout(): Promise<MessageResponse> {
    return apiFetch<MessageResponse>('/api/v1/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  },

  /**
   * Directly triggers session token rotation at POST /api/v1/auth/refresh.
   */
  refreshToken(): Promise<MessageResponse> {
    return apiFetch<MessageResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  },

  /**
   * Queries the safe current user profile at GET /api/v1/me.
   */
  getMe(): Promise<MeResponse> {
    return apiFetch<MeResponse>('/api/v1/me', {
      method: 'GET',
    });
  },

  /**
   * Submits current and new password at POST /api/v1/auth/change-password.
   */
  changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    return apiFetch<MessageResponse>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Preserved API health check.
 */
export async function checkBackendHealth(): Promise<ApiHealthStatus> {
  const response = await fetch(resolveApiUrl('/api/health'), {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API health check returned HTTP ${response.status}`);
  }

  return response.json();
}
