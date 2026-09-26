import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { TAB_LIST_ROLE } from '@/core/a11y';
import { font, palette } from '@/core/theme';

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
    <View accessibilityRole={TAB_LIST_ROLE} style={{ flexDirection: 'row', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, padding: 4 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={{ flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center', backgroundColor: on ? palette.surface : 'transparent' }}
          >
            <Text style={{ fontSize: font.size.base, fontWeight: '600', color: on ? palette.ink : palette.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
