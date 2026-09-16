import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/core/theme';

function initials(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Avatar({
  name,
  src,
  tint,
  size = 44,
  style,
}: {
  name: string;
  src?: string | null;
  tint?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const r = size / 2;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r, overflow: 'hidden', backgroundColor: src ? palette.line : tint ?? palette.accent, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: palette.white, fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
      )}
    </View>
  );
}
