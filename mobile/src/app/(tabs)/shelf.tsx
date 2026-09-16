import { useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FlaskConical, Plus, Search, Sun, Trash2, X } from 'lucide-react-native';

import { CompareCard } from '@/components/CompareCard';
import { ProductImage } from '@/components/ProductImage';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { TierBadge } from '@/components/TierBadge';
import { catalog, categoriesForDomain, categoryLabel, categoryPlural, getProduct, productDomain } from '@/core/catalog';
import {
  applyCompare,
  compareTargetIndex,
  insertionIndex,
  isCompareDone,
  reactionRange,
  startCompareInRange,
  tierColor,
  type CompareSession,
} from '@/core/ranking';
import { routineAM, routinePM, sampleTrials } from '@/core/shelfData';
import { useMyShelf } from '@/data/hooks';
import { rankedFromIds } from '@/core/taste';
import { palette, radius, space } from '@/core/theme';
import type { Category, Domain, Reaction } from '@/core/types';

const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: 'love', emoji: '😍', label: 'Love it' },
  { key: 'like', emoji: '🙂', label: 'Like it' },
  { key: 'fine', emoji: '😐', label: "It's fine" },
  { key: 'dislike', emoji: '🙁', label: "Don't like it" },
  { key: 'never', emoji: '💀', label: 'Never again' },
];

// Insert productId among its own category at a category-local index (ported from the web store).
function placeInCategory(shelf: string[], productId: string, category: Category, localIndex: number): string[] {
  const without = shelf.filter((id) => id !== productId);
  const catIdx = without.map((id, i) => (getProduct(id)?.category === category ? i : -1)).filter((i) => i >= 0);
  const local = Math.max(0, Math.min(localIndex, catIdx.length));
  let globalIndex: number;
  if (catIdx.length === 0) globalIndex = without.length;
  else if (local === 0) globalIndex = catIdx[0];
  else if (local >= catIdx.length) globalIndex = catIdx[catIdx.length - 1] + 1;
  else globalIndex = catIdx[local];
  return [...without.slice(0, globalIndex), productId, ...without.slice(globalIndex)];
}

interface Flow {
  productId: string;
  domain: Domain;
  phase: 'reaction' | 'compare' | 'done';
  shelf: string[]; // same-category opponents
  session?: CompareSession;
  landed?: number;
}

export default function ShelfScreen() {
  const insets = useSafeAreaInsets();
  const { shelf, applyOrder, remove } = useMyShelf();
  const [section, setSection] = useState<'products' | 'routines' | 'trials'>('products');
  const [domain, setDomain] = useState<Domain>('makeup');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);

  const grouped = useMemo(() => {
    const ranked = rankedFromIds(shelf);
    return categoriesForDomain(domain)
      .map((cat) => ({ cat, items: ranked.filter((r) => r.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [shelf, domain]);

  const startRank = (productId: string) => {
    const p = getProduct(productId);
    if (!p) return;
    const sameCat = shelf.filter((id) => id !== productId && getProduct(id)?.category === p.category);
    setPickerOpen(false);
    setDetailFor(null);
    setFlow({ productId, domain: productDomain(p), phase: 'reaction', shelf: sameCat });
  };
  const onReaction = (reaction: Reaction) => {
    if (!flow) return;
    const { lo, hi } = reactionRange(reaction, flow.shelf.length);
    const session = startCompareInRange(flow.productId, lo, hi);
    if (isCompareDone(session)) setFlow({ ...flow, phase: 'done', session, landed: insertionIndex(session) });
    else setFlow({ ...flow, phase: 'compare', session });
  };
  const answer = (newWins: boolean) => {
    if (!flow?.session) return;
    const session = applyCompare(flow.session, newWins);
    if (isCompareDone(session)) setFlow({ ...flow, phase: 'done', session, landed: insertionIndex(session) });
    else setFlow({ ...flow, session });
  };
  const finish = () => {
    if (!flow || flow.landed == null) return;
    const p = getProduct(flow.productId);
    if (p) applyOrder(placeInCategory(shelf, flow.productId, p.category, flow.landed as number));
    setFlow(null);
  };

  const detailProduct = detailFor ? getProduct(detailFor) : null;
  const detailRanked = detailFor ? rankedFromIds(shelf).find((r) => r.productId === detailFor) : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(4), paddingBottom: space(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space(5) }}>
          <Text style={{ fontSize: 34, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 }}>Shelf</Text>
          <Text style={{ marginTop: space(2), fontSize: 15, color: palette.muted }}>Everything you've tried, saved and use.</Text>
        </View>

        <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
          <SegmentedToggle
            value={section}
            onChange={setSection}
            options={[
              { value: 'products', label: 'Products' },
              { value: 'routines', label: 'Routines' },
              { value: 'trials', label: 'Trials' },
            ]}
          />
        </View>

        {section === 'products' ? (
          <>
            <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
              <SegmentedToggle
                value={domain}
                onChange={setDomain}
                options={[
                  { value: 'makeup', label: 'Makeup' },
                  { value: 'skincare', label: 'Skincare' },
                  { value: 'fragrance', label: 'Fragrance' },
                ]}
              />
            </View>
            <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
              <PrimaryButton icon={<Plus size={18} color={palette.white} />} label="Rank a product" onPress={() => setPickerOpen(true)} />
            </View>

            {grouped.length > 0 ? (
              <View style={{ paddingHorizontal: space(5), paddingTop: space(5) }}>
                {grouped.map((g) => (
                  <View key={g.cat} style={{ marginBottom: space(5) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 10 }}>
                      <Text style={{ fontSize: 23, fontWeight: '700', color: palette.ink }}>{categoryLabel(g.cat)}</Text>
                      <Text style={{ fontSize: 12.5, fontWeight: '500', color: palette.muted }}>{g.items.length} ranked</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {g.items.map((it) => {
                        const p = getProduct(it.productId);
                        if (!p) return null;
                        return (
                          <Pressable
                            key={it.productId}
                            onPress={() => setDetailFor(it.productId)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderRadius: 20, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}
                          >
                            <Text style={{ width: 34, textAlign: 'center', fontSize: 27, fontWeight: '700', color: tierColor(it.tier) }}>{String(it.groupRank).padStart(2, '0')}</Text>
                            <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={52} height={52} radius={14} />
                            <View style={{ flex: 1 }}>
                              <Text numberOfLines={1} style={{ fontSize: 15.5, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                              <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>{p.brand}</Text>
                              <Text style={{ fontSize: 11.5, color: palette.muted, marginTop: 2 }}>#{it.groupRank} of {it.groupSize} {categoryPlural(g.cat)}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyProducts domain={domain} />
            )}
          </>
        ) : null}

        {section === 'routines' ? (
          <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: space(4) }}>
            <RoutineBlock title="Morning" ids={routineAM} />
            <RoutineBlock title="Evening" ids={routinePM} />
          </View>
        ) : null}

        {section === 'trials' ? (
          <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
            <PrimaryButton icon={<FlaskConical size={18} color={palette.white} />} label="Start a trial" onPress={() => setPickerOpen(true)} />
            {sampleTrials.length === 0 ? (
              <Text style={{ marginTop: space(6), textAlign: 'center', fontSize: 13.5, color: palette.muted, lineHeight: 20 }}>
                No active trials yet. Track a product over time to see if it actually works for you.
              </Text>
            ) : (
              <View style={{ marginTop: space(4), gap: 8 }}>
                {sampleTrials.map((t) => {
                  const p = getProduct(t.productId);
                  if (!p) return null;
                  return (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                      <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                        <Text style={{ fontSize: 12, color: palette.muted }}>Day {t.day} · {t.checkins} check-in{t.checkins === 1 ? '' : 's'}</Text>
                      </View>
                      <FlaskConical size={15} color={palette.accent} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Pick a product to rank */}
      <PickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={startRank} inShelf={shelf} initialDomain={domain} />

      {/* Row detail */}
      <Modal visible={!!detailProduct} transparent animationType="fade" onRequestClose={() => setDetailFor(null)}>
        <Pressable onPress={() => setDetailFor(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space(5), paddingBottom: insets.bottom + space(5) }}>
            {detailProduct && detailRanked ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ProductImage id={detailProduct.id} brand={detailProduct.brand} image={detailProduct.image} category={categoryLabel(detailProduct.category)} width={56} height={56} radius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{detailProduct.name}</Text>
                    <Text style={{ fontSize: 13, color: palette.muted }}>{detailProduct.brand}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <TierBadge tier={detailRanked.tier} />
                    <Text style={{ fontSize: 12, color: palette.muted }}>#{detailRanked.groupRank} of {detailRanked.groupSize}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: space(5) }}>
                  <Pressable onPress={() => startRank(detailProduct.id)} style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, paddingVertical: 13 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>Re-rank</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      remove(detailProduct.id);
                      setDetailFor(null);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 18, backgroundColor: 'rgba(194,123,99,0.1)' }}
                  >
                    <Trash2 size={16} color={palette.tierF} />
                    <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.tierF }}>Remove</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ranking flow */}
      {flow ? <RankFlow flow={flow} onReaction={onReaction} onAnswer={answer} onFinish={finish} onCancel={() => setFlow(null)} /> : null}
    </View>
  );
}

function PrimaryButton({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 15, opacity: pressed ? 0.9 : 1 })}>
      {icon}
      <Text style={{ color: palette.white, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function RoutineBlock({ title, ids }: { title: string; ids: string[] }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Sun size={16} color={palette.accent} />
        <Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{title}</Text>
      </View>
      <View style={{ backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
        {ids.map((id, i) => {
          const p = getProduct(id);
          if (!p) return null;
          return (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
              <ProductImage id={p.id} brand={p.brand} image={p.image} width={40} height={40} radius={12} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: palette.ink }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>{categoryLabel(p.category)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptyProducts({ domain }: { domain: Domain }) {
  const noun = domain === 'makeup' ? 'makeup' : domain === 'fragrance' ? 'fragrance' : 'skincare';
  return (
    <View style={{ paddingHorizontal: space(5), paddingTop: space(8), alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: space(4) }}>
        {(['S', 'A', 'B', 'C', 'F'] as const).map((t) => (
          <TierBadge key={t} tier={t} size="sm" />
        ))}
      </View>
      <Text style={{ fontSize: 19, fontWeight: '700', color: palette.ink, textAlign: 'center' }}>Rank your first {noun} products</Text>
      <Text style={{ marginTop: space(2), fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
        Add something you've used and we'll ask a couple quick head-to-heads to slot it into your tier list.
      </Text>
    </View>
  );
}

function PickerModal({ open, onClose, onPick, inShelf, initialDomain }: { open: boolean; onClose: () => void; onPick: (id: string) => void; inShelf: string[]; initialDomain: Domain }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const owned = new Set(inShelf);
    return catalog
      .filter((p) => productDomain(p) === domain && !owned.has(p.id))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
  }, [q, domain, inShelf]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: space(4) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>Rank a product</Text>
          <Pressable onPress={onClose} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
          <SegmentedToggle
            value={domain}
            onChange={setDomain}
            options={[
              { value: 'makeup', label: 'Makeup' },
              { value: 'skincare', label: 'Skin' },
              { value: 'fragrance', label: 'Scent' },
            ]}
          />
          <View style={{ marginTop: space(2), flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: space(4) }}>
            <Search size={16} color={palette.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search products you've tried" placeholderTextColor={palette.muted} style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: palette.ink }} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: space(5), gap: 8, paddingBottom: insets.bottom + space(5) }} keyboardShouldPersistTaps="handled">
          {results.map((p) => (
            <Pressable key={p.id} onPress={() => onPick(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
              <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={52} height={52} radius={14} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>{p.brand}</Text>
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{categoryLabel(p.category)}</Text>
            </Pressable>
          ))}
          {results.length === 0 ? <Text style={{ paddingVertical: space(6), textAlign: 'center', color: palette.muted }}>Nothing left to add for that.</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function RankFlow({ flow, onReaction, onAnswer, onFinish, onCancel }: { flow: Flow; onReaction: (r: Reaction) => void; onAnswer: (n: boolean) => void; onFinish: () => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const p = getProduct(flow.productId);
  if (!p) return null;
  const preference = flow.domain !== 'skincare';
  const newRank = (flow.landed ?? 0) + 1;
  const total = flow.shelf.length + 1;
  const targetIndex = flow.session ? compareTargetIndex(flow.session) : null;
  const opponent = targetIndex !== null ? getProduct(flow.shelf[targetIndex]) : undefined;

  return (
    <Modal visible animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
          <Pressable onPress={onCancel} hitSlop={10}><ArrowLeft size={22} color={palette.muted} /></Pressable>
          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.6 }}>{flow.phase === 'done' ? 'Ranked' : 'Rank'}</Text>
          <View style={{ width: 22 }} />
        </View>

        {flow.phase === 'reaction' ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space(5) }}>
            <View style={{ alignItems: 'center', marginBottom: space(6) }}>
              <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={112} height={112} radius={22} />
              <Text style={{ marginTop: 12, fontSize: 13, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{p.name}</Text>
              <Text style={{ marginTop: 8, fontSize: 30, fontWeight: '700', color: palette.ink, textAlign: 'center' }}>First impression?</Text>
            </View>
            <View style={{ gap: 10 }}>
              {REACTIONS.map((r) => (
                <Pressable key={r.key} onPress={() => onReaction(r.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {flow.phase === 'compare' && opponent ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space(5) }}>
            <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Ranking {p.name}</Text>
            <Text style={{ marginTop: 8, marginBottom: space(6), textAlign: 'center', fontSize: 28, fontWeight: '700', color: palette.ink }}>{preference ? 'Which do you like more?' : 'Which did more for your skin?'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
              <CompareCard product={p} onChoose={() => onAnswer(true)} />
              <View style={{ justifyContent: 'center' }}><Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted }}>vs</Text></View>
              <CompareCard product={opponent} onChoose={() => onAnswer(false)} />
            </View>
          </View>
        ) : null}

        {flow.phase === 'done' ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space(5) }}>
            <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={112} height={112} radius={22} />
            <Text style={{ marginTop: space(4), fontSize: 28, fontWeight: '700', color: palette.ink, textAlign: 'center' }}>{p.name} is your #{newRank} {categoryLabel(p.category).toLowerCase()}</Text>
            <Text style={{ marginTop: 6, fontSize: 15, color: palette.muted }}>#{newRank} of {total} {categoryPlural(p.category)} you've tried</Text>
            <Pressable onPress={onFinish} style={{ marginTop: space(6), alignSelf: 'stretch', alignItems: 'center', backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 15 }}>
              <Text style={{ color: palette.white, fontSize: 16, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
