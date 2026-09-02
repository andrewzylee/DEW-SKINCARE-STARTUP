import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

// Small pill for skin-type / concern labels and filters. Static when no onClick.
export function Chip({ children, selected, onClick, className }: ChipProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors';
  const look = selected
    ? 'bg-accent text-white'
    : 'bg-surface text-ink border border-line hover:bg-ink/[0.03]';
  if (!onClick) {
    return <span className={cn(base, look, className)}>{children}</span>;
  }
  return (
    <button type="button" onClick={onClick} className={cn(base, 'active:scale-[0.97]', look, className)}>
      {children}
    </button>
  );
}
