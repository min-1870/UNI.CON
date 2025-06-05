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

  const defaultBrandColor = useThemeColor({}, 'default_brand_color');
  const defaultTitleColor = useThemeColor({}, 'default_title_color');
  const defaultTextColor = useThemeColor({}, 'default_text_color');

  
  const errorColor = useThemeColor({}, 'default_error_color');
  const defaultColor = useThemeColor({}, 'default_text_color');
  const feed_unchecked_color = useThemeColor({}, 'default_placeholder_color');
  
  const styles = type === 'university' ?
    StyleSheet.create({
      text: {
        fontSize: 32,
        lineHeight: 32,
        color: defaultTitleColor,
        fontFamily: 'displayBold',
      }
    }) 
  : type === 'contentPlaceholder' ?
    StyleSheet.create({
      text: {
        fontSize: 20,
        color: feed_unchecked_color,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'contentTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 20,
        color: defaultTitleColor,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'contentSubTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 16,
        color: defaultTitleColor,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'feedChecked' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: defaultTextColor,
        fontFamily: 'textRegular',
      }
    })
  : type === 'feedUnchecked' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: feed_unchecked_color,
        fontFamily: 'textRegular',
      }
    })
  : type === 'articleAuthor' ?
    StyleSheet.create({
      text: {
        fontSize: 14,
        color: defaultTitleColor,
        fontFamily: 'textSemibold',
      }
    }) 
  : type === 'articleDate' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: feed_unchecked_color,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articlePoints' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: defaultBrandColor,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articleTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 18,
        color: defaultTitleColor,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'articleBody' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: defaultTextColor,
        textAlign: 'justify',
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'articleButton' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: feed_unchecked_color,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'notificationTitle' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: defaultTextColor,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'notificationTitleBold' ?
    StyleSheet.create({
      text: {
        fontSize: 12,
        color: defaultTextColor,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'notificationBody' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: feed_unchecked_color,
        fontFamily: 'textRegular',
      }
    }) 
  : type === 'notificationButton' ?
    StyleSheet.create({
      text: {
        fontSize: 10,
        color: feed_unchecked_color,
        fontFamily: 'textMedium',
      }
    }) 
  : type === 'summaryPoints' ?
    StyleSheet.create({
      text: {
        fontSize: 24,
        color: defaultBrandColor,
        fontFamily: 'displayBold',
      }
    })
  : type === 'link' ?
    StyleSheet.create({
      text: {
        lineHeight: 30,
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
        color: defaultColor,
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
