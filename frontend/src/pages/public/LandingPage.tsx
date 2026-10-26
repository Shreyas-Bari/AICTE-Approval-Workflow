import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { StatusCard } from '../../components/shared/StatusCard';
import { Badge } from '../../components/ui/badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 shadow-xs relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-surface-subtle rounded-full blur-3xl pointer-events-none opacity-70" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">AICTE Approval Workflow</Badge>
            <Badge variant="default" className="text-text-secondary bg-surface-muted border-border/80">
              Independent Prototype &bull; SIH26262
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-strong tracking-tight leading-tight">
            Integrated Regulatory Approval &amp; Compliance Workflow System
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            An independent workflow automation prototype modeling the institutional approval lifecycle:
            multi-tier scrutiny work queues, deficiency tracking, expert visit committee (EVC)
            coordination, and statutory compliance monitoring in alignment with the AICTE Approval Process
            Handbook.
          </p>

          {/* Primary Action Group */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover active:bg-primary-active shadow-xs transition-colors"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium text-text-primary bg-surface hover:bg-surface-muted border border-border transition-colors"
            >
              Explore Workflow Modules
            </a>
          </div>

          {/* Prototype Notice Strip */}
          <div className="pt-6 border-t border-border flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              <strong className="text-text-primary">Research &amp; Demonstration Prototype:</strong> Developed
              for the AICTE Approval Workflow Automation problem statement (SIH26262). Not an official service
              of the All India Council for Technical Education. All formal regulatory decisions remain
              exclusively with authorized officials.
            </p>
          </div>
        </div>
      </section>

      {/* Regulated Workflow Subsystems Grid */}
      <section id="workflow" className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-strong tracking-tight">
            Workflow Subsystems &amp; Lifecycle Modules
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Core functional stages modeled after statutory approval processes and handbook requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusCard
            title="Institutional Applications"
            icon={<FileText className="w-5 h-5 text-primary" />}
            badge={<Badge variant="subtle">Institution Portal</Badge>}
          >
            <p className="leading-relaxed">
              Application drafting, structured institutional data entry, document repository management,
              and formal submission tracking for technical institutions.
            </p>
          </StatusCard>

          <StatusCard
            title="Multi-Tier Scrutiny Queues"
            icon={<ShieldCheck className="w-5 h-5 text-primary" />}
            badge={<Badge variant="subtle">Official Console</Badge>}
          >
            <p className="leading-relaxed">
              Casework distribution across scrutiny officials, structured deficiency notice generation,
              observation recording, and institutional resubmission reviews.
            </p>
          </StatusCard>

          <StatusCard
            title="Committee Coordination"
            icon={<Users className="w-5 h-5 text-primary" />}
            badge={<Badge variant="subtle">Inspection Workflow</Badge>}
          >
            <p className="leading-relaxed">
              Expert visit committee (EVC) scheduling, on-site verification records, observation
              documentation, and formal committee proceeding logs.
            </p>
          </StatusCard>

          <StatusCard
            title="Compliance &amp; Audit Oversight"
            icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
            badge={<Badge variant="subtle">Oversight</Badge>}
          >
            <p className="leading-relaxed">
              Post-approval compliance obligation monitoring, deadline alerting, and tamper-resistant
              chronological audit logging for regulatory accountability.
            </p>
          </StatusCard>
        </div>
      </section>

      {/* Regulatory Framework & Standards Card */}
      <section id="specifications" className="space-y-4">
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-surface-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-text-strong">
                Regulatory Framework &amp; Procedural Guidelines
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Workflow rules, scrutiny checkpoints, and procedural stages in this prototype reflect public
                provisions of the AICTE Approval Process Handbook (APH 2024–2027) and approved problem statement
                specifications (SIH26262).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-surface-muted rounded-lg border border-border/70">
              <span className="text-xs font-semibold text-text-strong block">Role-Enforced Workflows</span>
              <p className="text-xs text-text-secondary mt-1">Strict separation of statutory duties &bull; RBAC</p>
            </div>

            <div className="p-3.5 bg-surface-muted rounded-lg border border-border/70">
              <span className="text-xs font-semibold text-text-strong block">Session Protection</span>
              <p className="text-xs text-text-secondary mt-1">HttpOnly session cookies &bull; Single-use token rotation</p>
            </div>

            <div className="p-3.5 bg-surface-muted rounded-lg border border-border/70">
              <span className="text-xs font-semibold text-text-strong block">Human Decision Boundary</span>
              <p className="text-xs text-text-secondary mt-1">Statutory decisions reserved exclusively for authorized officials</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
