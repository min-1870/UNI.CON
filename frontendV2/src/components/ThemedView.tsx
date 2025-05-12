import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
};

export default function ThemedView({
  style,
  ...rest
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({}, 'default_background_color');

  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
