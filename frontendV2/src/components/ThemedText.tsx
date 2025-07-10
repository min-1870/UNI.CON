import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useFonts } from 'expo-font';

export type ThemedTextProps = TextProps & {
  font?:
    | 'textRegular'
    | 'textMedium'
    | 'textSemibold'
    | 'textBold'
    | 'displayBold',
  size?:
    | 'tiny'
    | 'smaller'
    | 'default'
    | 'bigger'
    | 'h2'
    | 'h1'
    | 'h3',
  color?:
    | 'default'
    | 'brand'
    | 'gray'
    | 'black'
    | 'white',
  justify?: boolean,
  underline?: boolean,
};

export default function ThemedText({
  style,
  size = 'default',
  font = 'textRegular',
  color = 'default',
  justify = false,
  underline = false,
  children,
  ...rest
}: ThemedTextProps) {

  
  const [fontsLoaded] = useFonts({
    textRegular: require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    textMedium: require('../assets/fonts/SF-Pro-Text-Medium.otf'),
    textSemibold: require('../assets/fonts/SF-Pro-Text-Semibold.otf'),
    textBold: require('../assets/fonts/SF-Pro-Text-Bold.otf'),
    displayBold: require('../assets/fonts/SF-Pro-Display-Bold.otf'),
  });

  const FONTS = {
    textRegular: 'textRegular',
    textMedium: 'textMedium',
    textSemibold: 'textSemibold',
    textBold: 'textBold',
    displayBold: 'displayBold',
  };

  const SIZES = {
    tiny: 10,
    smaller: 12,
    default: 14,
    bigger: 16,
    h1: 32,
    h2: 24,
    h3: 20,
  };

  const COLORS = {
    default: useThemeColor({}, 'DEFAULT_TEXT'),
    brand: useThemeColor({}, 'UNICON_CONTENT'),
    gray: useThemeColor({}, 'DEFAULT_GRAY_TEXT'),
    black: useThemeColor({}, 'ALWAYS_BLACK'),
    white: useThemeColor({}, 'ALWAYS_WHITE'), 
  };

  const styles = StyleSheet.create({
    text: { 
      fontSize: SIZES[size] || SIZES.default,
      color: COLORS[color] || COLORS.default,
      fontFamily: fontsLoaded ? FONTS[font] : 'textRegular',
      textAlign: justify ? 'justify' : 'left',
      textDecorationLine: underline ? 'underline' : 'none',
      textDecorationColor: COLORS[color] || COLORS.default,
    }
  })  
  


  return (
    <Text
      style={[styles.text, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
