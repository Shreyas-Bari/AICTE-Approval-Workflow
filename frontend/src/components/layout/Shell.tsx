import React from 'react';
import { cn } from '../../utils/cn';

export interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ className, children, ...props }) => {
  return (
    <main className={cn('flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8', className)} {...props}>
      {children}
    </main>
  );
};
