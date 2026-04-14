import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-surface-900 dark:text-surface-50', className)}>{children}</h3>;
}

export function CardDescription({ className, children }: CardProps) {
  return <p className={cn('text-sm text-surface-500 dark:text-surface-400', className)}>{children}</p>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('', className)}>{children}</div>;
}
