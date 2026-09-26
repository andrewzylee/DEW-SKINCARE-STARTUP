// Demo Mode's storage layer. Everything the app would persist to Supabase is mirrored here under a
// `dew.demo.*` key, so an unconfigured build survives a reload instead of resetting to sample data.
// Reads and writes never throw: if device storage is unavailable the app degrades to in-memory.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'dew.demo.';

// Key names are stable — `onboarded` predates this module and is read back by existing installs.
export const KEYS = {
  onboarded: 'onboarded',
  profile: 'profile',
  skinProfile: 'skinProfile',
  shelf: 'shelf',
  following: 'following',
  trials: 'trials',
} as const;

export type LocalKey = (typeof KEYS)[keyof typeof KEYS];

export async function readJson<T>(key: LocalKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null; // missing, unreadable, or written by an older format
  }
}

export async function writeJson(key: LocalKey, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — the in-memory state stays correct for this session */
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS).map((k) => PREFIX + k));
  } catch {
    /* ignore */
  }
}
