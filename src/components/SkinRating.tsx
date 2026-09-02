import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';

// "Skin today" — a 5-point scale with zero faces (§3.3). Abstract signal bars that grow
// left→right; the selected level and everything below it fill in. One accent color only.
const LABELS = ['Rough', 'Off', 'Okay', 'Good', 'Great'];
const HEIGHTS = [10, 15, 20, 25, 30]; // px, increasing

export function SkinRating({
  value,
  onChange,
}: {
  value: number | null; // 0..4, or null
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-end gap-2">
        {HEIGHTS.map((h, i) => {
          const filled = value !== null && i <= value;
          return (
            <button
              key={i}
              type="button"
              aria-label={LABELS[i]}
              onClick={() => onChange(i)}
              className="group flex flex-1 items-end justify-center rounded-2xl bg-ink/[0.03] pb-2 pt-3 transition-colors hover:bg-ink/[0.05]"
              style={{ minHeight: 52 }}
            >
              <motion.span
                className={cn('w-full max-w-[26px] rounded-full', filled ? 'bg-accent' : 'bg-ink/15')}
                animate={{ height: h, opacity: filled ? 1 : 0.6 }}
                transition={spring}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 h-4 text-center">
        {value !== null && (
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-muted"
          >
            {LABELS[value]}
          </motion.span>
        )}
      </div>
    </div>
  );
}
