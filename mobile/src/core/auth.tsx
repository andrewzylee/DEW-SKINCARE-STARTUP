import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';
import { DEMO_USER_ID, isSupabaseConfigured } from '../data/config';

WebBrowser.maybeCompleteAuthSession();
const redirectTo = makeRedirectUri({ scheme: 'dew', path: 'auth-callback' });

async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token, code } = params;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }
}

/**
 * What happened when someone submitted the sign-up form.
 * - 'signed-in'         — a session exists now (email confirmation is off in the Supabase project)
 * - 'confirm-email'     — account created, waiting on the confirmation link (the default)
 * - 'already-registered'— that address already has an account
 */
export type SignUpResult = 'signed-in' | 'confirm-email' | 'already-registered';

interface AuthValue {
  userId: string | null; // signed-in user's id (or the demo id in Demo Mode)
  email: string | null;
  isDemo: boolean; // true when Supabase isn't configured
  loading: boolean;
  /** True after arriving via a password-reset link: the UI must collect a new password. */
  recoveringPassword: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const demoUnavailable = () => {
  throw new Error('No backend connected. Add Supabase credentials to create a real account.');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo Mode (no creds): drop straight into the app as a local demo user.
  const [userId, setUserId] = useState<string | null>(isSupabaseConfigured ? null : DEMO_USER_ID);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [recoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });
    const { data: authSub } = supabase.auth.onAuthStateChange((event, next) => {
      setUserId(next?.user.id ?? null);
      setEmail(next?.user.email ?? null);
      // Supabase fires this once the recovery link's token has been exchanged for a session. The
      // session is real but scoped to changing the password, so the UI has to branch on it.
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT') setRecoveringPassword(false);
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      authSub.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  // Deep links carry the OAuth callback, the email-confirmation link and the password-reset link.
  // Without this, a sign-in resumed from the browser or an email silently produces no session:
  // openAuthSessionAsync only returns the URL when the in-app browser is still in the foreground.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const consume = (url: string | null) => {
      if (url) createSessionFromUrl(url).catch(() => undefined);
    };
    Linking.getInitialURL().then(consume);
    const sub = Linking.addEventListener('url', ({ url }) => consume(url));
    return () => sub.remove();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUserId(DEMO_USER_ID); // demo fallback if the sign-in screen is ever reached without creds
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign-in.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) await createSessionFromUrl(result.url);
  }, []);

  const signUpWithEmail = useCallback(async (rawEmail: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured) return demoUnavailable();
    const { data, error } = await supabase.auth.signUp({
      email: rawEmail.trim(),
      password,
      // handle_new_user() reads full_name out of raw_user_meta_data to seed the profiles row,
      // so the name has to go in here rather than being written afterwards.
      options: { data: { full_name: displayName.trim() }, emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    // Supabase deliberately does not error on a duplicate address (it would let anyone enumerate
    // your users). It returns a decoy user with an empty identities array instead.
    if (data.user && (data.user.identities?.length ?? 0) === 0) return 'already-registered' as const;
    return (data.session ? 'signed-in' : 'confirm-email') as SignUpResult;
  }, []);

  const signInWithEmail = useCallback(async (rawEmail: string, password: string) => {
    if (!isSupabaseConfigured) return demoUnavailable();
    const { error } = await supabase.auth.signInWithPassword({ email: rawEmail.trim(), password });
    if (error) throw error;
  }, []);

  const resendConfirmation = useCallback(async (rawEmail: string) => {
    if (!isSupabaseConfigured) return demoUnavailable();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: rawEmail.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (rawEmail: string) => {
    if (!isSupabaseConfigured) return demoUnavailable();
    const { error } = await supabase.auth.resetPasswordForEmail(rawEmail.trim(), { redirectTo });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) return demoUnavailable();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecoveringPassword(false);
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        email,
        isDemo: !isSupabaseConfigured,
        loading,
        recoveringPassword,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resendConfirmation,
        sendPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
