import { FlaskConical, ListChecks, Plus, Star, type LucideIcon } from 'lucide-react';
import { Sheet } from './Sheet';

// The center "＋" menu — Dew's most important surface. "What do you want to do?" routes to the
// core habit loop: try → rate → rank → share → discover. The primary action is rating a product.
export function ActionSheet({
  open,
  onClose,
  onRate,
  onLog,
  onAdd,
  onTrial,
}: {
  open: boolean;
  onClose: () => void;
  onRate: () => void;
  onLog: () => void;
  onAdd: () => void;
  onTrial: () => void;
}) {
  const items: { icon: LucideIcon; label: string; sub: string; onClick: () => void; primary?: boolean }[] = [
    { icon: Star, label: 'Rate a product', sub: 'Rank something you’ve tried', onClick: onRate, primary: true },
    { icon: ListChecks, label: 'Log today’s routine', sub: 'Check in & keep your streak', onClick: onLog },
    { icon: Plus, label: 'Add a product', sub: 'Not on Dew yet? Add it', onClick: onAdd },
    { icon: FlaskConical, label: 'Start a trial', sub: 'Track a product over time', onClick: onTrial },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="What do you want to do?">
      <div className="flex flex-col gap-2 pb-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                onClose();
                it.onClick();
              }}
              className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-3.5 text-left transition-transform active:scale-[0.99]"
            >
              <span
                className={cnTint(it.primary)}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-semibold leading-tight">{it.label}</div>
                <div className="text-[12.5px] text-muted">{it.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function cnTint(primary?: boolean): string {
  return primary
    ? 'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white'
    : 'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent';
}
