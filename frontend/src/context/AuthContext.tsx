import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuthenticatedUserProfile,
  ChangePasswordPayload,
  LoginCredentials,
  UserSummary,
} from '../types';
import { apiClient, onSessionExpired } from '../services/api';

export interface AuthContextValue {
  user: AuthenticatedUserProfile | UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserSummary>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Module-level deduplication for the initial session probe.
 * Under React 18 StrictMode in development, components mount, unmount, and remount
 * synchronously. This single-flight probe guarantees that only one GET /api/v1/me
 * request is sent across the initial lifecycle without suppressing subsequent probes.
 */
let initialProbePromise: Promise<AuthenticatedUserProfile | null> | null = null;

function probeInitialSession(): Promise<AuthenticatedUserProfile | null> {
  if (!initialProbePromise) {
    initialProbePromise = apiClient
      .getMe()
      .then((res) => res.data.user)
      .catch(() => null)
      .finally(() => {
        initialProbePromise = null;
      });
  }
  return initialProbePromise;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUserProfile | UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial mount: probe GET /api/v1/me to verify session and bootstrap CSRF cookie
  useEffect(() => {
    let isMounted = true;

    probeInitialSession()
      .then((initialUser) => {
        if (isMounted) {
          setUser(initialUser);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Clear in-memory user when API client signals confirmed session expiration
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<UserSummary> => {
    const loginResponse = await apiClient.login(credentials);
    const loggedInUser = loginResponse.data.user;

    // Immediately fetch full profile with roles and tenant memberships
    try {
      const meResponse = await apiClient.getMe();
      setUser(meResponse.data.user);
    } catch {
      setUser(loggedInUser);
    }

    return loggedInUser;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.changePassword(payload);
    // Decision Q-01 §5.2: Password change revokes all active refresh tokens and requires re-login
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      changePassword,
    }),
    [user, isLoading, login, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access the authentication context.
 * Throws a clear error if used outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
