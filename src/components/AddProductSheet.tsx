import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Check, Plus } from 'lucide-react';
import {
  catalog,
  categoriesForDomain,
  type Category,
  type Domain,
  type Product,
} from '../data/mockCatalog';
import { categoryLabel } from './CategoryTag';
import { useStore } from '../state/store';
import { downscaleToDataUrl } from '../lib/image';
import { cn } from '../lib/cn';
import { ProductImage } from './ProductImage';
import { PillButton } from './PillButton';
import { Sheet } from './Sheet';

const DOMAINS: { value: Domain; label: string }[] = [
  { value: 'skincare', label: 'Skincare' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'fragrance', label: 'Fragrance' },
];

// Add a product — the community "+". Search-first, so this is the fallback when something isn't
// already on Dew: snap a photo, type the name (with live "already here?" dedup), pick a category.
// No barcode. The product is created on-device and behaves like any catalog item.
export function AddProductSheet({
  open,
  onClose,
  prefillName,
  defaultDomain = 'skincare',
  onCreated,
  onPickExisting,
}: {
  open: boolean;
  onClose: () => void;
  prefillName?: string;
  defaultDomain?: Domain;
  onCreated: (product: Product) => void;
  onPickExisting: (id: string) => void;
}) {
  const { state, addCustomProduct } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [domain, setDomain] = useState<Domain>(defaultDomain);
  const [category, setCategory] = useState<Category | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Reset each time the sheet opens (prefill the name from what they searched).
  useEffect(() => {
    if (open) {
      setName(prefillName?.trim() ?? '');
      setBrand('');
      setDomain(defaultDomain);
      setCategory(null);
      setPhoto(null);
      setError('');
    }
  }, [open, prefillName, defaultDomain]);

  const all = useMemo(() => [...catalog, ...state.customProducts], [state.customProducts]);

  // Live dedup: as they type, surface products already on Dew so they pick instead of duplicating.
  const suggestions = useMemo(() => {
    const terms = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return all
      .filter((p) => {
        const hay = `${p.name} ${p.brand}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 4);
  }, [name, all]);

  const brands = useMemo(
    () => Array.from(new Set(all.map((p) => p.brand))).sort((a, b) => a.localeCompare(b)),
    [all],
  );

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhoto(await downscaleToDataUrl(file, 512));
    } catch {
      /* ignore unreadable image */
    }
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Give it a name first.');
      return;
    }
    if (!category) {
      setError('Pick a category so it can be ranked.');
      return;
    }
    const id = `custom-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    const product: Product = {
      id,
      name: name.trim(),
      brand: brand.trim() || 'Community',
      category,
      domain,
      skinTypes: ['oily', 'combination', 'dry', 'sensitive'],
      concernTags: [],
      priceTier: '$$',
      price: 0,
      timeOfDay: 'any',
      blurb: 'Added by the community.',
      restockUrl: '',
      styleTags: ['community'],
      custom: true,
      ...(photo ? { image: photo } : {}),
      ...(domain === 'fragrance' ? { scentFamily: 'fresh' as const, notes: [] } : {}),
    };
    addCustomProduct(product);
    onCreated(product);
  };

  const categories = categoriesForDomain(domain);

  return (
    <Sheet open={open} onClose={onClose} title="Add a product">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

      <div className="flex flex-col gap-4 pb-2">
        {/* Photo + name — the two things that matter */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-[18px] border border-dashed border-line bg-bg text-muted transition-transform active:scale-95"
            aria-label="Add a photo"
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Camera size={20} />
                <span className="text-[11px] font-medium">Photo</span>
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <label className="text-[12px] font-semibold text-muted">Product name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Watermelon Glow Toner"
              className="mt-1 w-full rounded-[14px] border border-line bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Dedup: already on Dew? */}
        {suggestions.length > 0 && (
          <div className="rounded-[16px] border border-line bg-surface p-2.5">
            <div className="px-1 pb-1.5 text-[11.5px] font-semibold text-muted">
              Already on Dew? Tap to use it
            </div>
            <div className="flex flex-col">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPickExisting(p.id)}
                  className="flex items-center gap-2.5 rounded-xl p-1.5 text-left active:bg-ink/[0.03]"
                >
                  <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold leading-tight">{p.name}</div>
                    <div className="num truncate text-[12px] text-muted">{p.brand}</div>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-semibold text-accent">Use</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Brand */}
        <div>
          <label className="text-[12px] font-semibold text-muted">Brand (optional)</label>
          <input
            list="dew-brands"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Start typing…"
            className="mt-1 w-full rounded-[14px] border border-line bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
          />
          <datalist id="dew-brands">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        {/* Category */}
        <div>
          <label className="text-[12px] font-semibold text-muted">Category</label>
          <div className="mt-1.5 flex gap-1.5">
            {DOMAINS.map((d) => (
              <Chip
                key={d.value}
                on={domain === d.value}
                onClick={() => {
                  setDomain(d.value);
                  setCategory(null);
                  setError('');
                }}
                label={d.label}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Chip
                key={c}
                on={category === c}
                onClick={() => {
                  setCategory(c);
                  setError('');
                }}
                label={categoryLabel(c)}
                subtle
              />
            ))}
          </div>
        </div>

        {error && <p className="text-[13px] font-medium text-tier-f">{error}</p>}

        <PillButton fullWidth size="lg" onClick={submit}>
          <Plus size={17} />
          Add to Dew
        </PillButton>
        <p className="-mt-1 text-center text-[11.5px] text-muted">
          It's on your shelf right away. The community helps verify it.
        </p>
      </div>
    </Sheet>
  );
}

function Chip({
  on,
  onClick,
  label,
  subtle,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
        on
          ? subtle
            ? 'bg-accent text-white'
            : 'bg-ink text-bg'
          : 'bg-ink/[0.05] text-ink',
      )}
    >
      {on && !subtle && <Check size={12} className="mr-1 inline" />}
      {label}
    </button>
  );
}
