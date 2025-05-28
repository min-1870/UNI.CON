import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'contentPlaceholder' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'error' | 'summaryPoints' | 'feedChecked' | 'feedUnchecked' | 'Wording';
};

export default function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const default_brand_color = useThemeColor({}, 'default_brand_color');
  const errorColor = useThemeColor({}, 'default_error_color');
  const defaultColor = useThemeColor({}, 'default_text_color');
  const feed_unchecked_color = useThemeColor({}, 'default_placeholder_color');
  // const feed_unchecked_color = useThemeColor({}, 'default_text_color');
  
  const h1_font_size = 40;
  const h2_font_size = 30;
  const h3_font_size = 20;
  const context_font_size = 12;

  const styles = type === 'title' ?
    StyleSheet.create({
      text:{
        fontSize: h1_font_size,
        fontWeight: 'bold',
        lineHeight: 32,
        color: defaultColor
      }
    })
  : type === 'subtitle' ?
    StyleSheet.create({
      text: {
        fontSize: h2_font_size,
        fontWeight: '600',
        color: defaultColor
      }
    }) 
  : type === 'contentPlaceholder' ?
    StyleSheet.create({
      text: {
        fontSize: h3_font_size,
        fontWeight: '600',
        color: feed_unchecked_color
      }
    }) 
  :  type === 'defaultSemiBold' ?
    StyleSheet.create({
      text: {
        fontSize: context_font_size,
        lineHeight: 24,
        fontWeight: '600',
        color: defaultColor
      }
    })
  : type === 'link' ?
    StyleSheet.create({
      text: {
        lineHeight: 30,
        fontSize: context_font_size,
        color: '#0a7ea4',
      }
    })
  : type === 'summaryPoints' ?
    StyleSheet.create({
      text: {
        fontSize: 30,
        fontWeight: '600',
        color: default_brand_color
      }
    })
  : type === 'feedChecked' ?
    StyleSheet.create({
      text: {
        fontSize: context_font_size,
        fontWeight: '500',
        color: defaultColor
      }
    })
  : type === 'feedUnchecked' ?
    StyleSheet.create({
      text: {
        fontSize: context_font_size,
        fontWeight: '500',
        color: feed_unchecked_color
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
        fontSize: context_font_size,
        color: defaultColor,
      }
  });


  return (
    <Text
      style={styles.text}
      {...rest}
    />
  );
}
