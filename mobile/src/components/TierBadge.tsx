import { Text, View } from 'react-native';
import { tierColor } from '@/core/ranking';
import type { Tier } from '@/core/types';

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const color = tierColor(tier);
  const dim = size === 'sm' ? 26 : 34;
  const fs = size === 'sm' ? 13 : 16;
  return (
    <View style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontWeight: '800', fontSize: fs }}>{tier}</Text>
    </View>
  );
}
