import { useThemeColor } from '@/hooks/useThemeColor';
import { Platform, TextStyle, TextInput, StyleSheet, type TextInputProps } from 'react-native';

type ThemedInputProps = TextInputProps & {
  type?: 'auth' | 'comment' | 'search' ;
};

export default function ThemedInput({
  type='auth',
  ...rest
}: ThemedInputProps) {
    const DEFAULT_GRAY_BACKGROUND = useThemeColor({}, 'DEFAULT_GRAY_BACKGROUND');
    const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
    const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
    const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');

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
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
          },
        })
      : type === 'comment'
      ? StyleSheet.create({
          style: {
            padding: 12,
            paddingHorizontal: 20,
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
          },
        })
      : type === 'search'
      ? StyleSheet.create({
          style: {
            paddingHorizontal: 30,
            paddingVertical: 18,
            backgroundColor: DEFAULT_CARD_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
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
      placeholderTextColor={DEFAULT_GRAY_TEXT}
    />
  );
}
