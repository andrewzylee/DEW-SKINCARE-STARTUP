import { motion } from 'framer-motion';
import { spring } from '../lib/motion';

// Thin quiz progress bar. value is 0..1.
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-ink/[0.08]">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={spring}
      />
    </div>
  );
}
