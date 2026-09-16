import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/core/auth';
import { ProfileProvider, useProfile } from '@/data/profile-store';
import { palette } from '@/core/theme';

SplashScreen.preventAutoHideAsync();

// Signed-out → /sign-in; signed-in → the tabs. Standard expo-router auth guard.
function RootNavigator() {
  const { userId, loading: authLoading } = useAuth();
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
    if (!userId) {
      if (!onSignIn) router.replace('/sign-in');
    } else if (!onboarded) {
      if (!onOnboarding) router.replace('/onboarding');
    } else if (onSignIn || onOnboarding) {
      router.replace('/');
    }
  }, [userId, onboarded, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
