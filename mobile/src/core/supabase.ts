import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Public, safe-to-ship values (the anon key is designed to live in the client; Row-Level Security
// is what actually protects the data). Set these in mobile/.env — see .env.example.
// In Demo Mode (no creds) the client is never actually called — the repo returns sample data — but
// createClient() still validates its args, so fall back to a well-formed placeholder to avoid a
// "supabaseUrl is required" crash at import time.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // native handles the OAuth redirect manually (see core/auth)
    flowType: 'pkce',
  },
});
