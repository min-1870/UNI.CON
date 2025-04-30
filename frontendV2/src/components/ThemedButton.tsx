import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, StyleSheet, type ButtonProps } from 'react-native';
import { ReactNode } from 'react';

type ThemedButtonProps = Omit<ButtonProps, 'title'> & {
  type?: 'auth' | 'feedChecked' | 'feedUnchecked';
  children: ReactNode;
};

export default function ThemedButton({
  children,
  disabled = false,
  type ='auth',
  ...rest
}: ThemedButtonProps) {
    const background_color = useThemeColor({}, 'default_brand_color');
    const textColor = useThemeColor({}, 'default_text_color');
    const borderColor = useThemeColor({}, 'default_placeholder_color');

  const styles = StyleSheet.create({
    auth: { //TODO fix the styles to match the design
      padding: 12,
      borderRadius: 7,
      width: '100%',
      backgroundColor: background_color,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feed_checked: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 50,
      backgroundColor: background_color,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feed_unchecked: {
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
        type === 'feedChecked' ? styles.feed_checked : undefined,
        type === 'feedUnchecked' ? styles.feed_unchecked : undefined,
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