import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { ReactNode } from 'react';

type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'auth' | 'comment' | 'search';
};

function ThemedInput({
  lightColor,
  darkColor,
  type='auth',
  ...rest
}: ThemedInputProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputBackground');
    const placeholderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputPlaceholder');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputText');

    const styles = StyleSheet.create({
      auth: {
        padding: 12,
        backgroundColor: backgroundColor,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        color: textColor, 
        width: '100%',
      },
      comment: {
        padding: 12,
        paddingHorizontal: 20,
        backgroundColor: backgroundColor,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        color: textColor, 
        width: '100%',
      },
    })

  return (
    <TextInput
      style={[
        type === 'auth' ? styles.auth : undefined,
        type === 'comment' ? styles.comment : undefined,
      ]}
      {...rest}
      placeholderTextColor={placeholderColor}
    />
  );
}

export { ThemedInput };