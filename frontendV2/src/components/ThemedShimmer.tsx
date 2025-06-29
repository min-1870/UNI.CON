import { useThemeColor } from '@/hooks/useThemeColor';
import {  StyleSheet, View } from 'react-native';

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedCard from '@/components/ThemedCard';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

type ShimmerProps = {
  type?:
    | 'article';
  idx?: string | number;
};

export default function ThemedShimmer({
  type = 'article',
  idx,
  ...rest
}: ShimmerProps) {
    const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
    const DEFAULT_VIEWED_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_VIEWED_CARD_BACKGROUND');
    const UNICON_BACKGROUND = useThemeColor({}, 'UNICON_BACKGROUND');

  // Generate a random height between 150 and 300
  const randomHeight = Math.floor(Math.random() * (300 - 150 + 1)) + 150;

  const styles = type === 'article'
    ? StyleSheet.create({
        view: {
          height: randomHeight,
          borderRadius: 20,
          marginHorizontal: 15,
          marginBottom: 20,
          alignSelf: 'stretch',
        },
        shimmer: { height: randomHeight, width: '100%' },
      })
    : StyleSheet.create({
        view: {
          height: randomHeight,
          borderRadius: 20,
          marginHorizontal: 15,
          alignSelf: 'stretch',
        },
        shimmer: { height: randomHeight, width: '100%' },
      });
  return (
    <ThemedCard
      key={idx}
      style={styles.view}
    >
      <ShimmerPlaceHolder
        style={styles.shimmer}
        shimmerStyle={{ borderRadius: 20, width: '100%' }}
        shimmerColors={[DEFAULT_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_CARD_BACKGROUND ]}
        visible={false}
      />
    </ThemedCard>
  );
}