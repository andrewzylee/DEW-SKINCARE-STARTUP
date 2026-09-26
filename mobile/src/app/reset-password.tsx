import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, KeyRound } from 'lucide-react-native';

import { Text, TextInput } from '@/components/Text';
import { useAnnounce } from '@/core/a11y';
import { useAuth } from '@/core/auth';
import { friendlyAuthError, passwordError } from '@/core/validation';
import { font, hitSlopFor, palette, radius, space } from '@/core/theme';

// Where a password-reset link lands. Supabase has already exchanged the link's token for a session
// by the time we get here (auth.tsx sets recoveringPassword on the PASSWORD_RECOVERY event), so all
// that's left is collecting the new password. The root layout routes here while that flag is set.
export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const { updatePassword, email, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useAnnounce(error);

  const submit = async () => {
    setError(null);
    const pErr = passwordError(password);
    if (pErr) return setError(pErr);
    if (password !== confirm) return setError('Those passwords do not match.');
    setBusy(true);
    try {
      await updatePassword(password); // clears recoveringPassword → the layout routes onward
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'Could not update your password.'));
    } finally {
      setBusy(false);
    }
  };

  const fieldStyle = {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: font.size.base,
    color: palette.ink,
  } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: space(6), paddingTop: insets.top + space(6), paddingBottom: insets.bottom + space(6) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <KeyRound size={26} color={palette.accent} />
        </View>
        <Text accessibilityRole="header" style={{ marginTop: space(4), fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink, textAlign: 'center' }}>Set a new password</Text>
        {email ? (
          <Text style={{ marginTop: space(2), fontSize: font.size.base, color: palette.muted, textAlign: 'center' }}>for {email}</Text>
        ) : null}

        <View style={{ marginTop: space(5), gap: 10 }}>
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              accessibilityLabel="New password"
              placeholderTextColor={palette.muted}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              style={[fieldStyle, { paddingRight: 52 }]}
            />
            <Pressable
              onPress={() => setShow((s) => !s)}
              hitSlop={hitSlopFor(19)}
              accessibilityRole="button"
              accessibilityLabel={show ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 14 }}
            >
              {show ? <EyeOff size={19} color={palette.muted} /> : <Eye size={19} color={palette.muted} />}
            </Pressable>
          </View>

          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            accessibilityLabel="Confirm new password"
            placeholderTextColor={palette.muted}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            style={fieldStyle}
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.danger, textAlign: 'center' }}>{error}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Update password"
          accessibilityState={{ busy, disabled: busy }}
          style={({ pressed }) => ({
            marginTop: space(5),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.accent,
            borderRadius: radius.pill,
            paddingVertical: 16,
            opacity: pressed || busy ? 0.85 : 1,
          })}
        >
          {busy ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontSize: font.size.lg, fontWeight: '700' }}>Update password</Text>}
        </Pressable>

        <Pressable onPress={() => signOut()} accessibilityRole="button" style={{ marginTop: space(5), alignSelf: 'center' }} hitSlop={12}>
          <Text style={{ fontSize: font.size.base, color: palette.muted }}>Cancel and sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
