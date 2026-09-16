import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/core/auth';
import { isSupabaseConfigured } from './config';
import * as repo from './repo';
import type { OnboardingData } from './repo';
import type { ProfileRow } from './database.types';

// Holds the current user's profile + onboarding state in one place so edits reflect immediately
// and persist to Supabase when configured (or AsyncStorage in Demo Mode).
interface ProfileValue {
  profile: ProfileRow | null;
  loading: boolean;
  onboarded: boolean;
  updateProfile: (patch: Partial<ProfileRow>) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const p = await repo.getMyProfile(userId);
      const ob = isSupabaseConfigured ? p?.onboarded ?? false : await repo.readDemoOnboarded();
      if (active) {
        setProfile(p);
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

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      setOnboarded(true);
      if (userId) await repo.completeOnboarding(userId, data);
    },
    [userId],
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, onboarded, updateProfile, completeOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
