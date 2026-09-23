import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { people } from '@/core/social';
import { KEYS, readJson, writeJson } from './local';

// Who you follow, shared by the Feed's Following tab and the Followers/Following list so a toggle
// in one is visible in the other. The social graph is still bundled sample data, so this persists
// locally; once `people` comes from Supabase this moves to the `follows` table (follower_id/
// followee_id already exist in the schema).
interface FollowValue {
  following: string[];
  isFollowing: (personId: string) => boolean;
  toggleFollow: (personId: string) => void;
}

const FollowContext = createContext<FollowValue | null>(null);

// You start out following everyone in the sample cast, so the Feed has content on first run.
const DEFAULT_FOLLOWING = people.map((p) => p.id);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [following, setFollowing] = useState<string[]>(DEFAULT_FOLLOWING);

  useEffect(() => {
    let active = true;
    readJson<string[]>(KEYS.following).then((saved) => {
      if (active && saved) setFollowing(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleFollow = useCallback((personId: string) => {
    setFollowing((prev) => {
      const next = prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId];
      writeJson(KEYS.following, next);
      return next;
    });
  }, []);

  const isFollowing = useCallback((personId: string) => following.includes(personId), [following]);

  return <FollowContext.Provider value={{ following, isFollowing, toggleFollow }}>{children}</FollowContext.Provider>;
}

export function useFollowing(): FollowValue {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollowing must be used within <FollowProvider>');
  return ctx;
}
