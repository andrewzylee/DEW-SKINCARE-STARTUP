// True once the app has Supabase credentials. When false the app runs in Demo Mode: the repo
// serves the bundled sample data and auth is a local demo session (no setup required to explore).
export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const DEMO_USER_ID = 'demo-user';
