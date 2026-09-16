import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/core/auth';
import { catalog as sampleCatalog } from '@/core/catalog';
import { myShelf as sampleShelf } from '@/core/social';
import type { Product } from '@/core/types';
import { isSupabaseConfigured } from './config';
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

// The Shelf: an ordered list of product ids, with optimistic local state that also persists to
// Supabase when configured. `applyOrder` saves a reorder/rank; `remove` deletes a ranking.
export function useMyShelf() {
  const { userId } = useAuth();
  const [shelf, setShelf] = useState<string[]>(isSupabaseConfigured ? [] : sampleShelf);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
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
