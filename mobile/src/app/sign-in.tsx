import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, MailCheck } from 'lucide-react-native';

import { Text, TextInput } from '@/components/Text';
import { useAnnounce } from '@/core/a11y';
import { useAuth } from '@/core/auth';
import { displayNameError, emailError, friendlyAuthError, passwordError } from '@/core/validation';
import { font, hitSlopFor, palette, radius, space } from '@/core/theme';

type Mode = 'signin' | 'signup' | 'forgot';
// After a successful submit some modes show a "go check your inbox" panel instead of the form.
type Sent = null | 'confirm' | 'reset';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, resendConfirmation, isDemo } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent>(null);
  useAnnounce(error);
  useAnnounce(notice);

  const go = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setSent(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      const eErr = emailError(email);
      if (eErr) throw new Error(eErr);

      if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSent('reset');
        return;
      }

      const pErr = passwordError(password);
      if (pErr) throw new Error(pErr);

      if (mode === 'signin') {
        await signInWithEmail(email, password);
        return; // the auth listener routes away from here
      }

      const nErr = displayNameError(name);
      if (nErr) throw new Error(nErr);
      const result = await signUpWithEmail(email, password, name);
      if (result === 'already-registered') {
        setMode('signin');
        setNotice('That email already has an account — sign in below.');
        return;
      }
      if (result === 'confirm-email') setSent('confirm');
      // 'signed-in' needs no handling: the auth listener takes over.
    });

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

  // ---- "check your inbox" panel ----
  if (sent) {
    const isConfirm = sent === 'confirm';
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(7) }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MailCheck size={28} color={palette.accent} />
        </View>
        <Text accessibilityRole="header" style={{ marginTop: space(4), fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink, textAlign: 'center' }}>
          {isConfirm ? 'Confirm your email' : 'Check your inbox'}
        </Text>
        <Text style={{ marginTop: space(3), fontSize: font.size.base, lineHeight: 22, color: palette.muted, textAlign: 'center', maxWidth: 320 }}>
          {isConfirm
            ? 'We sent a confirmation link to '
            : 'If an account exists for '}
          <Text style={{ fontWeight: '700', color: palette.ink }}>{email.trim()}</Text>
          {isConfirm ? '. Tap it to finish setting up your account.' : ', a password reset link is on its way.'}
        </Text>

        {isConfirm ? (
          <Pressable
            onPress={() => run(async () => {
              await resendConfirmation(email);
              setNotice('Sent again.');
            })}
            disabled={busy}
            accessibilityRole="button"
            style={{ marginTop: space(5) }}
          >
            <Text style={{ fontSize: font.size.base, fontWeight: '700', color: palette.accent }}>{busy ? 'Sending…' : 'Resend the email'}</Text>
          </Pressable>
        ) : null}

        {notice ? <Text style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.accent }}>{notice}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.danger, textAlign: 'center' }}>{error}</Text> : null}

        <Pressable onPress={() => go('signin')} accessibilityRole="button" style={{ marginTop: space(6) }}>
          <Text style={{ fontSize: font.size.base, color: palette.muted }}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  const cta = mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: space(6), paddingTop: insets.top + space(6), paddingBottom: insets.bottom + space(6) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode !== 'signin' ? (
          <Pressable onPress={() => go('signin')} hitSlop={hitSlopFor(22)} accessibilityRole="button" accessibilityLabel="Back to sign in" style={{ position: 'absolute', top: insets.top + space(2), left: space(5) }}>
            <ArrowLeft size={22} color={palette.muted} />
          </Pressable>
        ) : null}

        <Text style={{ fontFamily: font.display, fontSize: font.size.display, fontWeight: '600', color: palette.ink, letterSpacing: -0.5, textAlign: 'center' }}>Dew</Text>
        <Text accessibilityRole="header" style={{ marginTop: space(2), fontSize: font.size.lg, fontWeight: '600', color: palette.ink, textAlign: 'center' }}>{title}</Text>
        {mode === 'forgot' ? (
          <Text style={{ marginTop: space(2), fontSize: font.size.base, lineHeight: 20, color: palette.muted, textAlign: 'center' }}>
            Enter your email and we&apos;ll send you a link to set a new one.
          </Text>
        ) : null}

        {isDemo ? (
          <View style={{ marginTop: space(4), borderRadius: 14, backgroundColor: palette.accentSoft, padding: space(4) }}>
            <Text style={{ fontSize: font.size.sm, lineHeight: 19, color: palette.accentInk, textAlign: 'center' }}>
              Demo Mode — no backend is connected, so accounts can&apos;t be created yet. Add Supabase credentials to enable sign-up.
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: space(5), gap: 10 }}>
          {mode === 'signup' ? (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              accessibilityLabel="Your name"
              placeholderTextColor={palette.muted}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              style={fieldStyle}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            accessibilityLabel="Email"
            placeholderTextColor={palette.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            style={fieldStyle}
          />

          {mode !== 'forgot' ? (
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'Create a password' : 'Password'}
                accessibilityLabel={mode === 'signup' ? 'Create a password' : 'Password'}
                placeholderTextColor={palette.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                returnKeyType="go"
                onSubmitEditing={submit}
                style={[fieldStyle, { paddingRight: 52 }]}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                hitSlop={hitSlopFor(19)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 14 }}
              >
                {showPassword ? <EyeOff size={19} color={palette.muted} /> : <Eye size={19} color={palette.muted} />}
              </Pressable>
            </View>
          ) : null}
        </View>

        {notice ? <Text style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.accent, textAlign: 'center' }}>{notice}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.danger, textAlign: 'center' }}>{error}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={cta}
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
          {busy ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontSize: font.size.lg, fontWeight: '700' }}>{cta}</Text>}
        </Pressable>

        {mode === 'signin' ? (
          <Pressable onPress={() => go('forgot')} accessibilityRole="button" style={{ marginTop: space(4), alignSelf: 'center' }} hitSlop={12}>
            <Text style={{ fontSize: font.size.base, color: palette.muted }}>Forgot your password?</Text>
          </Pressable>
        ) : null}

        {mode !== 'forgot' ? (
          <>
            <View style={{ marginTop: space(5), flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
              <Text style={{ fontSize: font.size.xs, fontWeight: '600', color: palette.muted }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
            </View>

            <Pressable
              onPress={() => run(signInWithGoogle)}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                marginTop: space(4),
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                borderRadius: radius.pill,
                paddingVertical: 15,
                opacity: pressed || busy ? 0.85 : 1,
              })}
            >
              <Text style={{ color: palette.ink, fontSize: font.size.base, fontWeight: '600' }}>Continue with Google</Text>
            </Pressable>

            <Pressable onPress={() => go(mode === 'signin' ? 'signup' : 'signin')} accessibilityRole="button" style={{ marginTop: space(5), alignSelf: 'center' }} hitSlop={12}>
              <Text style={{ fontSize: font.size.base, color: palette.muted }}>
                {mode === 'signin' ? "New to Dew? " : 'Already have an account? '}
                <Text style={{ fontWeight: '700', color: palette.accent }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</Text>
              </Text>
            </Pressable>
          </>
        ) : null}

        <Text style={{ marginTop: space(6), color: palette.muted, fontSize: font.size.xs, textAlign: 'center', lineHeight: 17 }}>
          By continuing you agree to our Terms & Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
