import type { ReactNode } from 'react';
import { BarChart3, Layers, Newspaper, Plus, User } from 'lucide-react';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';

export type TabKey = 'feed' | 'stack' | 'log' | 'shelf' | 'profile';

// Fixed bottom tab bar with a prominent center "+" (Log), Beli-style.
export function TabBar({
  active,
  onChange,
  avatar,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  avatar?: { name: string; src?: string; tint?: string };
}) {
  return (
    <nav className="safe-b z-20 shrink-0 border-t border-line bg-surface/90 backdrop-blur-xl">
      <div className="flex items-end px-1 pt-1">
        <TabItem label="Feed" on={active === 'feed'} onClick={() => onChange('feed')}>
          <Newspaper size={22} strokeWidth={active === 'feed' ? 2.4 : 1.9} />
        </TabItem>
        <TabItem label="Routine" on={active === 'stack'} onClick={() => onChange('stack')}>
          <Layers size={22} strokeWidth={active === 'stack' ? 2.4 : 1.9} />
        </TabItem>

        {/* Center: Log check-in */}
        <button
          type="button"
          onClick={() => onChange('log')}
          className="flex flex-1 flex-col items-center gap-1 pb-2"
          aria-label="Log"
        >
          <span
            className={cn(
              'grid h-[52px] w-[52px] -translate-y-3 place-items-center rounded-full bg-accent text-white shadow-pop transition-transform active:scale-95',
              active === 'log' && 'ring-4 ring-accent-soft',
            )}
          >
            <Plus size={26} strokeWidth={2.6} />
          </span>
          <span
            className={cn(
              '-mt-2 text-[11px] font-medium',
              active === 'log' ? 'text-accent' : 'text-muted',
            )}
          >
            Log
          </span>
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
