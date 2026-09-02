// Shared framer-motion config so every transition in the app feels like one system:
// tasteful, premium springs — smooth, never bouncy-cartoonish (§6).
import type { Transition, Variants } from 'framer-motion';

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };
export const softSpring: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const gentle: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

// Full-screen route/quiz transitions: slide + fade.
export const screenVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Quiz cards slide horizontally in the direction of travel.
export const slideVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
};

// Staggered card reveal (Stack reveal, list items).
export const listContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
};
