import { useThemeColor } from '@/hooks/useThemeColor';
import {  StyleSheet, View } from 'react-native';

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedCard from '@/components/ThemedCard';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

type ShimmerProps = {
  type?:
    | 'article'
    | 'comment';
  idx?: string | number;
};

export default function ThemedShimmer({
  type = 'article',
  idx,
  ...rest
}: ShimmerProps) {
    const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
    const DEFAULT_VIEWED_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_VIEWED_CARD_BACKGROUND');
    const DEFAULT_BACKGROUND = useThemeColor({}, 'DEFAULT_BACKGROUND');

  // Generate a random height between 150 and 300
  const titleHeight = 30;
  const titleWidthPercent = Math.floor(Math.random() * (100 - 50 + 1)) + 50; // Random width between 50% and 100%
  const gapHeight = 20;
  const bodyHeight = Math.floor(Math.random() * (300 - 50 + 1)) + 30;
  const cardHeight = titleHeight + bodyHeight + 32 + gapHeight;

  if (type === 'article') {

    const styles = StyleSheet.create({
      card: { 
        height: cardHeight,
        gap: gapHeight,
      },
      title: {height: titleHeight, width: `${titleWidthPercent}%` },
      body: { height: bodyHeight, width: '100%' },
    });

    return (
      <ThemedCard
        key={idx}
        style={styles.card}
      >
        <ShimmerPlaceHolder
          style={styles.title}
          shimmerStyle={{ borderRadius: 20, width: '100%' }}
          shimmerColors={[DEFAULT_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_CARD_BACKGROUND ]}
          visible={false}
        />
        <ShimmerPlaceHolder
          style={styles.body}
          shimmerStyle={{ borderRadius: 20, width: '100%' }}
          shimmerColors={[DEFAULT_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_CARD_BACKGROUND ]}
          visible={false}
        />
      </ThemedCard>
    );
  } else if (type === 'comment') {

    const styles = StyleSheet.create({
      body: {
        height: 60,
        width: '100%',
        backgroundColor: DEFAULT_CARD_BACKGROUND
      },
    });
    return (
      <ShimmerPlaceHolder
        style={styles.body}
        shimmerStyle={{ borderRadius: 15, width: '100%' }}
        shimmerColors={[DEFAULT_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_VIEWED_CARD_BACKGROUND, DEFAULT_CARD_BACKGROUND ]}
        visible={false}
      />
    );  
  }
  return ;
}