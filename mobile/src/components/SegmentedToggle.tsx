import { Pressable, Text, View } from 'react-native';
import { palette } from '@/core/theme';

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, padding: 4 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center', backgroundColor: on ? palette.surface : 'transparent' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: on ? palette.ink : palette.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
