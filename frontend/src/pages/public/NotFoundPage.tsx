import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-warning-bg border border-warning/30 flex items-center justify-center text-warning mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-bold text-text-strong tracking-tight">404 - Page Not Found</h1>
      <p className="mt-3 text-base text-text-secondary max-w-md">
        The requested workflow page or resource could not be found. Please check the URL or return to the overview page.
      </p>

      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
};
