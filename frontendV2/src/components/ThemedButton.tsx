import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, StyleSheet, type ButtonProps } from 'react-native';
import { ReactNode } from 'react';

type ThemedButtonProps = Omit<ButtonProps, 'title'> & {
  lightColor?: string;
  darkColor?: string;
  type?: 'auth' | 'feedChecked' | 'feedUnchecked';
  children: ReactNode;
};

function ThemedButton({
  lightColor,
  darkColor,
  children,
  disabled = false,
  type ='auth',
  ...rest
}: ThemedButtonProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'ThemedButtonBackground');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'ThemedButtonText');
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'ThemedButtonBorder');

  const styles = StyleSheet.create({
    auth: {
      padding: 12,
      borderRadius: 7,
      width: '100%',
      backgroundColor: backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedChecked: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 50,
      backgroundColor: backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedUnchecked: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  return (
    <Pressable
      style={({ pressed }) => [
        type === 'auth' ? styles.auth : undefined,
        type === 'feedChecked' ? styles.feedChecked : undefined,
        type === 'feedUnchecked' ? styles.feedUnchecked : undefined,
        { 
          opacity: (pressed || disabled) ? 0.5 : 1,
        }
      ]}
      {...rest}
    >
        <Text style={{ color: textColor }}>{children}</Text>
    </Pressable>
  );
}
export { ThemedButton };