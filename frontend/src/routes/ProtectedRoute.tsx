import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route protection wrapper for authenticated routes.
 *
 * Behavior:
 * - While session probe is loading: renders a centered session verification spinner.
 * - If unauthenticated: redirects to /login preserving the attempted location in state.
 * - If authenticated: renders child routes via <Outlet /> or explicitly passed children.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-text-secondary font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
