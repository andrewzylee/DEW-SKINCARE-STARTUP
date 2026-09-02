import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-[1.12] active:brightness-95',
  secondary: 'bg-surface text-ink border border-line hover:bg-ink/[0.03]',
  ghost: 'bg-transparent text-ink hover:bg-ink/[0.04]',
  dark: 'bg-ink text-white hover:brightness-150',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[54px] px-6 text-base',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

// One primary CTA per screen (§6). Rounded-full, big tap target, subtle press.
export function PillButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[transform,filter,background-color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}
