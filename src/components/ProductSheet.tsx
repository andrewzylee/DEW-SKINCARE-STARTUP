import { ExternalLink, FlaskConical, Check, X } from 'lucide-react';
import { getProduct, productDomain, type Product } from '../data/mockCatalog';
import type { UserProfile } from '../data/quiz';
import { useStore } from '../state/store';
import { skinMatch, communityResults, cohortRepurchase } from '../lib/skinMatch';
import { cn } from '../lib/cn';
import { Sheet } from './Sheet';
import { ProductImage } from './ProductImage';
import { CategoryTag } from './CategoryTag';
import { PillButton } from './PillButton';

const SKIN_LABEL: Record<string, string> = {
  oily: 'oily',
  combination: 'combination',
  dry: 'dry',
  sensitive: 'sensitive',
};

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

export function ProductSheet({
  productId,
  onClose,
  onOpenTrial,
}: {
  productId: string | null;
  onClose: () => void;
  onOpenTrial: (trialId: string) => void;
}) {
  const { state, startTrial, trialForProduct } = useStore();
  const product = productId ? getProduct(productId) : undefined;

  const d = product ? productDomain(product) : 'skincare';
  const title = d === 'fragrance' ? 'Scent Match' : d === 'makeup' ? 'Match' : 'Skin Match';
  return (
    <Sheet open={!!product} onClose={onClose} title={title}>
      {product && (
        <Body
          product={product}
          profile={state.profile}
          existingTrialId={trialForProduct(product.id)?.id}
          onStartTrial={() => onOpenTrial(startTrial(product.id))}
          onOpenTrial={onOpenTrial}
        />
      )}
    </Sheet>
  );
}

function Body({
  product,
  profile,
  existingTrialId,
  onStartTrial,
  onOpenTrial,
}: {
  product: Product;
  profile: UserProfile | null;
  existingTrialId?: string;
  onStartTrial: () => void;
  onOpenTrial: (trialId: string) => void;
}) {
  const p = product;
  const domain = productDomain(p);
  const skinBased = domain === 'skincare';
  const fragrance = domain === 'fragrance';
  const match = skinMatch(profile, p);
  const comm = communityResults(p);
  const repurchase = cohortRepurchase(profile, p);
  const color = matchColor(match.score);

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Product header */}
      <div className="flex items-center gap-3">
        <ProductImage id={p.id} brand={p.brand} name={p.name} size="lg" />
        <div className="min-w-0 flex-1">
          <CategoryTag category={p.category} />
          <div className="text-[17px] font-semibold leading-tight">{p.name}</div>
          <div className="text-[13px] text-muted">{p.brand}</div>
        </div>
        <span className="num text-[15px] font-semibold">${p.price}</span>
      </div>

      {/* Scent notes (fragrance only) */}
      {fragrance && p.notes && p.notes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.notes.map((n) => (
            <span
              key={n}
              className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] font-medium text-ink"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Skin Match */}
      <div className="flex items-center gap-4 rounded-[20px] bg-bg p-4">
        <div
          className="num grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] text-[20px] font-bold"
          style={{ borderColor: color, color }}
        >
          {match.score}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold" style={{ color }}>
            {matchLabel(match.score)}
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {match.reasons.map((r, i) => (
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

      {/* Community results */}
      <div className="rounded-[20px] border border-line p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Results</div>
          <div className="num text-[12.5px] text-muted">{comm.tried} tried</div>
        </div>
        <div className="mt-3 flex overflow-hidden rounded-full">
          <div className="h-2.5 bg-accent" style={{ width: `${comm.lovedPct}%` }} />
          <div className="h-2.5 bg-tier-c" style={{ width: `${comm.neutralPct}%` }} />
          <div className="h-2.5 bg-tier-f" style={{ width: `${comm.stoppedPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[12px]">
          <span>❤️ <span className="num font-semibold">{comm.lovedPct}%</span> loved</span>
          <span>😐 <span className="num font-semibold">{comm.neutralPct}%</span></span>
          <span>💔 <span className="num font-semibold">{comm.stoppedPct}%</span> stopped</span>
        </div>
        <div className="mt-3 rounded-[14px] bg-accent-soft px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-accent-ink">
            <span className="num font-bold">{repurchase}%</span>{' '}
            {!skinBased
              ? 'of people who tried it would repurchase.'
              : `of people with ${profile ? SKIN_LABEL[profile.skinType] : 'similar'} skin would repurchase.`}
          </p>
        </div>
        <p className="num mt-2 text-[12px] text-muted">
          {!skinBased
            ? 'Most decide within the first few wears.'
            : `Typically used ~${comm.avgWeeks} weeks before deciding.`}
        </p>
      </div>

      {/* Actions */}
      {existingTrialId ? (
        <PillButton fullWidth onClick={() => onOpenTrial(existingTrialId)}>
          <FlaskConical size={17} />
          Open your trial
        </PillButton>
      ) : (
        <PillButton fullWidth onClick={onStartTrial}>
          <FlaskConical size={17} />
          Start a trial
        </PillButton>
      )}
      <div className="flex items-center justify-between">
        <a
          href={p.restockUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
        >
          Buy / restock <ExternalLink size={13} />
        </a>
        <span className="text-[11px] text-muted">Match &amp; results are mock data.</span>
      </div>
    </div>
  );
}
