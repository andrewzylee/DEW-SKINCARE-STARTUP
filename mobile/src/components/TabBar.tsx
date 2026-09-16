import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, useRouter } from 'expo-router';
import { BarChart3, Compass, Newspaper, Plus, User } from 'lucide-react-native';
import { palette } from '@/core/theme';

// Derive the exact tabBar props from expo-router's Tabs (avoids the standalone @react-navigation
// type, which is a different, conflicting copy).
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS = { index: Newspaper, discover: Compass, shelf: BarChart3, profile: User } as const;
const LABELS = { index: 'Feed', discover: 'Discover', shelf: 'Shelf', profile: 'Profile' } as const;
type TabName = keyof typeof ICONS;

// Custom bar so the center ＋ is an elevated action (opens the Add sheet), not a tab — matching
// the web reference IA: Feed · Discover · ＋ · Shelf · Profile.
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeName = state.routes[state.index]?.name;

  const go = (name: TabName) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) navigation.navigate(route.name);
  };

  const Tab = ({ name }: { name: TabName }) => {
    const Icon = ICONS[name];
    const focused = activeName === name;
    const color = focused ? palette.accent : palette.muted;
    return (
      <Pressable onPress={() => go(name)} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
        <Text style={{ marginTop: 3, fontSize: 11, color, fontWeight: focused ? '600' : '500' }}>{LABELS[name]}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderTopColor: palette.line,
        paddingTop: 4,
        paddingBottom: insets.bottom || 8,
      }}
    >
      <Tab name="index" />
      <Tab name="discover" />
      <Pressable onPress={() => router.push('/add')} style={{ flex: 1, alignItems: 'center' }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -18,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Plus size={26} color={palette.white} strokeWidth={2.5} />
        </View>
      </Pressable>
      <Tab name="shelf" />
      <Tab name="profile" />
    </View>
  );
}
