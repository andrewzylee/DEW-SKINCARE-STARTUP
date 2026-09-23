import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/core/auth';
import { FollowProvider } from '@/data/follow-store';
import { ProfileProvider, useProfile } from '@/data/profile-store';
import { palette } from '@/core/theme';

SplashScreen.preventAutoHideAsync();

// Signed-out → /sign-in; arrived via a reset link → /reset-password; signed-in → the tabs.
// Standard expo-router auth guard.
function RootNavigator() {
  const { userId, loading: authLoading, recoveringPassword } = useAuth();
  const { onboarded, loading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();
  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();
    const seg0 = segments[0];
    const onSignIn = seg0 === 'sign-in';
    const onOnboarding = seg0 === 'onboarding';
    const onReset = seg0 === 'reset-password';
    const onCallback = seg0 === 'auth-callback';
    // The callback screen is mid-flight: it has a code but not yet a session. Redirecting on a
    // null userId here would unmount it before the exchange finishes and drop the sign-in.
    if (onCallback && !userId) return;
    // A recovery link produces a real session, so this has to be checked before the signed-in
    // branches — otherwise the user lands in the app and never gets to set a new password.
    if (recoveringPassword) {
      if (!onReset) router.replace('/reset-password');
    } else if (!userId) {
      if (!onSignIn) router.replace('/sign-in');
    } else if (!onboarded) {
      if (!onOnboarding) router.replace('/onboarding');
    } else if (onSignIn || onOnboarding || onReset || onCallback) {
      router.replace('/');
    }
  }, [userId, onboarded, loading, recoveringPassword, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="browse" />
      <Stack.Screen name="shade" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wrapped" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="share-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
      <Stack.Screen name="menu" options={{ presentation: 'modal' }} />
      <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-product" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calendar" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="people" options={{ presentation: 'modal' }} />
      <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="post/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <FollowProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </FollowProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
