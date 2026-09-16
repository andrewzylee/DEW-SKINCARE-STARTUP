// Data access. Every function is Supabase-first with a Demo Mode fallback (bundled sample data)
// when creds are absent — so screens use ONE interface and the app works with or without a backend.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/core/supabase';
import { catalog as sampleCatalog } from '@/core/catalog';
import { myShelf as sampleShelf } from '@/core/social';
import type { Product } from '@/core/types';
import { DEMO_USER_ID, isSupabaseConfigured } from './config';
import type { ProductRow, ProfileRow } from './database.types';

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

// ---- products ----
export async function listProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return sampleCatalog;
  const { data, error } = await supabase.from('products').select('*').eq('status', 'approved').limit(2000);
  if (error || !data) return [];
  return (data as ProductRow[]).map(rowToProduct);
}

// ---- profile ----
export async function getMyProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured) {
    return { id: DEMO_USER_ID, handle: 'you', display_name: 'You', bio: '', location: '', avatar_url: null, school: null, member_since: new Date().toISOString(), onboarded: false };
  }
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (data as ProfileRow) ?? null;
}

// ---- onboarding ----
const DEMO_ONBOARDED_KEY = 'dew.demo.onboarded';

export async function readDemoOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DEMO_ONBOARDED_KEY)) === '1';
  } catch {
    return false;
  }
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

export async function completeOnboarding(userId: string, d: OnboardingData): Promise<void> {
  if (!isSupabaseConfigured) {
    try {
      await AsyncStorage.setItem(DEMO_ONBOARDED_KEY, '1');
    } catch {
      /* ignore */
    }
    return;
  }
  await supabase.from('skin_profiles').upsert(
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
  await supabase.from('profiles').update({ onboarded: true }).eq('id', userId);
}

export async function updateProfile(userId: string, patch: Partial<ProfileRow>): Promise<void> {
  if (!isSupabaseConfigured) return;
  const allowed: Record<string, unknown> = {};
  (['display_name', 'handle', 'bio', 'location', 'avatar_url'] as const).forEach((k) => {
    if (k in patch) allowed[k] = patch[k];
  });
  await supabase.from('profiles').update(allowed).eq('id', userId);
}

// ---- shelf (rankings) ----
export async function getMyShelfIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return sampleShelf;
  const { data, error } = await supabase
    .from('rankings')
    .select('product_id, position')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  if (error || !data) return [];
  return (data as { product_id: string }[]).map((r) => r.product_id);
}

// Persist the whole ordered shelf (positions = index). Cheap for realistic shelf sizes; keeps the
// order authoritative after a rank/reorder. Demo Mode is a no-op (state lives in the hook).
export async function saveShelfOrder(userId: string, ids: string[]): Promise<void> {
  if (!isSupabaseConfigured || ids.length === 0) return;
  const rows = ids.map((product_id, i) => ({ user_id: userId, product_id, position: i }));
  await supabase.from('rankings').upsert(rows, { onConflict: 'user_id,product_id' });
}

export async function removeRanking(userId: string, productId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('rankings').delete().eq('user_id', userId).eq('product_id', productId);
}
