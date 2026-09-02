import { motion } from 'framer-motion';
import { spring } from '../lib/motion';

// Circular streak ring. Fills over a 7-day cycle so daily check-ins feel like progress,
// with a satisfying pop when today's check-in completes (§3.3 — the retention hook).
export function StreakRing({
  count,
  celebrate = false,
  size = 76,
}: {
  count: number;
  celebrate?: boolean;
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const weekProgress = count === 0 ? 0 : (((count - 1) % 7) + 1) / 7;
  const offset = circ * (1 - weekProgress);

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      animate={celebrate ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={celebrate ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : spring}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--accent-bright))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={spring}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="num text-[22px] font-bold leading-none text-ink">{count}</span>
      </div>
    </motion.div>
  );
}
