import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, LogOut, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context';
import { Badge } from '../ui/badge';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setIsLoggingOut(false);
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white shadow-sm group-hover:bg-primary transition-colors">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-text-strong tracking-tight">
                  AICTE Workflow Automation
                </span>
                <span className="text-xs text-text-secondary hidden sm:inline">
                  Compliance Monitoring &amp; Alert Management (Prototype)
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="subtle" className="hidden sm:inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
              Prototype Baseline
            </Badge>

            <nav className="flex items-center space-x-2">
              <Link
                to="/"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-text-primary hover:bg-surface-subtle hover:text-primary transition-colors"
              >
                Overview
              </Link>
              <a
                href="#workflow"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
              >
                Workflow
              </a>

              {isLoading ? (
                <div className="ml-2 px-3.5 py-1.5 text-xs text-text-secondary font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                </div>
              ) : isAuthenticated ? (
                <div className="ml-2 flex items-center space-x-2">
                  <span className="text-xs font-medium text-text-secondary hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-muted rounded-md border border-border/60">
                    <User className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="max-w-[160px] truncate">{user?.email || 'Authenticated'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface-muted shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5 text-text-secondary" />
                    )}
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 inline-flex items-center justify-center px-3.5 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
