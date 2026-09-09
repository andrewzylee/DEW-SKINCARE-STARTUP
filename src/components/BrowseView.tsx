import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  catalog,
  categoriesForDomain,
  productDomain,
  type Category,
  type Domain,
  type PriceTier,
} from '../data/mockCatalog';
import { categoryLabel } from './CategoryTag';
import { useStore } from '../state/store';
import { spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { ProductImage } from './ProductImage';
import { Sheet } from './Sheet';

type DomainFilter = 'all' | Domain;
type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

const DOMAINS: { value: DomainFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'fragrance', label: 'Fragrance' },
];
const PRICE_TIERS: PriceTier[] = ['$', '$$', '$$$'];
const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
];
const PAGE = 48;

// Browse — the Sephora-style catalog surface. Filter the full catalog by domain, category, brand,
// and price, sort it, and open any product. Renders into #stack-overlay at z-[45] so a product
// sheet layers on top and returns here.
export function BrowseView({
  open,
  onClose,
  onOpenProduct,
  onAddProduct,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
  onAddProduct: (prefillName?: string, defaultDomain?: Domain) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state } = useStore();

  const [q, setQ] = useState('');
  const [domain, setDomain] = useState<DomainFilter>('all');
  const [category, setCategory] = useState<'all' | Category>('all');
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Set<PriceTier>>(new Set());
  const [sort, setSort] = useState<Sort>('featured');
  const [limit, setLimit] = useState(PAGE);
  const [brandSheet, setBrandSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  const owned = useMemo(() => {
    const s = new Set<string>();
    state.using.forEach((id) => s.add(id));
    state.shelf.forEach((it) => s.add(it.productId));
    return s;
  }, [state.using, state.shelf]);

  // Everything except the brand filter — so the brand list can show contextual counts.
  const preBrand = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return [...catalog, ...state.customProducts].filter((p) => {
      if (domain !== 'all' && productDomain(p) !== domain) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (prices.size && !prices.has(p.priceTier)) return false;
      if (terms.length) {
        // token search: every word must appear across name + brand + category
        const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [q, domain, category, prices, state.customProducts]);

  const results = useMemo(() => {
    const list = brands.size ? preBrand.filter((p) => brands.has(p.brand)) : preBrand;
    const arr = [...list];
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
    else if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [preBrand, brands, sort]);

  const brandCounts = useMemo(() => {
    const m = new Map<string, number>();
    preBrand.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [preBrand]);

  const categories: Category[] = domain === 'all' ? [] : categoriesForDomain(domain);
  const anyFilter = domain !== 'all' || category !== 'all' || brands.size > 0 || prices.size > 0 || !!q.trim();

  if (!root) return null;

  const pickDomain = (d: DomainFilter) => {
    setDomain(d);
    setCategory('all');
    setBrands(new Set());
    setLimit(PAGE);
  };
  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  };
  const clearAll = () => {
    setQ('');
    setDomain('all');
    setCategory('all');
    setBrands(new Set());
    setPrices(new Set());
    setLimit(PAGE);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[45] flex flex-col bg-bg"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          {/* Header + search */}
          <div className="shrink-0 border-b border-line bg-bg px-5 pb-3 pt-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex flex-1 items-center gap-2 rounded-full bg-ink/[0.05] px-4">
                <Search size={16} className="text-muted" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setLimit(PAGE);
                  }}
                  placeholder="Search all products & brands"
                  className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} aria-label="Clear search">
                    <X size={16} className="text-muted" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="shrink-0 border-b border-line pb-2.5 pt-2.5">
            {/* Domain */}
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5">
              {DOMAINS.map((d) => (
                <Chip key={d.value} on={domain === d.value} onClick={() => pickDomain(d.value)}>
                  {d.label}
                </Chip>
              ))}
            </div>
            {/* Category (per domain) */}
            {categories.length > 0 && (
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-5">
                <Chip on={category === 'all'} onClick={() => { setCategory('all'); setLimit(PAGE); }}>
                  All
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    on={category === c}
                    onClick={() => { setCategory(c); setLimit(PAGE); }}
                  >
                    {categoryLabel(c)}
                  </Chip>
                ))}
              </div>
            )}
            {/* Brand · price · sort */}
            <div className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto px-5">
              <Chip on={brands.size > 0} onClick={() => setBrandSheet(true)}>
                <SlidersHorizontal size={12} className="mr-1 inline" />
                {brands.size > 0 ? `${brands.size} brand${brands.size === 1 ? '' : 's'}` : 'Brand'}
                <ChevronDown size={12} className="ml-0.5 inline" />
              </Chip>
              {PRICE_TIERS.map((t) => (
                <Chip key={t} on={prices.has(t)} onClick={() => { setPrices(toggle(prices, t)); setLimit(PAGE); }}>
                  {t}
                </Chip>
              ))}
              <Chip on={sort !== 'featured'} onClick={() => setSortSheet(true)}>
                {SORTS.find((s) => s.value === sort)!.label}
                <ChevronDown size={12} className="ml-0.5 inline" />
              </Chip>
            </div>
          </div>

          {/* Count + clear */}
          <div className="flex shrink-0 items-center justify-between px-5 py-2">
            <span className="num text-[12.5px] text-muted">
              {results.length} product{results.length === 1 ? '' : 's'}
            </span>
            {anyFilter && (
              <button type="button" onClick={clearAll} className="text-[12.5px] font-semibold text-accent">
                Clear all
              </button>
            )}
          </div>

          {/* Results */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
            <div className="flex flex-col gap-2">
              {results.slice(0, limit).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenProduct(p.id)}
                  className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
                >
                  <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold leading-tight">{p.name}</div>
                    <div className="num truncate text-[12.5px] text-muted">
                      {p.brand} · {categoryLabel(p.category)}
                    </div>
                  </div>
                  {owned.has(p.id) ? (
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-ink">
                      Yours
                    </span>
                  ) : (
                    <span className="num shrink-0 text-[14px] font-semibold">
                      {p.price ? `$${p.price}` : '—'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {results.length === 0 && (
              <p className="pt-14 pb-3 text-center text-[13.5px] text-muted">
                Nothing matches these filters yet.
              </p>
            )}

            {/* Search-first: the "+" fallback when it isn't on Dew yet. */}
            <button
              type="button"
              onClick={() => onAddProduct(q, domain !== 'all' ? domain : 'skincare')}
              className="mt-2 flex w-full items-center gap-3 rounded-[18px] border border-dashed border-line bg-surface/60 p-3 text-left transition-transform active:scale-[0.99]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Plus size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold">
                  {q.trim() ? `Add “${q.trim()}”` : 'Add a product'}
                </div>
                <div className="text-[12.5px] text-muted">Not on Dew yet? Photo + name.</div>
              </div>
            </button>
            {limit < results.length && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="mt-3 w-full rounded-full border border-line bg-surface py-3 text-[14px] font-semibold text-ink active:scale-[0.99]"
              >
                Show more ({results.length - limit} more)
              </button>
            )}
          </div>

          {/* Brand sheet */}
          <Sheet open={brandSheet} onClose={() => setBrandSheet(false)} title="Filter by brand">
            <BrandPicker
              options={brandCounts}
              selected={brands}
              onToggle={(b) => { setBrands(toggle(brands, b)); setLimit(PAGE); }}
              onClear={() => setBrands(new Set())}
            />
          </Sheet>

          {/* Sort sheet */}
          <Sheet open={sortSheet} onClose={() => setSortSheet(false)} title="Sort by">
            <div className="flex flex-col pb-2">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setSort(s.value); setSortSheet(false); }}
                  className="flex items-center justify-between border-t border-line py-3.5 text-left text-[15px] first:border-t-0"
                >
                  <span className={cn(sort === s.value && 'font-semibold text-accent')}>{s.label}</span>
                  {sort === s.value && <Check size={18} className="text-accent" />}
                </button>
              ))}
            </div>
          </Sheet>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function BrandPicker({
  options,
  selected,
  onToggle,
  onClear,
}: {
  options: [string, number][];
  selected: Set<string>;
  onToggle: (brand: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const shown = term ? options.filter(([b]) => b.toLowerCase().includes(term)) : options;
  return (
    <div className="flex flex-col gap-2 pb-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search brands"
        className="w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] outline-none focus:border-ink/25"
      />
      {selected.size > 0 && (
        <button type="button" onClick={onClear} className="self-start text-[13px] font-semibold text-accent">
          Clear {selected.size} selected
        </button>
      )}
      <div className="flex flex-col">
        {shown.map(([brand, count]) => {
          const on = selected.has(brand);
          return (
            <button
              key={brand}
              type="button"
              onClick={() => onToggle(brand)}
              className="flex items-center gap-3 border-t border-line py-3 text-left first:border-t-0"
            >
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                  on ? 'border-accent bg-accent text-white' : 'border-line',
                )}
              >
                {on && <Check size={14} />}
              </span>
              <span className="flex-1 text-[15px] font-medium">{brand}</span>
              <span className="num text-[12.5px] text-muted">{count}</span>
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No brands match.</p>
        )}
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
        on ? 'bg-ink text-bg' : 'bg-ink/[0.05] text-ink',
      )}
    >
      {children}
    </button>
  );
}
