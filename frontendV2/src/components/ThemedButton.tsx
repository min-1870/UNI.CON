import { Pressable, Text, StyleSheet, type PressableProps } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

type ThemedButtonProps = PressableProps & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'chip';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  disabled?: boolean;
};

export default function ThemedButton({
  children,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  ...rest
}: ThemedButtonProps) {
  const { theme, isDark } = useTheme();

  const getButtonStyles = () => {
    const baseStyle = {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderRadius: theme.borderRadius.xl,
    };

    const sizeStyles = {
      sm: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        minHeight: 36,
      },
      md: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        minHeight: 44,
      },
      lg: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing['2xl'],
        minHeight: 52,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.computed.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      secondary: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      chip: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.card,
        borderRadius: theme.borderRadius.full,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        minHeight: 32,
      },
      tags: {  
        backgroundColor: '#F3F4F6',
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 15,
      marginRight: 10,
      textAlign: 'center',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.sm;
      case 'md':
        return theme.typography.fontSize.base;
      case 'lg':
        return theme.typography.fontSize.lg;
      default:
        return theme.typography.fontSize.base;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyles(),
        {
          opacity: (pressed || disabled) ? 0.7 : 1,
        },
        style,
      ] as any}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={{
          color: getTextColor(),
          fontSize: getTextSize(),
          fontWeight: theme.typography.fontWeight.medium as any,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}