import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { supabase } from '@/core/supabase';
import { isSupabaseConfigured } from '@/data/config';
import { friendlyAuthError } from '@/core/validation';
import { font, palette, radius, space } from '@/core/theme';

/**
 * Where every auth redirect lands: email confirmation, password reset and the Google OAuth
 * callback. On native these arrive as `dew://auth-callback` and the Linking listener in core/auth
 * also handles them; on web `makeRedirectUri` resolves to `http://<origin>/auth-callback`, which
 * expo-router resolves as a real route — so this screen has to exist or the link 404s.
 *
 * Once the code is exchanged the auth listener fires and the root layout routes onward, so the
 * success path here just waits.
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fail = (msg: string) => {
      if (active) setError(msg);
    };

    (async () => {
      if (!isSupabaseConfigured) return fail('No backend is connected.');

      // Supabase reports a rejected or expired link in the query string rather than by failing.
      if (params.error || params.error_description) {
        const raw = params.error_description ?? params.error ?? 'That link could not be used.';
        return fail(friendlyAuthError(decodeURIComponent(raw.replace(/\+/g, ' '))));
      }

      if (params.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) {
          // The PKCE verifier lives in the storage of the browser that STARTED the flow. Opening
          // the email in a different browser is the usual cause and the message is inscrutable.
          return fail(
            `${friendlyAuthError(exchangeError.message)}\n\nIf you opened this link in a different browser than the one you signed up in, open it in the original browser instead.`,
          );
        }
        return; // the auth listener + root layout take it from here
      }

      // Older email templates send token_hash + type instead of a PKCE code.
      if (params.token_hash && params.type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as 'signup' | 'recovery' | 'email_change' | 'magiclink' | 'invite',
        });
        if (otpError) return fail(friendlyAuthError(otpError.message));
        return;
      }

      fail('This link is missing its confirmation code.');
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(7) }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(168,67,47,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={26} color={palette.danger} />
        </View>
        <Text accessibilityRole="header" style={{ marginTop: space(4), fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink, textAlign: 'center' }}>
          Couldn&apos;t finish signing you in
        </Text>
        <Text style={{ marginTop: space(3), fontSize: font.size.base, lineHeight: 21, color: palette.muted, textAlign: 'center', maxWidth: 340 }}>
          {error}
        </Text>
        <Pressable
          onPress={() => router.replace('/sign-in')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: space(6),
            backgroundColor: palette.accent,
            borderRadius: radius.pill,
            paddingHorizontal: 28,
            paddingVertical: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: palette.white, fontSize: font.size.base, fontWeight: '700' }}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: space(4) }}>
      <ActivityIndicator size="large" color={palette.accent} />
      <Text style={{ fontSize: font.size.base, color: palette.muted }}>Signing you in…</Text>
    </View>
  );
}
