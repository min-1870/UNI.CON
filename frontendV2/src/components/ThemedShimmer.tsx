import { useThemeColor } from '@/hooks/useThemeColor';
import {  StyleSheet, View } from 'react-native';

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

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
    const UNICON_BACKGROUND = useThemeColor({}, 'UNICON_BACKGROUND');

  const styles = type === 'article'
    ? StyleSheet.create({
        view: {
          height: 150,
          borderRadius: 20,
          marginHorizontal: 15,
          alignSelf: 'stretch',
        },
        shimmer: { height: 150, width: '100%' },
      })
    : StyleSheet.create({
        view: {
          height: 150,
          borderRadius: 20,
          marginHorizontal: 15,
          alignSelf: 'stretch',
        },
        shimmer: { height: 150, width: '100%' },
      });
  return (
    <View
      key={idx}
      style={styles.view}
    >
      <ShimmerPlaceHolder
        style={styles.shimmer}
        shimmerStyle={{ borderRadius: 20, width: '100%' }}
        shimmerColors={[DEFAULT_CARD_BACKGROUND, UNICON_BACKGROUND, DEFAULT_CARD_BACKGROUND ]}
        visible={false}
      />
    </View>
  );
}