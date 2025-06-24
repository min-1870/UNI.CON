import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'surface' | 'card' | 'transparent';
};

export default function ThemedView({
  style,
  variant = 'background',
  ...rest
}: ThemedViewProps) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'background':
        return theme.colors.background;
      case 'surface':
        return theme.colors.surface;
      case 'card':
        return theme.colors.card;
      case 'transparent':
        return 'transparent';
      default:
        return theme.colors.background;
    }
  };

  return (
    <View 
      style={[
        { backgroundColor: getBackgroundColor() }, 
        style
      ]} 
      {...rest} 
    />
  );
}
