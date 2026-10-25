import React from 'react';
import { cn } from '../../utils/cn';

export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  badge,
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl p-6 shadow-xs hover:border-border-strong transition-all duration-200',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="text-base font-semibold text-text-strong">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
};
