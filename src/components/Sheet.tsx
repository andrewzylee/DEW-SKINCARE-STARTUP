import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { spring } from '../lib/motion';

// Bottom sheet that renders into the in-frame overlay root (#stack-overlay) so it stays
// clipped to the device and floats above the tab bar. Used for swap / rank / note flows.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setRoot(document.getElementById('stack-overlay'));
  }, []);

  if (!root) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative max-h-[85%] overflow-y-auto no-scrollbar rounded-t-[28px] bg-surface pb-6 shadow-pop"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-[28px] bg-surface/95 px-5 pb-3 pt-4 backdrop-blur">
              <div className="mx-auto h-1 w-9 rounded-full bg-line" style={{ position: 'absolute', left: 0, right: 0, top: 8 }} />
              <h2 className="font-display text-[22px] font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pt-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  );
}
