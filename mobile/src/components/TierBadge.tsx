import { View } from 'react-native';
import { Text } from '@/components/Text';
import { tierColor, tierInk } from '@/core/ranking';
import { font } from '@/core/theme';
import type { Tier } from '@/core/types';

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 26 : 34;
  const fs = size === 'sm' ? font.size.sm : font.size.lg;
  // The ring uses the tier color; the letter uses its darker ink so it clears 4.5:1.
  return (
    <View
      accessible
      accessibilityLabel={`${tier} tier`}
      style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 2, borderColor: tierColor(tier), alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: tierInk(tier), fontWeight: '700', fontSize: fs }}>{tier}</Text>
    </View>
  );
}
