// True once the app has REAL Supabase credentials. When false the app runs in Demo Mode: the repo
// serves the bundled sample data and auth is a local demo session (no setup required to explore).
//
// The check is deliberately stricter than "both vars are non-empty". `cp .env.example .env` without
// editing used to flip the app OUT of Demo Mode with a placeholder key — every query then 401s, the
// errors are swallowed, and you get a silently blank app with no indication why. Treat anything that
// isn't a plausible credential as "not configured" and stay in Demo Mode, which at least works.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const looksLikeProjectUrl = (v?: string): boolean => !!v && /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(v);

// Supabase issues either a legacy JWT anon key (three dot-separated segments) or a newer
// `sb_publishable_…` key. Anything else — notably the .env.example placeholder — is not a key.
const looksLikeAnonKey = (v?: string): boolean =>
  !!v && !v.includes('paste-your') && /^(sb_publishable_[A-Za-z0-9_-]+|[\w-]+\.[\w-]+\.[\w-]+)$/.test(v);

export const isSupabaseConfigured = looksLikeProjectUrl(url) && looksLikeAnonKey(anonKey);

// Surface the half-configured case instead of failing silently: env vars present but malformed is
// almost always a typo or an unedited .env, and it otherwise looks identical to "no backend yet".
if (__DEV__ && (url || anonKey) && !isSupabaseConfigured) {
  console.warn(
    '[config] Supabase env vars are set but not usable — staying in Demo Mode.' +
      (looksLikeProjectUrl(url) ? '' : ' EXPO_PUBLIC_SUPABASE_URL is missing or malformed.') +
      (looksLikeAnonKey(anonKey) ? '' : ' EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder.'),
  );
}

export const DEMO_USER_ID = 'demo-user';
