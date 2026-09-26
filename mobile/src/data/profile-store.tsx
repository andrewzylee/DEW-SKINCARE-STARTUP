import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/core/auth';
import { isSupabaseConfigured } from './config';
import * as repo from './repo';
import type { OnboardingData } from './repo';
import type { ProfileRow, SkinProfileRow } from './database.types';

// Holds the current user's profile, skin profile and onboarding state in one place so edits reflect
// immediately and persist through the repo (Supabase when configured, AsyncStorage in Demo Mode).
// `skinProfile` is the quiz answers read back — screens read it instead of hardcoding a skin type.
interface ProfileValue {
  profile: ProfileRow | null;
  skinProfile: SkinProfileRow | null;
  loading: boolean;
  onboarded: boolean;
  updateProfile: (patch: Partial<ProfileRow>) => void;
  updateSkinProfile: (patch: Partial<SkinProfileRow>) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

const ProfileContext = createContext<ProfileValue | null>(null);

const EMPTY_SKIN_PROFILE: SkinProfileRow = {
  user_id: '',
  skin_type: null,
  tone: null,
  undertone: null,
  goal: null,
  interests: [],
  avoid: [],
  budget: null,
  depth: null,
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfileRow | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const [p, sp] = await Promise.all([repo.getMyProfile(userId), repo.getMySkinProfile(userId)]);
      const ob = isSupabaseConfigured ? p?.onboarded ?? false : await repo.readDemoOnboarded();
      if (active) {
        setProfile(p);
        setSkinProfile(sp);
        setOnboarded(ob);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const updateProfile = useCallback(
    (patch: Partial<ProfileRow>) => {
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
      if (userId) repo.updateProfile(userId, patch).catch(() => {});
    },
    [userId],
  );

  const updateSkinProfile = useCallback(
    (patch: Partial<SkinProfileRow>) => {
      setSkinProfile((prev) => ({ ...(prev ?? EMPTY_SKIN_PROFILE), ...patch, user_id: userId ?? '' }));
      if (userId) repo.updateSkinProfile(userId, patch).catch(() => {});
    },
    [userId],
  );

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      setOnboarded(true);
      if (!userId) return;
      await repo.completeOnboarding(userId, data);
      setSkinProfile(await repo.getMySkinProfile(userId));
    },
    [userId],
  );

  return (
    <ProfileContext.Provider
      value={{ profile, skinProfile, loading, onboarded, updateProfile, updateSkinProfile, completeOnboarding }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
