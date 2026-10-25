import React, { useState, useEffect } from 'react';
import {
  Server,
  Layers,
  Database,
  Radio,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { StatusCard } from '../../components/shared/StatusCard';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { checkBackendHealth } from '../../services/api';
import { ApiHealthStatus } from '../../types';

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(false);

  const performHealthCheck = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : 'Failed to reach API endpoint');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-surface-subtle rounded-full blur-3xl pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="subtle">
              Initial Project Skeleton &bull; Phase 0 Foundation
            </Badge>
            <Badge variant="default" className="text-text-secondary bg-surface-muted">
              Independent Prototype &bull; Not Official AICTE Portal
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-strong tracking-tight">
            Integrated AICTE Approval Workflow Automation &amp; Compliance System
          </h1>

          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            An independent research and workflow automation prototype designed for the AICTE Approval
            Workflow Automation problem statement (SIH26262), modeling institutional application
            submission, multi-tier scrutiny queues, expert visit coordination (EVC), and compliance tracking.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={performHealthCheck}
              disabled={isLoadingHealth}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
              Test API Health
            </Button>
            <a
              href="#specifications"
              className="inline-flex items-center justify-center px-4 py-2 border border-border text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface-muted transition-colors"
            >
              View Approved Specifications
            </a>
          </div>
        </div>
      </section>

      {/* Live Health Status Card */}
      <section className="grid grid-cols-1 gap-6">
        <StatusCard
          title="Backend Process Health Check"
          icon={<Server className="w-5 h-5" />}
          badge={
            health ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Online (200 OK)
              </Badge>
            ) : healthError ? (
              <Badge variant="danger" className="gap-1">
                <XCircle className="w-3.5 h-3.5" /> API Offline
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <Clock className="w-3.5 h-3.5" /> Probing...
              </Badge>
            )
          }
        >
          <div className="mt-2 text-sm">
            {health ? (
              <div className="space-y-2">
                <p className="text-text-primary font-medium">
                  Backend API server process is responding via <code className="bg-surface-muted px-1.5 py-0.5 rounded text-xs font-mono">GET /api/health</code>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border/60">
                    <span className="text-xs text-text-secondary block">Status</span>
                    <span className="font-semibold text-success">{health.status.toUpperCase()}</span>
                  </div>
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border/60">
                    <span className="text-xs text-text-secondary block">API Process</span>
                    <span className="font-semibold text-text-strong">Online</span>
                  </div>
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border/60">
                    <span className="text-xs text-text-secondary block">Uptime</span>
                    <span className="font-semibold text-text-strong">{health.uptimeSeconds}s</span>
                  </div>
                  <div className="bg-surface-subtle p-3 rounded-lg border border-border/60">
                    <span className="text-xs text-text-secondary block">Version</span>
                    <span className="font-semibold text-text-strong">{health.version}</span>
                  </div>
                </div>
              </div>
            ) : healthError ? (
              <div className="text-danger bg-danger-bg p-3 rounded-lg border border-danger/20">
                <p className="font-medium">Connection Error:</p>
                <p className="text-xs mt-1 font-mono">{healthError}</p>
                <p className="text-xs mt-2 text-text-secondary">
                  Ensure the backend development server is running via <code className="bg-surface px-1 py-0.5 rounded">npm run dev:backend</code> on port 5000.
                </p>
              </div>
            ) : (
              <p className="text-text-secondary">Checking connectivity with the backend service...</p>
            )}
          </div>
        </StatusCard>
      </section>

      {/* Architecture Foundations Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-strong">
          Architectural Foundation &amp; Technology Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            title="Frontend Application"
            icon={<Layers className="w-5 h-5" />}
            badge={<Badge variant="subtle">React 18 + Vite</Badge>}
          >
            <p className="mt-1">
              TypeScript, Tailwind CSS utility styling, shadcn/ui design tokens, and React Router navigation.
            </p>
          </StatusCard>

          <StatusCard
            title="Backend API Service"
            icon={<Server className="w-5 h-5" />}
            badge={<Badge variant="subtle">Express + TS</Badge>}
          >
            <p className="mt-1">
              Modular REST API, Zod schema validation, central error handling, and structured request logging.
            </p>
          </StatusCard>

          <StatusCard
            title="Relational Persistence"
            icon={<Database className="w-5 h-5" />}
            badge={<Badge variant="warning">Neon + Prisma</Badge>}
          >
            <p className="mt-1">
              Neon PostgreSQL baseline. Schema models pending formal contract reconciliation in Phase 2.
            </p>
          </StatusCard>

          <StatusCard
            title="Real-Time Transport"
            icon={<Radio className="w-5 h-5" />}
            badge={<Badge variant="default">Socket.IO</Badge>}
          >
            <p className="mt-1">
              Approved Socket.IO transport with server-side authentication and institutional room scope validation.
            </p>
          </StatusCard>
        </div>
      </section>

      {/* Specifications & Boundaries Section */}
      <section id="specifications" className="space-y-4">
        <h2 className="text-xl font-semibold text-text-strong">
          Approved Specifications &amp; Architectural Governance
        </h2>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-start space-x-3">
            <FileCheck2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-text-strong">
                Authoritative Specification Baseline
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                The canonical project requirements, UI/UX tokens, database schemas, and API contracts are
                preserved byte-for-byte in <code className="bg-surface-muted px-1.5 py-0.5 rounded text-xs font-mono">docs/project-baseline/</code>.
                Current authority for technology decisions is governed by{' '}
                <span className="font-semibold text-text-primary">
                  docs/project-baseline/refined/FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md
                </span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-surface-muted rounded-lg border border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-strong">Architecture</span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-text-secondary mt-1">Modular monolith, custom RBAC, no microservices</p>
            </div>

            <div className="p-3 bg-surface-muted rounded-lg border border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-strong">Authentication Direction</span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-text-secondary mt-1">Auth.js / JWT HTTP-only cookie; Better Auth excluded</p>
            </div>

            <div className="p-3 bg-surface-muted rounded-lg border border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-strong">Statutory Boundary</span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-text-secondary mt-1">Human authority preserved; AI/OCR strictly deferred</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
