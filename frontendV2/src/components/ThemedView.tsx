import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
};

export default function ThemedView({
  style,
  ...rest
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({}, 'DEFAULT_BACKGROUND');

  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
