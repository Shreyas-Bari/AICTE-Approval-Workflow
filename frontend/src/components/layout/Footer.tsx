import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-surface-subtle border border-border rounded-lg p-4 mb-6 text-xs text-text-secondary flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-text-primary">
              Independent Prototype Notice &bull; Statutory Authority
            </p>
            <p className="mt-1 leading-relaxed">
              This system is an independent software prototype developed for the AICTE Approval Workflow Automation
              problem statement (SIH26262). It is not affiliated with, authorized by, or an official service of the
              All India Council for Technical Education (AICTE). Workflow rules and eligibility models reflect public
              provisions of the AICTE Approval Process Handbook (APH 2024–2027). Statutory decisions and regulatory
              orders are reserved exclusively for authorized AICTE officials.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-text-secondary space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>AICTE Approval Workflow Automation Platform &bull; Version 0.1.0</span>
          </div>

          <div className="flex space-x-6">
            <span>Approved Baseline: docs/project-baseline/</span>
            <span>Modular Monolith Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
