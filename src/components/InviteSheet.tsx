import { useState } from 'react';
import { Link2, Send, UserPlus } from 'lucide-react';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import { PillButton } from './PillButton';
import { Sheet } from './Sheet';

// Simple "invite friends" — share your Dew link so friends can join you. No scarcity, no gating;
// the app is fully usable solo, this just brings your people in. Prototype: copy shares the link.
export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore();
  const link = `dew.app/join/@${state.account.handle}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Invite friends">
      <div className="flex flex-col gap-4 pb-2">
        <div className="rounded-[18px] bg-accent-soft p-4">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink">
            <UserPlus size={15} /> Bring your people to Dew
          </div>
          <p className="mt-1 text-[13px] leading-snug text-accent-ink/85">
            Share your link — when friends join, their ranks show up in your feed and taste twins.
          </p>
        </div>

        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-[14px] border border-line bg-bg px-3.5 py-3 text-left transition-colors active:bg-ink/[0.02]"
        >
          <Link2 size={16} className="shrink-0 text-muted" />
          <span className="num min-w-0 flex-1 truncate text-[14px] text-ink">{link}</span>
          <span className={cn('shrink-0 text-[13px] font-semibold', copied ? 'text-accent' : 'text-muted')}>
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>

        <PillButton fullWidth size="lg" onClick={copy}>
          <Send size={16} /> Share invite link
        </PillButton>
      </div>
    </Sheet>
  );
}
