import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/core/auth';
import { catalog as sampleCatalog } from '@/core/catalog';
import { sampleTrials, type SampleTrial } from '@/core/shelfData';
import { myShelf as sampleShelf } from '@/core/social';
import type { Product } from '@/core/types';
import { isSupabaseConfigured } from './config';
import { KEYS, readJson, writeJson } from './local';
import * as repo from './repo';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : sampleCatalog);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    repo.listProducts().then((p) => {
      if (active) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return { products, loading };
}

// The Shelf: an ordered list of product ids, with optimistic local state that persists through the
// repo — Supabase when configured, AsyncStorage in Demo Mode. `applyOrder` saves a reorder/rank;
// `remove` deletes a ranking. Both modes take the same path, so a reload restores what you ranked.
export function useMyShelf() {
  const { userId } = useAuth();
  // Demo Mode starts on the sample shelf so the first paint is never empty; the stored order (which
  // is seeded from that same sample) replaces it as soon as the read resolves.
  const [shelf, setShelf] = useState<string[]>(isSupabaseConfigured ? [] : sampleShelf);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    repo.getMyShelfIds(userId).then((ids) => {
      if (active) {
        setShelf(ids);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const applyOrder = useCallback(
    (ids: string[]) => {
      setShelf(ids);
      if (userId) repo.saveShelfOrder(userId, ids).catch(() => {});
    },
    [userId],
  );
  const remove = useCallback(
    (id: string) => {
      setShelf((s) => s.filter((x) => x !== id));
      if (userId) repo.removeRanking(userId, id).catch(() => {});
    },
    [userId],
  );

  return { shelf, loading, applyOrder, remove };
}

// Trials you're tracking. Persisted locally, seeded from the sample so the section isn't empty.
// The `trials` / `trial_checkins` tables exist in the schema but have no client code yet — adding
// check-ins and a verdict is the next step, and that's when this moves into repo.ts.
export function useTrials() {
  const [trials, setTrials] = useState<SampleTrial[]>(sampleTrials);

  useEffect(() => {
    let active = true;
    readJson<SampleTrial[]>(KEYS.trials).then((saved) => {
      if (active && saved) setTrials(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  const startTrial = useCallback((productId: string) => {
    setTrials((prev) => {
      if (prev.some((t) => t.productId === productId)) return prev;
      const next = [...prev, { id: `t-${productId}-${Date.now()}`, productId, day: 1, checkins: 0 }];
      writeJson(KEYS.trials, next);
      return next;
    });
  }, []);

  const endTrial = useCallback((id: string) => {
    setTrials((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeJson(KEYS.trials, next);
      return next;
    });
  }, []);

  return { trials, startTrial, endTrial };
}
