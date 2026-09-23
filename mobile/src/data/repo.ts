// Data access. Every function is Supabase-first with a Demo Mode fallback when creds are absent —
// so screens use ONE interface and the app works with or without a backend. Demo Mode is backed by
// AsyncStorage (see ./local) and seeded from the bundled sample data on first run, so what you
// rank, edit and answer survives a reload.
import { supabase } from '@/core/supabase';
import { catalog as sampleCatalog } from '@/core/catalog';
import { myShelf as sampleShelf } from '@/core/social';
import type { Product } from '@/core/types';
import { DEMO_USER_ID, isSupabaseConfigured } from './config';
import { KEYS, readJson, writeJson } from './local';
import type { ProductRow, ProfileRow, SkinProfileRow } from './database.types';

const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  brand: r.brand,
  name: r.name,
  category: r.category as Product['category'],
  domain: r.domain as Product['domain'],
  price: r.price ?? undefined,
  image: r.image_url ?? undefined,
  blurb: r.blurb ?? undefined,
  styleTags: r.style_tags ?? [],
});

// Writes used to discard the error Supabase hands back, so a rejected upsert looked like a success
// and only surfaced as data missing after a reload. Surface it in dev instead of swallowing it.
function reportError(op: string, error: { message: string } | null): void {
  if (error && __DEV__) console.warn(`[repo] ${op} failed: ${error.message}`);
}

// ---- products ----
export async function listProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return sampleCatalog;
  const { data, error } = await supabase.from('products').select('*').eq('status', 'approved').limit(2000);
  if (error || !data) {
    reportError('listProducts', error);
    return [];
  }
  return (data as ProductRow[]).map(rowToProduct);
}

// ---- profile ----
const demoProfileBase = (): ProfileRow => ({
  id: DEMO_USER_ID,
  handle: 'you',
  display_name: 'You',
  bio: '',
  location: '',
  avatar_url: null,
  school: null,
  member_since: new Date().toISOString(),
  onboarded: false,
});

const EDITABLE_PROFILE_FIELDS = ['display_name', 'handle', 'bio', 'location', 'avatar_url'] as const;

export async function getMyProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured) {
    const saved = await readJson<Partial<ProfileRow>>(KEYS.profile);
    return { ...demoProfileBase(), ...(saved ?? {}), onboarded: await readDemoOnboarded() };
  }
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (data as ProfileRow) ?? null;
}

export async function updateProfile(userId: string, patch: Partial<ProfileRow>): Promise<void> {
  const allowed: Record<string, unknown> = {};
  EDITABLE_PROFILE_FIELDS.forEach((k) => {
    if (k in patch) allowed[k] = patch[k];
  });
  if (!isSupabaseConfigured) {
    const saved = (await readJson<Partial<ProfileRow>>(KEYS.profile)) ?? {};
    await writeJson(KEYS.profile, { ...saved, ...allowed });
    return;
  }
  const { error } = await supabase.from('profiles').update(allowed).eq('id', userId);
  reportError('updateProfile', error);
}

// ---- onboarding / skin profile ----
export async function readDemoOnboarded(): Promise<boolean> {
  return Boolean(await readJson<boolean>(KEYS.onboarded));
}

export interface OnboardingData {
  skinType: string;
  goal: string;
  budget: string;
  depth: string;
  tone?: string;
  undertone?: string;
  interests: string[];
}

// Shapes a row when a partial edit lands before onboarding has written one.
const EMPTY_ONBOARDING: OnboardingData = { skinType: '', goal: '', budget: '', depth: '', interests: [] };

const toSkinProfileRow = (userId: string, d: OnboardingData): SkinProfileRow => ({
  user_id: userId,
  skin_type: d.skinType || null,
  tone: d.tone ?? null,
  undertone: d.undertone ?? null,
  goal: d.goal || null,
  interests: d.interests,
  avoid: [],
  budget: d.budget || null,
  depth: d.depth || null,
});

// The quiz answers ARE the skin profile — Demo Mode previously reduced them to a single boolean and
// threw the rest away, which is why Shade Match and Profile fell back to hardcoded constants.
export async function completeOnboarding(userId: string, d: OnboardingData): Promise<void> {
  if (!isSupabaseConfigured) {
    await writeJson(KEYS.skinProfile, toSkinProfileRow(userId, d));
    await writeJson(KEYS.onboarded, true);
    return;
  }
  const { error } = await supabase.from('skin_profiles').upsert(
    {
      user_id: userId,
      skin_type: d.skinType,
      tone: d.tone ?? null,
      undertone: d.undertone ?? null,
      goal: d.goal,
      interests: d.interests,
      budget: d.budget,
      depth: d.depth,
    },
    { onConflict: 'user_id' },
  );
  reportError('completeOnboarding.skin_profiles', error);
  const { error: profileError } = await supabase.from('profiles').update({ onboarded: true }).eq('id', userId);
  reportError('completeOnboarding.profiles', profileError);
}

export async function getMySkinProfile(userId: string): Promise<SkinProfileRow | null> {
  if (!isSupabaseConfigured) return readJson<SkinProfileRow>(KEYS.skinProfile);
  const { data, error } = await supabase.from('skin_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) reportError('getMySkinProfile', error);
  return (data as SkinProfileRow) ?? null;
}

// Partial edits made outside the quiz — e.g. changing tone/undertone in Shade Match.
export async function updateSkinProfile(userId: string, patch: Partial<SkinProfileRow>): Promise<void> {
  if (!isSupabaseConfigured) {
    const saved = (await readJson<SkinProfileRow>(KEYS.skinProfile)) ?? toSkinProfileRow(userId, EMPTY_ONBOARDING);
    await writeJson(KEYS.skinProfile, { ...saved, ...patch, user_id: userId });
    return;
  }
  const { error } = await supabase.from('skin_profiles').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  reportError('updateSkinProfile', error);
}

// ---- shelf (rankings) ----
export async function getMyShelfIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    // Nothing stored on first run — seed from the sample shelf so the demo opens with content.
    return (await readJson<string[]>(KEYS.shelf)) ?? sampleShelf;
  }
  const { data, error } = await supabase
    .from('rankings')
    .select('product_id, position')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  if (error || !data) {
    reportError('getMyShelfIds', error);
    return [];
  }
  return (data as { product_id: string }[]).map((r) => r.product_id);
}

// Persist the whole ordered shelf (positions = index). Cheap for realistic shelf sizes; keeps the
// order authoritative after a rank/reorder.
export async function saveShelfOrder(userId: string, ids: string[]): Promise<void> {
  if (!isSupabaseConfigured) {
    await writeJson(KEYS.shelf, ids); // an empty shelf is a real state — store it
    return;
  }
  if (ids.length === 0) return;
  const rows = ids.map((product_id, i) => ({ user_id: userId, product_id, position: i }));
  const { error } = await supabase.from('rankings').upsert(rows, { onConflict: 'user_id,product_id' });
  reportError('saveShelfOrder', error);
}

export async function removeRanking(userId: string, productId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const saved = (await readJson<string[]>(KEYS.shelf)) ?? sampleShelf;
    await writeJson(
      KEYS.shelf,
      saved.filter((x) => x !== productId),
    );
    return;
  }
  const { error } = await supabase.from('rankings').delete().eq('user_id', userId).eq('product_id', productId);
  reportError('removeRanking', error);
}
