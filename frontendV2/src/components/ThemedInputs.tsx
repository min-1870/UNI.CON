import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, TextInput, type TextInputProps } from 'react-native';
import { ReactNode } from 'react';

type AuthTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

function AuthTextInput({
  lightColor,
  darkColor,
  ...rest
}: AuthTextInputProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputBackground');
    const placeholderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputPlaceholder');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'authTextInputText');

  return (
    <TextInput
      style={{
        padding: 12,
        backgroundColor: backgroundColor,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        color: textColor, // This sets the input text color
        width: '100%',
      }}
      placeholderTextColor={placeholderColor} // This sets the placeholder text color
      {...rest}
    />
  );
}

export { AuthTextInput };