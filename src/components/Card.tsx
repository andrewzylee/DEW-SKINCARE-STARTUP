import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

// Surface container: big rounding, soft single-direction shadow, hairline optional.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card bg-surface shadow-card', className)} {...props} />;
}
