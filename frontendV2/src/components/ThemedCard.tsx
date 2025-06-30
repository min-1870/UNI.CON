import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  type?: 'default' | 'defaultViewed' | 'detail'; // Optional prop to specify the type of card
};

export default function ThemedCard({
  style,
  type = 'default',
  ...rest
}: ThemedViewProps) {
  const DEFAULT_CARD_BG = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_VIEWED_CARD_BG = useThemeColor({}, 'DEFAULT_VIEWED_CARD_BACKGROUND');

  return <View style={[{ 
      backgroundColor: type == 'defaultViewed' ? DEFAULT_CARD_BG : DEFAULT_CARD_BG,
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10,
      marginHorizontal: type == 'detail' ? 0 : 15,
      marginBottom: 20,
      padding: 16, 
      borderRadius: 20,
      borderTopLeftRadius: type == 'detail' ? 0 : 20,
      borderTopRightRadius: type == 'detail' ? 0 : 20,
    }, style]} {...rest} />;
}
