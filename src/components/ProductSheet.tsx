import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, FlaskConical, Heart, MoreHorizontal, Share2, Star, X } from 'lucide-react';
import { getProduct, productDomain, type Product } from '../data/mockCatalog';
import { people } from '../data/social';
import type { UserProfile } from '../data/quiz';
import { useStore, type RankedShelfItem } from '../state/store';
import { skinMatch, communityResults, cohortRepurchase } from '../lib/skinMatch';
import { spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';
import { ProductImage } from './ProductImage';
import { PillButton } from './PillButton';
import { categoryLabel } from './CategoryTag';

const SKIN_LABEL: Record<string, string> = {
  oily: 'oily',
  combination: 'combination',
  dry: 'dry',
  sensitive: 'sensitive',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function matchColor(score: number): string {
  if (score >= 82) return 'rgb(var(--accent))';
  if (score >= 68) return 'rgb(var(--tier-s))';
  if (score >= 55) return 'rgb(var(--tier-b))';
  return 'rgb(var(--tier-f))';
}
function matchLabel(score: number): string {
  if (score >= 82) return 'Great match';
  if (score >= 68) return 'Solid match';
  if (score >= 55) return 'Fair match';
  return 'Not ideal for you';
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// A friendly 4.x rating + a 5→1 star histogram synthesized from the mock community signal.
const ratingOf = (loved: number) => Math.round((3.4 + (loved / 100) * 1.6) * 10) / 10;
function histogramOf(loved: number, neutral: number, stopped: number): [number, number][] {
  const h5 = loved;
  const h4 = Math.round(neutral * 0.65);
  const h3 = Math.round(neutral * 0.35);
  const h2 = Math.round(stopped * 0.6);
  const h1 = Math.max(0, 100 - h5 - h4 - h3 - h2);
  return [
    [5, h5],
    [4, h4],
    [3, h3],
    [2, h2],
    [1, h1],
  ];
}

const SKIN_TAGS: Record<string, string> = {
  acne: 'Acne-fighting',
  oil: 'Oil control',
  texture: 'Smoothing',
  darkspots: 'Brightening',
  starter: 'Gentle',
};
const FINISH_TAG: Record<string, string> = {
  dewy: 'Dewy',
  glowy: 'Glowy',
  natural: 'Natural',
  satin: 'Satin',
  matte: 'Matte',
};
const STYLE_TAG: Record<string, string> = {
  clean: 'Clean',
  minimal: 'Minimalist',
  natural: 'Natural',
  skinlike: 'Skin-like',
  buildable: 'Buildable',
  viral: 'Viral',
  budget: 'Budget',
  dupe: 'Dupe',
  luxe: 'Luxe',
  glam: 'Glam',
  bold: 'Bold',
  kbeauty: 'K-beauty',
  classic: 'Classic',
  cozy: 'Cozy',
  fun: 'Playful',
  lengthening: 'Lengthening',
  volumizing: 'Volumizing',
  fullcoverage: 'Full coverage',
};

function tagsFor(p: Product): string[] {
  const d = productDomain(p);
  if (d === 'skincare') {
    return [...new Set(p.concernTags.map((c) => SKIN_TAGS[c]).filter(Boolean))].slice(0, 3);
  }
  if (d === 'fragrance') {
    const fam = p.scentFamily ? cap(p.scentFamily) : null;
    return [fam, ...(p.notes ?? [])].filter((x): x is string => !!x).slice(0, 3);
  }
  const t: string[] = [];
  if (p.finish) t.push(FINISH_TAG[p.finish]);
  (p.styleTags ?? []).forEach((s) => STYLE_TAG[s] && t.push(STYLE_TAG[s]));
  return [...new Set(t)].slice(0, 3);
}

function forLine(p: Product): string {
  const d = productDomain(p);
  if (d === 'fragrance') return `${p.scentFamily ? cap(p.scentFamily) : 'Signature'} scent · unisex.`;
  if (d === 'makeup') return 'For all skin tones — buildable coverage.';
  if (p.skinTypes.length >= 4) return 'For all skin types, including sensitive.';
  return `For ${p.skinTypes.map((s) => SKIN_LABEL[s]).join(' & ')} skin.`;
}

const REVIEWS = [
  'Instantly hydrating and sinks in so well. I use it morning and night. Love!',
  'Been repurchasing for months — it does exactly what it promises.',
  'A bit hyped, but it earned a permanent spot in my routine.',
  'Gentle, no irritation, and my skin looks calmer already.',
  'Layers beautifully and never pills. Worth every penny.',
];

export function ProductSheet({
  productId,
  onClose,
  onOpenTrial,
}: {
  productId: string | null;
  onClose: () => void;
  onOpenTrial: (trialId: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, rankedShelf, startTrial, trialForProduct, isUsing, toggleUsing } = useStore();
  const product = productId ? getProduct(productId) : undefined;
  if (!root) return null;

  return createPortal(
    <AnimatePresence>
      {product && (
        <Page
          key={product.id}
          product={product}
          profile={state.profile}
          ranked={rankedShelf.find((r) => r.productId === product.id)}
          using={isUsing(product.id)}
          existingTrialId={trialForProduct(product.id)?.id}
          onClose={onClose}
          onToggleUsing={() => toggleUsing(product.id)}
          onStartTrial={() => onOpenTrial(startTrial(product.id))}
          onOpenTrial={onOpenTrial}
        />
      )}
    </AnimatePresence>,
    root,
  );
}

function Page({
  product: p,
  profile,
  ranked,
  using,
  existingTrialId,
  onClose,
  onToggleUsing,
  onStartTrial,
  onOpenTrial,
}: {
  product: Product;
  profile: UserProfile | null;
  ranked?: RankedShelfItem;
  using: boolean;
  existingTrialId?: string;
  onClose: () => void;
  onToggleUsing: () => void;
  onStartTrial: () => void;
  onOpenTrial: (trialId: string) => void;
}) {
  const domain = productDomain(p);
  const skinBased = domain === 'skincare';
  const match = skinMatch(profile, p);
  const comm = communityResults(p);
  const repurchase = cohortRepurchase(profile, p);
  const color = matchColor(match.score);
  const rating = ratingOf(comm.lovedPct);
  const hist = histogramOf(comm.lovedPct, comm.neutralPct, comm.stoppedPct);
  const tags = tagsFor(p);

  const badges: string[] = [];
  if (ranked) badges.push(`#${ranked.groupRank} ${categoryLabel(p.category)}`);
  if (comm.lovedPct >= 80) badges.push('Bestseller');
  else if ((p.styleTags ?? []).includes('viral')) badges.push('Viral');

  const h = hash(p.id);
  const reviewer = people[h % people.length];
  const review = {
    person: reviewer,
    meta: `${cap(reviewer.skinType)} · ${cap(reviewer.undertone)}`,
    text: REVIEWS[h % REVIEWS.length],
    timeAgo: ['2d ago', '3d ago', '5d ago', '1w ago'][(h >> 3) % 4],
  };

  const heroBg =
    domain === 'makeup'
      ? 'linear-gradient(180deg, rgb(var(--makeup-soft)), rgb(var(--bg)))'
      : domain === 'fragrance'
        ? 'linear-gradient(180deg, rgb(215 161 58 / 0.16), rgb(var(--bg)))'
        : 'linear-gradient(180deg, rgb(var(--accent-soft)), rgb(var(--bg)))';

  const matchTitle = domain === 'fragrance' ? 'Scent Match' : 'Skin Match';

  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 z-50 flex flex-col bg-bg"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={spring}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero */}
        <div className="relative px-5 pb-6 pt-5" style={{ backgroundImage: heroBg }}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink backdrop-blur transition-transform active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-ink">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur">
                <Share2 size={17} />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur">
                <MoreHorizontal size={17} />
              </span>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="absolute left-5 top-[68px] flex flex-col items-start gap-1.5">
              {badges.slice(0, 2).map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-white/85 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-sm backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex justify-center">
            <ProductImage
              id={p.id}
              brand={p.brand}
              name={p.name}
              size="xl"
              className="!h-44 !w-44 !rounded-[26px] shadow-sm"
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4">
          <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">{p.name}</h1>
          <p className="mt-0.5 text-[13.5px] text-muted">{p.brand}</p>

          {/* Rating */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="num text-[16px] font-bold text-ink">{rating.toFixed(1)}</span>
            <Stars value={rating} />
            <span className="num text-[13px] text-muted">({comm.tried.toLocaleString()})</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-[12.5px] font-medium text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink/90">{p.blurb}</p>
          <p className="mt-1.5 text-[14px] font-semibold text-ink">{forLine(p)}</p>

          {/* Your match (Dew's signature) */}
          <div className="mt-4 flex items-center gap-4 rounded-[20px] bg-surface p-4 shadow-card">
            <div
              className="num grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] text-[20px] font-bold"
              style={{ borderColor: color, color }}
            >
              {match.score}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                Your {matchTitle}
              </div>
              <div className="text-[15px] font-bold leading-tight" style={{ color }}>
                {matchLabel(match.score)}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {match.reasons.slice(0, 2).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[12.5px]">
                    {r.positive ? (
                      <Check size={13} className="shrink-0 text-accent" />
                    ) : (
                      <X size={13} className="shrink-0 text-tier-f" />
                    )}
                    <span className={cn(r.positive ? 'text-ink' : 'text-muted')}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="my-5 border-t border-line" />

          {/* Community rating */}
          <h2 className="font-display text-[19px] font-semibold text-ink">Community rating</h2>
          <div className="mt-3 flex items-start gap-5">
            <div className="shrink-0 text-center">
              <div className="num font-display text-[46px] font-semibold leading-none text-ink">
                {rating.toFixed(1)}
              </div>
              <div className="mt-1 text-[12px] text-muted">out of 5</div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 pt-1">
              {hist.map(([s, pct]) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="num w-2.5 text-[11px] text-muted">{s}</span>
                  <Star size={10} className="shrink-0 fill-current text-muted" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="num w-8 text-right text-[11px] text-muted">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-[14px] bg-accent-soft px-3.5 py-2.5">
            <p className="text-[13px] font-medium text-accent-ink">
              <span className="num font-bold">{repurchase}%</span>{' '}
              {skinBased
                ? `of people with ${profile ? SKIN_LABEL[profile.skinType] : 'similar'} skin would repurchase.`
                : 'of people who tried it would repurchase.'}
            </p>
          </div>

          <div className="my-5 border-t border-line" />

          {/* Top review */}
          <h2 className="font-display text-[19px] font-semibold text-ink">Top review</h2>
          <div className="mt-3 rounded-[18px] border border-line bg-surface p-3.5">
            <div className="flex items-start gap-3">
              <Avatar name={review.person.name} tint={review.person.tint} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="num truncate text-[14px] font-semibold text-ink">
                    {review.person.handle}
                  </span>
                  <span className="shrink-0 text-[11.5px] text-muted">{review.timeAgo}</span>
                </div>
                <div className="text-[12px] text-muted">{review.meta}</div>
                <p className="mt-1.5 text-[13.5px] leading-snug text-ink">{review.text}</p>
              </div>
              <Heart size={16} className="mt-0.5 shrink-0 text-muted" />
            </div>
          </div>

          <p className="mt-4 pb-2 text-center text-[11px] text-muted">
            Ratings, reviews &amp; match are mock data for this prototype.
          </p>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="shrink-0 border-t border-line bg-surface/95 px-4 pb-5 pt-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (existingTrialId ? onOpenTrial(existingTrialId) : onStartTrial())}
            className={cn(
              'grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] border transition-transform active:scale-95',
              existingTrialId ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink',
            )}
            aria-label={existingTrialId ? 'Open your trial' : 'Start a trial'}
          >
            <FlaskConical size={20} />
          </button>
          <PillButton
            fullWidth
            size="lg"
            variant={using ? 'secondary' : 'primary'}
            onClick={onToggleUsing}
          >
            {using ? (
              <>
                <Check size={18} /> In your routine
              </>
            ) : (
              <>Add to routine · ${p.price}</>
            )}
          </PillButton>
        </div>
      </div>
    </motion.div>
  );
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={13}
          className={cn(i < rounded ? 'fill-current text-tier-s' : 'text-line')}
        />
      ))}
    </div>
  );
}
