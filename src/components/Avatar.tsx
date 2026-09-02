import { useState } from 'react';
import { cn } from '../lib/cn';

// Circular avatar — shows a photo when provided, otherwise initials on a tint.
const SIZE = {
  xs: 'h-8 w-8 text-[12px]',
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-11 w-11 text-[15px]',
  lg: 'h-24 w-24 text-3xl',
  xl: 'h-28 w-28 text-4xl',
} as const;

export type AvatarSize = keyof typeof SIZE;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  tint = '12 143 98',
  size = 'md',
  className,
  ring,
}: {
  name: string;
  src?: string;
  tint?: string; // rgb triplet
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const base = cn(
    'shrink-0 overflow-hidden rounded-full',
    ring && 'ring-2 ring-surface',
    SIZE[size],
    className,
  );

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={cn(base, 'bg-surface object-cover')}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(base, 'flex items-center justify-center font-semibold text-white')}
      style={{ backgroundColor: `rgb(${tint})` }}
    >
      {initials(name)}
    </div>
  );
}
