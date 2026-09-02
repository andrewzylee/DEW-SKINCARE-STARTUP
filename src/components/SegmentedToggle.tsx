import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  layoutId?: string;
}

// Animated segmented control (AM/PM and other binary toggles). The active pill slides
// between segments via a shared layoutId.
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  layoutId = 'segmented',
}: Props<T>) {
  return (
    <div className={cn('relative flex rounded-full bg-ink/[0.05] p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="relative flex-1 rounded-full py-2 text-sm font-medium"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-full bg-accent shadow-sm"
              />
            )}
            <span className={cn('relative transition-colors', active ? 'text-white' : 'text-muted')}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
