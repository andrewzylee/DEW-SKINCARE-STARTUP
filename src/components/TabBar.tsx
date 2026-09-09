import type { ReactNode } from 'react';
import { BarChart3, Compass, Newspaper, Plus, User } from 'lucide-react';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';

export type TabKey = 'feed' | 'discover' | 'shelf' | 'profile';

// Fixed bottom tab bar. Feed (social) · Discover (find) · ＋ (do something) · Shelf (your beauty) ·
// Profile (you). The center ＋ is an action, not a tab — it opens the "what do you want to do?" sheet.
export function TabBar({
  active,
  onChange,
  onCreate,
  avatar,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  onCreate: () => void;
  avatar?: { name: string; src?: string; tint?: string };
}) {
  return (
    <nav className="safe-b z-20 shrink-0 border-t border-line bg-surface/90 backdrop-blur-xl">
      <div className="flex items-end px-1 pt-1">
        <TabItem label="Feed" on={active === 'feed'} onClick={() => onChange('feed')}>
          <Newspaper size={22} strokeWidth={active === 'feed' ? 2.4 : 1.9} />
        </TabItem>
        <TabItem label="Discover" on={active === 'discover'} onClick={() => onChange('discover')}>
          <Compass size={22} strokeWidth={active === 'discover' ? 2.4 : 1.9} />
        </TabItem>

        {/* Center: "do something" action sheet (rate, log, add, trial) */}
        <button
          type="button"
          onClick={onCreate}
          className="flex flex-1 flex-col items-center gap-1 pb-2"
          aria-label="Rate, log, or add"
        >
          <span className="grid h-[52px] w-[52px] -translate-y-3 place-items-center rounded-full bg-accent text-white shadow-pop transition-transform active:scale-95">
            <Plus size={26} strokeWidth={2.6} />
          </span>
          <span className="-mt-2 text-[11px] font-medium text-muted">Add</span>
        </button>

        <TabItem label="Shelf" on={active === 'shelf'} onClick={() => onChange('shelf')}>
          <BarChart3 size={22} strokeWidth={active === 'shelf' ? 2.4 : 1.9} />
        </TabItem>
        <TabItem label="Profile" on={active === 'profile'} onClick={() => onChange('profile')}>
          {avatar ? (
            <Avatar
              name={avatar.name}
              src={avatar.src}
              tint={avatar.tint}
              size="xs"
              className={cn('h-[26px] w-[26px]', active === 'profile' && 'ring-2 ring-accent')}
            />
          ) : (
            <User size={22} strokeWidth={active === 'profile' ? 2.4 : 1.9} />
          )}
        </TabItem>
      </div>
    </nav>
  );
}

function TabItem({
  label,
  on,
  onClick,
  children,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 pb-2 pt-1 transition-colors active:scale-95',
        on ? 'text-accent' : 'text-muted',
      )}
    >
      {children}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
