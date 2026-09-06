import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  BarChart3,
  FlaskConical,
  Camera,
  ChevronRight,
  Droplet,
  Heart,
  Instagram,
  Layers,
  Link2,
  ListChecks,
  Menu,
  MessageCircle,
  Music2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useStore, type Account } from '../state/store';
import { people } from '../data/social';
import { getProduct } from '../data/mockCatalog';
import { downscaleToDataUrl } from '../lib/image';
import { deriveMyPosts, type ActivityPost } from '../lib/activity';
import { archetypeOf, tasteItemsFromRanked } from '../lib/taste';
import { TONE_LABEL, UNDERTONE_LABEL } from '../lib/shadeMatch';
import { tierVar, type Tier } from '../lib/ranking';
import { cn } from '../lib/cn';
import { useUI } from '../state/ui';
import type { TabKey } from '../components/TabBar';
import { Avatar } from '../components/Avatar';
import { ProductImage } from '../components/ProductImage';
import { StreakRing } from '../components/StreakRing';
import { PillButton } from '../components/PillButton';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { Sheet } from '../components/Sheet';

export function Profile({
  go,
  onOpenCalendar,
}: {
  go: (t: TabKey) => void;
  onOpenCalendar: () => void;
}) {
  const { state, streak, rankedShelf, updateAccount, today } = useStore();
  const { openPost, openFriend, openWrapped, openProduct, openShadeFinder } = useUI();
  const acct = state.account;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [peopleSheet, setPeopleSheet] = useState<null | 'followers' | 'following'>(null);
  const [activityTab, setActivityTab] = useState<'activity' | 'playlists'>('activity');

  const daysLogged = Object.values(state.logs).filter(
    (e) => e.skinRating !== null && e.skinRating !== undefined,
  ).length;
  const usingCount = state.using.length;
  const myPosts = deriveMyPosts({
    trials: state.trials,
    ranked: rankedShelf,
    logs: state.logs,
    account: acct,
    today,
  });

  const myArchetype = useMemo(() => archetypeOf(tasteItemsFromRanked(rankedShelf)), [rankedShelf]);
  const makeupRanked = rankedShelf.filter((r) => r.domain === 'makeup').length;
  const skincareRanked = rankedShelf.filter((r) => r.domain === 'skincare').length;
  const fragranceRanked = rankedShelf.filter((r) => r.domain === 'fragrance').length;
  const profileInterests = state.profile?.interests ?? ['skincare', 'makeup'];
  const showFragrance = profileInterests.includes('fragrance') || fragranceRanked > 0;
  const fragranceShelf = rankedShelf.filter((r) => r.domain === 'fragrance');

  // Skin profile — the facts that power Shade Match & Shade Finder.
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const skinType = state.profile?.skinType;
  const tone = state.profile?.tone;
  const undertone = state.profile?.undertone;
  const shadeCount = state.profile?.shades?.length ?? 0;
  const skinBits = [
    skinType ? `${cap(skinType)} skin` : null,
    tone ? TONE_LABEL[tone] : null,
    undertone ? UNDERTONE_LABEL[undertone] : null,
  ].filter(Boolean) as string[];
  const skinLine = skinBits.length ? skinBits.join(' · ') : 'Set your tone & undertone';

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      updateAccount({ avatar: await downscaleToDataUrl(file) });
    } catch {
      /* ignore unreadable image */
    }
  };

  return (
    <div className="pb-8">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6">
        <h1 className="truncate font-display text-[27px] font-semibold">{acct.displayName}</h1>
        <div className="flex items-center gap-3 text-muted">
          <button type="button" onClick={() => setSharing(true)} aria-label="Share profile">
            <Share2 size={20} />
          </button>
          <button type="button" onClick={() => setEditing(true)} aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center px-5 pt-4 text-center">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative active:scale-95 transition-transform">
          <Avatar name={acct.displayName} src={acct.avatar} size="lg" ring />
          <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-accent text-white ring-2 ring-surface">
            <Camera size={14} />
          </span>
        </button>
        <div className="mt-3 text-[16px] font-semibold text-ink">@{acct.handle}</div>
        <div className="num text-[12.5px] text-muted">Member since {acct.memberSince}</div>
        {acct.bio || acct.location ? (
          <p className="mt-2 max-w-[19rem] text-[14px] leading-snug">
            {acct.bio}
            {acct.location && <span className="text-muted"> · 📍 {acct.location}</span>}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 text-[13px] font-medium text-accent"
          >
            + Add a bio
          </button>
        )}
        <div className="mt-3 flex items-center gap-2 text-muted">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
            <Instagram size={17} />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
            <Music2 size={17} />
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 flex items-stretch px-6">
        <Stat label="Followers" value={acct.followers} onClick={() => setPeopleSheet('followers')} />
        <div className="my-1 w-px self-stretch bg-line" />
        <Stat label="Following" value={acct.following} onClick={() => setPeopleSheet('following')} />
        <div className="my-1 w-px self-stretch bg-line" />
        <Stat label="Day streak" value={streak} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 px-5">
        <PillButton variant="secondary" fullWidth onClick={() => setEditing(true)}>
          Edit profile
        </PillButton>
        <PillButton variant="secondary" fullWidth onClick={() => setSharing(true)}>
          Share profile
        </PillButton>
      </div>

      {/* Your beauty taste (archetype + domain split) */}
      <div className="mt-4 px-5">
        <button
          type="button"
          onClick={() => go('shelf')}
          className="flex w-full items-center gap-3 rounded-card bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.99]"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft">
            <Sparkles size={19} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Your beauty taste
            </div>
            <div className="text-[17px] font-bold leading-tight">{myArchetype}</div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <span className="num rounded-full bg-makeup-soft px-2 py-1 text-[11.5px] font-semibold text-makeup-ink">
              {makeupRanked} makeup
            </span>
            {fragranceRanked > 0 && (
              <span className="num rounded-full bg-ink/[0.06] px-2 py-1 text-[11.5px] font-semibold text-ink">
                {fragranceRanked} scent
              </span>
            )}
            <span className="num rounded-full bg-accent-soft px-2 py-1 text-[11.5px] font-semibold text-accent-ink">
              {skincareRanked} skin
            </span>
          </div>
        </button>
      </div>

      {/* Skin profile — tone, undertone & self-logged shade matches (opens Shade Finder) */}
      <div className="mt-3 px-5">
        <button
          type="button"
          onClick={openShadeFinder}
          className="flex w-full items-center gap-3 rounded-card bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.99]"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-makeup-soft">
            <Droplet size={19} className="text-makeup-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Skin profile
            </div>
            <div className="truncate text-[15px] font-semibold leading-tight">{skinLine}</div>
            <div className="mt-0.5 text-[12.5px] text-muted">
              {shadeCount > 0
                ? `${shadeCount} shade${shadeCount === 1 ? '' : 's'} logged · foundation & concealer`
                : 'Find your foundation & concealer match'}
            </div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </button>
      </div>

      {/* Your fragrances — the ranked scent wardrobe (memo's "Andrew's Fragrances 1–5") */}
      {showFragrance && (
        <FragranceWardrobe items={fragranceShelf} onOpen={openProduct} onRank={() => go('shelf')} />
      )}

      {/* Beauty Wrapped */}
      <div className="mt-3 px-5">
        <button
          type="button"
          onClick={openWrapped}
          className="flex w-full items-center gap-3 rounded-card p-4 text-left text-white shadow-card transition-transform active:scale-[0.99]"
          style={{ backgroundImage: 'linear-gradient(120deg, #0c8f62, #17c88b 50%, #e66a4a)' }}
        >
          <Sparkles size={22} />
          <div className="flex-1">
            <div className="text-[15px] font-bold">Your Beauty Wrapped</div>
            <div className="text-[12.5px] opacity-90">A year of your beauty, in numbers.</div>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Activity / streak */}
      <div className="mt-5 px-5">
        <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex min-w-0 flex-1 items-center gap-4 text-left active:opacity-80"
          >
            <StreakRing count={streak} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">
                {streak > 0 ? `${streak}-day streak` : 'Start your streak'}
              </div>
              <p className="text-[13px] leading-snug text-muted">
                <span className="num">{daysLogged}</span> check-ins · tap for your calendar
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => go('log')}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white active:scale-95"
          >
            Log
          </button>
        </div>
      </div>

      {/* Lists */}
      <div className="mt-4 px-5">
        <div className="overflow-hidden rounded-card bg-surface shadow-card">
          <ListRow icon={BarChart3} label="Ranked" value={rankedShelf.length} onClick={() => go('shelf')} />
          <ListRow icon={Layers} label="In your routine" value={usingCount} onClick={() => go('stack')} border />
          <ListRow icon={ListChecks} label="Days logged" value={daysLogged} onClick={() => go('log')} border />
          <ListRow icon={FlaskConical} label="Trials" value={state.trials.length} onClick={() => go('shelf')} border />
        </div>
      </div>

      {/* Recent Activity / Playlists */}
      <div className="mt-5 px-5">
        <SegmentedToggle<'activity' | 'playlists'>
          layoutId="profile-tab"
          value={activityTab}
          onChange={setActivityTab}
          options={[
            { value: 'activity', label: 'Recent Activity' },
            { value: 'playlists', label: 'Playlists' },
          ]}
        />
      </div>
      {activityTab === 'activity' ? (
        <RecentActivity posts={myPosts} onOpen={openPost} />
      ) : (
        <Playlists
          ranked={rankedShelf}
          usingCount={usingCount}
          onOpen={() => go('shelf')}
          onOpenRoutine={() => go('stack')}
        />
      )}

      {/* Edit profile */}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <EditProfile
          acct={acct}
          onChangePhoto={() => fileRef.current?.click()}
          onSave={(patch) => {
            updateAccount(patch);
            setEditing(false);
          }}
        />
      </Sheet>

      {/* Share */}
      <Sheet open={sharing} onClose={() => setSharing(false)} title="Share profile">
        <div className="flex flex-col items-center gap-3 pb-2 pt-1 text-center">
          <Avatar name={acct.displayName} src={acct.avatar} size="lg" />
          <div>
            <div className="text-[16px] font-semibold">{acct.displayName}</div>
            <div className="text-[13px] text-muted">@{acct.handle}</div>
          </div>
          <div className="flex w-full items-center gap-2 rounded-full bg-ink/[0.05] px-4 py-3">
            <Link2 size={16} className="text-muted" />
            <span className="num flex-1 truncate text-left text-[14px] text-muted">
              dew.app/@{acct.handle}
            </span>
            <span className="text-[13px] font-semibold text-accent">Copy</span>
          </div>
          <p className="text-[12px] text-muted">Sharing is stubbed in this prototype.</p>
        </div>
      </Sheet>

      {/* Followers / Following */}
      <Sheet
        open={!!peopleSheet}
        onClose={() => setPeopleSheet(null)}
        title={peopleSheet === 'followers' ? `${acct.followers} followers` : `${acct.following} following`}
      >
        <div className="flex flex-col gap-1 pb-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => {
                  setPeopleSheet(null);
                  openFriend(p.id);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
              >
                <Avatar name={p.name} tint={p.tint} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
                  <div className="num truncate text-[12.5px] text-muted">@{p.handle}</div>
                </div>
              </button>
              <span className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium">
                {peopleSheet === 'followers' ? 'Follow back' : 'Following'}
              </span>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function RecentActivity({ posts, onOpen }: { posts: ActivityPost[]; onOpen: (p: ActivityPost) => void }) {
  const { state } = useStore();
  if (posts.length === 0) {
    return (
      <div className="mt-3 px-5">
        <div className="rounded-card border border-line bg-surface p-6 text-center text-[13.5px] text-muted">
          Your activity shows up here — rank a product, finish a trial, or log your skin.
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 px-5">
      {posts.map((post) => {
        const product = post.productId ? getProduct(post.productId) : undefined;
        const count = post.seed.length + (state.postComments[post.id]?.length ?? 0);
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onOpen(post)}
            className="w-full border-t border-line py-3.5 text-left first:border-t-0"
          >
            <div className="flex items-start gap-3">
              <Avatar name={post.person.name} src={post.person.avatar} tint={post.person.tint} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] leading-snug">
                  <span className="font-semibold">{post.person.name.split(' ')[0]}</span> {post.action}
                  {product ? (
                    <>
                      {' '}
                      <span className="font-semibold">{product.name}</span>
                    </>
                  ) : (
                    ''
                  )}
                </p>
                {post.review && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{post.review}</p>}
                <div className="num mt-1.5 flex items-center gap-3 text-[11.5px] text-muted">
                  <span className="flex items-center gap-1">
                    <Heart size={13} /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} /> {count}
                  </span>
                  <span>{post.timeAgo}</span>
                </div>
              </div>
              {post.badge && (
                <span
                  className="num inline-flex items-center rounded-full border-2 px-2 py-0.5 text-[13px] font-bold"
                  style={{ borderColor: post.badge.color, color: post.badge.color }}
                >
                  {post.badge.text}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const TIER_NAME: Record<Tier, string> = {
  S: 'S · Elite',
  A: 'A · Great',
  B: 'B · Solid',
  C: 'C · Okay',
  F: 'F · Nope',
};

function Playlists({
  ranked,
  usingCount,
  onOpen,
  onOpenRoutine,
}: {
  ranked: { productId: string; tier: Tier }[];
  usingCount: number;
  onOpen: () => void;
  onOpenRoutine: () => void;
}) {
  const tiers = (['S', 'A', 'B', 'C', 'F'] as Tier[])
    .map((t) => ({ t, n: ranked.filter((r) => r.tier === t).length }))
    .filter((x) => x.n > 0);
  const tiles = [
    { key: 'routine', label: 'In your routine', sub: `${usingCount} products`, color: 'rgb(var(--accent))', onClick: onOpenRoutine },
    ...tiers.map((x) => ({
      key: x.t,
      label: TIER_NAME[x.t],
      sub: `${x.n} product${x.n === 1 ? '' : 's'}`,
      color: tierVar(x.t),
      onClick: onOpen,
    })),
  ];
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 px-5">
      {tiles.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={t.onClick}
          className="relative h-28 overflow-hidden rounded-[20px] p-3.5 text-left shadow-card"
          style={{
            backgroundColor: t.color,
            backgroundImage: 'linear-gradient(0deg, rgba(15,17,21,0.38), rgba(15,17,21,0) 60%)',
          }}
        >
          <div className="flex h-full flex-col justify-end">
            <div className="text-[15px] font-bold text-white">{t.label}</div>
            <div className="num text-[12px] text-white/85">{t.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function FragranceWardrobe({
  items,
  onOpen,
  onRank,
}: {
  items: { productId: string; groupRank: number; groupSize: number; tier: Tier }[];
  onOpen: (id: string) => void;
  onRank: () => void;
}) {
  const ranked = [...items].sort((a, b) => a.groupRank - b.groupRank).slice(0, 5);
  return (
    <div className="mt-4 px-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
          Your fragrances
        </h2>
        {ranked.length > 0 && (
          <button type="button" onClick={onRank} className="text-[13px] font-semibold text-accent">
            Rank more
          </button>
        )}
      </div>
      {ranked.length === 0 ? (
        <button
          type="button"
          onClick={onRank}
          className="flex w-full items-center gap-3 rounded-card border border-dashed border-line bg-surface p-4 text-left active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-[18px]">
            🌸
          </span>
          <span className="min-w-0 flex-1 text-[13.5px] text-muted">
            Rank the scents you’ve tried to build your fragrance wardrobe.
          </span>
          <ChevronRight size={17} className="shrink-0 text-muted" />
        </button>
      ) : (
        <div className="overflow-hidden rounded-card bg-surface shadow-card">
          {ranked.map((r, i) => {
            const p = getProduct(r.productId);
            if (!p) return null;
            return (
              <button
                key={r.productId}
                type="button"
                onClick={() => onOpen(r.productId)}
                className={cn(
                  'flex w-full items-center gap-3 p-2.5 text-left active:bg-ink/[0.02]',
                  i > 0 && 'border-t border-line',
                )}
              >
                <span className="num w-5 shrink-0 text-center text-[15px] font-bold text-muted">
                  {i + 1}
                </span>
                <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold leading-tight">{p.name}</div>
                  <div className="num truncate text-[12.5px] text-muted">
                    {p.brand} · #{r.groupRank} of {r.groupSize}
                  </div>
                </div>
                <span
                  className="num grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[12px] font-bold"
                  style={{ borderColor: tierVar(r.tier), color: tierVar(r.tier) }}
                >
                  {r.tier}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const body = (
    <>
      <div className="num text-[20px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-[12px] text-muted">{label}</div>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="flex-1 py-1 text-center active:opacity-70">
      {body}
    </button>
  ) : (
    <div className="flex-1 py-1 text-center">{body}</div>
  );
}

function ListRow({
  icon: Icon,
  label,
  value,
  onClick,
  border,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  onClick: () => void;
  border?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ink/[0.02]',
        border && 'border-t border-line',
      )}
    >
      <Icon size={18} className="text-accent" />
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      <span className="num text-[15px] font-semibold text-muted">{value}</span>
      <ChevronRight size={17} className="text-muted" />
    </button>
  );
}

function EditProfile({
  acct,
  onSave,
  onChangePhoto,
}: {
  acct: Account;
  onSave: (patch: Partial<Account>) => void;
  onChangePhoto: () => void;
}) {
  const [displayName, setDisplayName] = useState(acct.displayName);
  const [handle, setHandle] = useState(acct.handle);
  const [bio, setBio] = useState(acct.bio);
  const [location, setLocation] = useState(acct.location);

  const field = 'w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] outline-none focus:border-ink/25';

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center gap-3">
        <Avatar name={displayName} src={acct.avatar} size="md" />
        <button type="button" onClick={onChangePhoto} className="text-[14px] font-semibold text-accent">
          Change photo
        </button>
      </div>

      <label className="text-[12px] font-medium text-muted">Name</label>
      <input className={field} value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} />

      <label className="text-[12px] font-medium text-muted">Username</label>
      <div className="flex items-center gap-1 rounded-[14px] border border-line bg-bg px-4">
        <span className="text-[15px] text-muted">@</span>
        <input
          className="w-full bg-transparent py-3 text-[15px] outline-none"
          value={handle}
          maxLength={24}
          onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
        />
      </div>

      <label className="text-[12px] font-medium text-muted">Bio</label>
      <input className={field} value={bio} maxLength={80} placeholder="e.g. oily skin, chasing clear" onChange={(e) => setBio(e.target.value)} />

      <label className="text-[12px] font-medium text-muted">Location</label>
      <input className={field} value={location} maxLength={40} placeholder="City" onChange={(e) => setLocation(e.target.value)} />

      <PillButton fullWidth className="mt-2" onClick={() => onSave({ displayName, handle, bio, location })}>
        Save
      </PillButton>
    </div>
  );
}
