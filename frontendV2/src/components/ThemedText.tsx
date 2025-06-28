import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useFonts } from 'expo-font';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'university'
    | 'contentTitle'
    | 'contentSubTitle'
    | 'contentPlaceholder'
    | 'articleTitle'
    | 'articleBody'
    | 'articleAuthor'
    | 'articlePoints'
    | 'articleDate'
    | 'articleButton'
    | 'notificationTitle'
    | 'notificationTitleBold'
    | 'notificationBody'
    | 'notificationButton'
    | 'link'
    | 'error'
    | 'summaryPoints'
    | 'feedChecked'
    | 'feedUnchecked'
    | 'Wording';
};

export default function ThemedText({
  style,
  type = 'default',
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

  const DEFAULT_UNICON_COLOR = useThemeColor({}, 'UNICON_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  
  const styles = type === 'university' ?
    StyleSheet.create({
      text: {
        fontSize: 32,
        lineHeight: 32,
        color: DEFAULT_TEXT,
        fontFamily: 'displayBold',
      }
    }) 
  : type === 'contentPlaceholder' ?
    StyleSheet.create({
      text: {
        fontSize: 20,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'contentTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 20,
        color: DEFAULT_TEXT,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'contentSubTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 16,
        color: DEFAULT_TEXT,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'feedChecked' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: ALWAYS_BLACK,
        fontFamily: 'textRegular',
      }
    })
  : type === 'feedUnchecked' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textRegular',
      }
    })
  : type === 'articleAuthor' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: DEFAULT_TEXT,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'articleDate' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articlePoints' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: DEFAULT_UNICON_COLOR,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articleTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 18,
        color: DEFAULT_TEXT,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'articleBody' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: DEFAULT_TEXT,
        textAlign: 'justify',
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articleButton' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'notificationTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: DEFAULT_TEXT,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'notificationTitleBold' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: DEFAULT_TEXT,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'notificationBody' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'notificationButton' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: DEFAULT_GRAY_TEXT,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'summaryPoints' ?
    StyleSheet.create({
      text: {
        fontSize: 30,
        color: DEFAULT_UNICON_COLOR,
        fontFamily: 'displayBold',
      }
    })
  : type === 'link' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: '#0a7ea4',
      }
    })
  : type === 'Wording' ?
      StyleSheet.create({
        text: {
          fontSize: 50,
          fontWeight: '500',
          color: 'rgb(8, 8, 8)',
          fontFamily: 'DMSerifDisplay-Regular'
        }
      })
  : StyleSheet.create({
      text: {
        fontSize: 12,
        color: DEFAULT_TEXT,
        fontFamily: 'textRegular',
      }
  });


  return (
    <Text
      style={[styles.text, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
