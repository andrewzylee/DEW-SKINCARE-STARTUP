import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { Text, TextInput } from '@/components/Text';
import { useProfile } from '@/data/profile-store';
import { font, palette, space } from '@/core/theme';

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState(profile?.display_name ?? 'You');
  const [handle, setHandle] = useState(profile?.handle ?? 'you');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');

  const save = () => {
    updateProfile({
      display_name: name.trim() || 'You',
      handle: handle.trim().replace(/[^a-z0-9_.]/gi, '').toLowerCase() || 'you',
      bio,
      location,
    });
    router.back();
  };

  const fieldStyle = { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: font.size.base, color: palette.ink } as const;
  const labelStyle = { fontSize: font.size.xs, fontWeight: '600' as const, color: palette.muted, marginBottom: 6, marginTop: space(3) };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel"><X size={24} color={palette.muted} /></Pressable>
        <Text accessibilityRole="header" style={{ fontSize: font.size.lg, fontWeight: '600', color: palette.ink }}>Edit profile</Text>
        <Pressable onPress={save} hitSlop={12} accessibilityRole="button"><Text style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.accent }}>Save</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(6) }} keyboardShouldPersistTaps="handled">
        <Text style={labelStyle}>Name</Text>
        <TextInput value={name} onChangeText={setName} maxLength={40} accessibilityLabel="Name" style={fieldStyle} placeholderTextColor={palette.muted} />

        <Text style={labelStyle}>Username</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: font.size.base, color: palette.muted }}>@</Text>
          <TextInput value={handle} onChangeText={setHandle} maxLength={24} autoCapitalize="none" accessibilityLabel="Username" style={{ flex: 1, paddingVertical: 12, fontSize: font.size.base, color: palette.ink }} />
        </View>

        <Text style={labelStyle}>Bio</Text>
        <TextInput value={bio} onChangeText={setBio} maxLength={80} accessibilityLabel="Bio" placeholder="e.g. oily skin, chasing clear" placeholderTextColor={palette.muted} style={fieldStyle} />

        <Text style={labelStyle}>Location</Text>
        <TextInput value={location} onChangeText={setLocation} maxLength={40} accessibilityLabel="Location" placeholder="City" placeholderTextColor={palette.muted} style={fieldStyle} />
      </ScrollView>
    </View>
  );
}
