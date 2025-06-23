import { useThemeColor } from '@/hooks/useThemeColor';
import { Platform, TextStyle, TextInput, StyleSheet, type TextInputProps } from 'react-native';

type ThemedInputProps = TextInputProps & {
  type?: 'auth' | 'comment' | 'search' ;
};

export default function ThemedInput({
  type='auth',
  ...rest
}: ThemedInputProps) {
    const backgroundColor = useThemeColor({}, 'default_input_background_color');
    const placeholderColor = useThemeColor({}, 'default_placeholder_color');
    const textColor = useThemeColor({}, 'default_text_color');
    const default_card_background_color = useThemeColor({}, 'default_card_background_color');

    const default_style = {
      ...(Platform.OS === 'web'
        ? ({ outlineStyle: 'none' } as TextStyle)
        : {}),
    };
    const styles = type === 'auth'
      ? StyleSheet.create({
          style: {
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
      : type === 'comment'
      ? StyleSheet.create({
          style: {
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
      : type === 'search'
      ? StyleSheet.create({
          style: {
            paddingHorizontal: 30,
            paddingVertical: 18,
            backgroundColor: default_card_background_color,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: textColor, 
            width: '100%',
            
            boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(10px)', // For web platforms
            elevation: 10, // For Android shadow
          },
        })
      : StyleSheet.create({
          style: {
          },
        });
      

  return (
    <TextInput
      style={[default_style, styles.style, rest.style]}
      {...rest}
      placeholderTextColor={placeholderColor}
    />
  );
}
