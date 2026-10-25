import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'subtle';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps): React.JSX.Element {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide';

  const variants = {
    default: 'bg-surface-muted text-text-primary border border-border',
    success: 'bg-success-bg text-success border border-success/20',
    warning: 'bg-warning-bg text-warning border border-warning/20',
    danger: 'bg-danger-bg text-danger border border-danger/20',
    info: 'bg-info-bg text-info border border-info/20',
    subtle: 'bg-surface-subtle text-primary border border-primary/20'
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
