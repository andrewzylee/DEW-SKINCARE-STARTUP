import { cn } from '../lib/cn';
import { tierVar, type Tier } from '../lib/ranking';

// S / A / B / C / F badge in the tier's desaturated color. Letter is mono (a grade = data).
export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'lg'
      ? 'h-9 w-9 text-base rounded-[11px]'
      : size === 'sm'
        ? 'h-6 w-6 text-[11px] rounded-md'
        : 'h-8 w-8 text-sm rounded-[10px]';
  return (
    <span
      className={cn('num inline-flex items-center justify-center font-bold text-white', dim)}
      style={{ backgroundColor: tierVar(tier) }}
    >
      {tier}
    </span>
  );
}
