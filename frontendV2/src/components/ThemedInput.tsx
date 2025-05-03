import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { ReactNode } from 'react';

type ThemedInputProps = TextInputProps & {
  type?: 'auth' | 'comment' | 'search';
};

export default function ThemedInput({
  type='auth',
  ...rest
}: ThemedInputProps) {
    const backgroundColor = useThemeColor({}, 'default_input_background_color');
    const placeholderColor = useThemeColor({}, 'default_placeholder_color');
    const textColor = useThemeColor({}, 'default_text_color');

    const styles = StyleSheet.create({
      auth: { //TODO fix the styles to match the design
        padding: 12,
        marginBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: backgroundColor,
        borderRadius: 5,
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
      search: { //TODO fix the styles to match the design
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
