import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Droplets,
  FileText,
  Gift,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Concern, SkinType } from '../data/mockCatalog';
import { INTEREST_META, type Interest } from '../data/quiz';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { IngredientsSheet } from './IngredientsSheet';
import { ImportSheet } from './ImportSheet';

const SKIN_LABEL: Record<SkinType, string> = {
  oily: 'Oily',
  combination: 'Combination',
  dry: 'Dry',
  sensitive: 'Sensitive',
};
const CONCERN_LABEL: Record<string, string> = {
  acne: 'Breakouts',
  oil: 'Oil & shine',
  texture: 'Texture & bumps',
  darkspots: 'Dark spots',
};
const SKIN_TYPES: SkinType[] = ['oily', 'combination', 'dry', 'sensitive'];
const CONCERNS: Concern[] = ['acne', 'oil', 'texture', 'darkspots'];
const ALL_INTERESTS: Interest[] = ['skincare', 'makeup', 'fragrance', 'hair'];

type Editor = 'school' | 'skintype' | 'concerns' | 'homecity' | 'interests';

export function SideMenu({
  open,
  onClose,
  onOpenCalendar,
}: {
  open: boolean;
  onClose: () => void;
  onOpenCalendar: () => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, updateAccount, updateProfile, resetAll } = useStore();
  const acct = state.account;
  const profile = state.profile;
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Editor | null>(null);
  const [sub, setSub] = useState<'ingredients' | 'import' | null>(null);
  const [school, setSchool] = useState(acct.school ?? '');
  const [city, setCity] = useState(acct.location ?? '');
  const avoidCount = acct.avoid?.length ?? 0;

  useEffect(() => {
    if (!open) {
      setExpanded(null);
      setToast(null);
      setSub(null);
    }
  }, [open]);

  if (!root) return null;

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1700);
  };
  const soon = () => flash('Coming soon in this prototype');
  const toggle = (k: Editor) => setExpanded((e) => (e === k ? null : k));

  const skinTypeLabel = profile ? SKIN_LABEL[profile.skinType] : '—';
  const concerns: Concern[] =
    profile?.concerns ?? (profile && profile.goal !== 'starter' ? [profile.goal] : []);
  const concernsSummary = concerns.length
    ? concerns.map((c) => CONCERN_LABEL[c] ?? c).join(', ')
    : 'Add concerns';
  const interests: Interest[] = profile?.interests ?? ['skincare', 'makeup'];
  const interestsSummary = interests.length
    ? interests.map((i) => INTEREST_META[i].label).join(', ')
    : 'Pick interests';
  const toggleInterest = (v: Interest) => {
    const next = interests.includes(v) ? interests.filter((x) => x !== v) : [...interests, v];
    updateProfile({ interests: next });
  };

  const chooseSkinType = (v: SkinType) => {
    updateProfile({ skinType: v });
    setExpanded(null);
    flash('Skin type updated');
  };
  const toggleConcern = (v: Concern) => {
    const next = concerns.includes(v) ? concerns.filter((c) => c !== v) : [...concerns, v];
    updateProfile({ concerns: next, goal: next[0] ?? 'starter' });
  };
  const saveCity = () => {
    updateAccount({ location: city.trim() });
    setExpanded(null);
    if (city.trim()) flash('Home city updated');
  };
  const saveSchool = () => {
    updateAccount({ school: school.trim() || undefined });
    setExpanded(null);
    if (school.trim()) flash('School saved');
  };

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="pointer-events-auto absolute inset-0 z-[70] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex w-[87%] max-w-[360px] flex-col bg-surface shadow-pop"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-6">
              <h2 className="text-[22px] font-bold tracking-tight">Menu</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-ink/[0.06] text-muted"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
              <Item icon={Mail} label="Invite friends" hint="3 invites left" onClick={() => flash('Invite link copied (stub)')} />
              <Item icon={Gift} label="Unlock Pro" onClick={soon} />
              <Item
                icon={GraduationCap}
                label={acct.school ? `School · ${acct.school}` : 'Add your school'}
                onClick={() => toggle('school')}
              />
              {expanded === 'school' && (
                <InlineInput value={school} onChange={setSchool} onSave={saveSchool} placeholder="e.g. Stanford University" />
              )}

              <Divider />

              <Item icon={Settings2} label="Settings" onClick={soon} />
              <Item
                icon={Trophy}
                label="Your skin goal"
                onClick={() => {
                  onClose();
                  onOpenCalendar();
                }}
              />

              <Item icon={Sparkles} label={`Interests · ${interestsSummary}`} onClick={() => toggle('interests')} />
              {expanded === 'interests' && (
                <>
                  <Chips>
                    {ALL_INTERESTS.map((v) => (
                      <ChipBtn key={v} selected={interests.includes(v)} onClick={() => toggleInterest(v)}>
                        {INTEREST_META[v].live ? INTEREST_META[v].label : `${INTEREST_META[v].label} · soon`}
                      </ChipBtn>
                    ))}
                  </Chips>
                  <div className="px-5 pb-2 pt-0.5">
                    <button type="button" onClick={() => setExpanded(null)} className="text-[13px] font-semibold text-accent">
                      Done
                    </button>
                  </div>
                </>
              )}

              <Item icon={Droplets} label={`Skin type · ${skinTypeLabel}`} onClick={() => toggle('skintype')} />
              {expanded === 'skintype' && (
                <Chips>
                  {SKIN_TYPES.map((v) => (
                    <ChipBtn key={v} selected={profile?.skinType === v} onClick={() => chooseSkinType(v)}>
                      {SKIN_LABEL[v]}
                    </ChipBtn>
                  ))}
                </Chips>
              )}

              <Item icon={Target} label={`Concerns · ${concernsSummary}`} onClick={() => toggle('concerns')} />
              {expanded === 'concerns' && (
                <>
                  <Chips>
                    {CONCERNS.map((v) => (
                      <ChipBtn key={v} selected={concerns.includes(v)} onClick={() => toggleConcern(v)}>
                        {CONCERN_LABEL[v]}
                      </ChipBtn>
                    ))}
                  </Chips>
                  <div className="px-5 pb-2 pt-0.5">
                    <button type="button" onClick={() => setExpanded(null)} className="text-[13px] font-semibold text-accent">
                      Done
                    </button>
                  </div>
                </>
              )}

              <Item
                icon={MapPin}
                label={acct.location ? `Home city · ${acct.location}` : 'Add home city'}
                onClick={() => toggle('homecity')}
              />
              {expanded === 'homecity' && (
                <InlineInput value={city} onChange={setCity} onSave={saveCity} placeholder="e.g. New York, NY" />
              )}

              <Item
                icon={ShieldAlert}
                label={avoidCount ? `Ingredients to avoid · ${avoidCount}` : 'Ingredients to avoid'}
                onClick={() => setSub('ingredients')}
              />
              <Item icon={UploadCloud} label="Import your routine" onClick={() => setSub('import')} />

              <Divider />

              <Item icon={Sparkles} label="What's new" onClick={soon} />
              <Item icon={MessageCircle} label="FAQ" onClick={soon} />
              <Item icon={Lock} label="Change password" onClick={soon} />
              <Item icon={FileText} label="Privacy policy" onClick={soon} />
              <Item
                icon={LogOut}
                label="Log out"
                danger
                onClick={() => {
                  onClose();
                  resetAll();
                }}
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {toast && (
              <motion.div
                className="absolute inset-x-0 bottom-8 z-[80] flex justify-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <span className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white shadow-pop">
                  {toast}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
        root,
      )}
      <IngredientsSheet open={open && sub === 'ingredients'} onClose={() => setSub(null)} />
      <ImportSheet open={open && sub === 'import'} onClose={() => setSub(null)} />
    </>
  );
}

function Item({
  icon: Icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-3.5 text-left active:bg-ink/[0.03]"
    >
      <Icon size={20} className={cn('shrink-0', danger ? 'text-tier-f' : 'text-muted')} />
      <span className={cn('min-w-0 flex-1 truncate text-[15.5px] font-medium', danger && 'text-tier-f')}>
        {label}
      </span>
      {hint && <span className="shrink-0 text-[12.5px] font-semibold text-accent">{hint}</span>}
      {!hint && !danger && <ChevronRight size={17} className="shrink-0 text-muted/60" />}
    </button>
  );
}

function Divider() {
  return <div className="mx-5 my-1.5 border-t border-line" />;
}

function InlineInput({
  value,
  onChange,
  onSave,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 px-5 pb-3 pt-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder={placeholder}
        maxLength={48}
        className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-[14px] outline-none focus:border-ink/25"
      />
      <button
        type="button"
        onClick={onSave}
        className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-[14px] font-semibold text-white"
      >
        Save
      </button>
    </div>
  );
}

function Chips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 px-5 pb-3 pt-1">{children}</div>;
}

function ChipBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition-colors active:scale-95',
        selected ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink',
      )}
    >
      {children}
    </button>
  );
}
