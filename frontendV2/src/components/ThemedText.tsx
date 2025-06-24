import { Text, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type ThemedTextProps = TextProps & {
  variant?: 'default' | 'title' | 'subtitle' | 'caption' | 'error' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'error' | 'success' | 'warning';
};

export default function ThemedText({
  style,
  variant = 'default',
  size = 'base',
  weight = 'normal',
  color = 'text',
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();

  const getTextColor = () => {
    switch (color) {
      case 'text':
        return theme.colors.text;
      case 'textSecondary':
        return theme.colors.textSecondary;
      case 'textMuted':
        return theme.colors.textMuted;
      case 'primary':
        return theme.colors.primary;
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
         case 'title':
        return {
          fontSize: theme.typography.fontSize['4xl'],
          fontWeight: theme.typography.fontWeight.bold,
          lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
        };
      case 'title':
        return {
          fontSize: theme.typography.fontSize['4xl'],
          fontWeight: theme.typography.fontWeight.bold,
          lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
        };
      case 'subtitle':
        return {
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.semibold,
          lineHeight: theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
        };
      case 'caption':
        return {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
        };
      case 'error':
        return {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.error,
        };
      case 'success':
        return {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.success,
        };
      case 'warning':
        return {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.warning,
        };
      default:
        return {
          fontSize: theme.typography.fontSize[size],
          fontWeight: theme.typography.fontWeight[weight],
          lineHeight: theme.typography.fontSize[size] * theme.typography.lineHeight.normal,
        };
    }
  };

  return (
    <Text
      style={[
        {
          color: variant === 'error' || variant === 'success' || variant === 'warning' 
            ? undefined 
            : getTextColor(),
        },
        getVariantStyles(),
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 30,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  summaryPoints: {
    fontSize: 30,
    fontWeight: '600',
  },
  feedChecked: {
    fontSize: 15,
    fontWeight: '500',
    
  },
  feedUnchecked: {
    fontSize: 15,
    fontWeight: '500',
  },
  Wording :{
    fontSize: 50,
    fontWeight: '500',
    color:'rgb(8, 8, 8)',
    fontFamily: 'DMSerifDisplay-Regular'
  }
  // Add more styles as needed
});
