import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity } from 'lucide-react';
import { Badge } from '../ui/badge';

export const Header: React.FC = () => {
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
                href="#specifications"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
              >
                Specifications
              </a>
              <Link
                to="/login"
                className="ml-2 inline-flex items-center justify-center px-3.5 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
