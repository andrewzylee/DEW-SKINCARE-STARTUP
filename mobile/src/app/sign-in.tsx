import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/core/auth';
import { palette, space } from '@/core/theme';

export default function SignIn() {
  const { signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(7) }}>
      <Text style={{ fontSize: 44, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 }}>Dew</Text>
      <Text style={{ marginTop: space(3), fontSize: 16, lineHeight: 22, color: palette.muted, textAlign: 'center', maxWidth: 300 }}>
        Rank your beauty. See what the people you actually trust love.
      </Text>

      <Pressable
        onPress={onGoogle}
        disabled={busy}
        style={({ pressed }) => ({
          marginTop: space(8),
          minWidth: 260,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.ink,
          borderRadius: 999,
          paddingVertical: 16,
          paddingHorizontal: 28,
          opacity: pressed || busy ? 0.85 : 1,
        })}
      >
        {busy ? (
          <ActivityIndicator color={palette.white} />
        ) : (
          <Text style={{ color: palette.white, fontSize: 16, fontWeight: '600' }}>Continue with Google</Text>
        )}
      </Pressable>

      {error ? <Text style={{ marginTop: space(4), color: palette.tierF, textAlign: 'center' }}>{error}</Text> : null}

      <Text style={{ position: 'absolute', bottom: insets.bottom + space(6), color: palette.muted, fontSize: 12, textAlign: 'center', maxWidth: 280 }}>
        By continuing you agree to our Terms & Privacy Policy.
      </Text>
    </View>
  );
}
