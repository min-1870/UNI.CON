import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  viewed?: boolean; // Optional prop to indicate if the card has been viewed
};

export default function ThemedCard({
  style,
  viewed = false, 
  ...rest
}: ThemedViewProps) {
  const DEFAULT_CARD_BG = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_VIEWED_CARD_BG = useThemeColor({}, 'DEFAULT_VIEWED_CARD_BACKGROUND');

  return <View style={[{ 
      backgroundColor: viewed ? DEFAULT_VIEWED_CARD_BG : DEFAULT_CARD_BG,
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10,
    }, style]} {...rest} />;
}
