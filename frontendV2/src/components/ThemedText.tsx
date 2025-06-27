import { Text, type TextProps, StyleSheet } from 'react-native';
import { useMemo } from 'react';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'error' | 'summaryPoints' | 'feedChecked' | 'feedUnchecked' | 'wording' | 'wordingMid';
};

export default function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const default_brand_color = useThemeColor({}, 'default_brand_color');
  const errorColor = useThemeColor({}, 'default_error_color');
  const defaultColor = useThemeColor({}, 'default_text_color');
  const feed_unchecked_color = useThemeColor({}, 'default_placeholder_color');
  const defaultTitleColor = useThemeColor({}, 'default_text_color');
  const styles = useMemo(() => StyleSheet.create({
    default: {
      fontSize: 16,
      lineHeight: 24,
    },
    error: {
      fontSize: 16,
      lineHeight: 24,
    },
    defaultSemiBold: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
    },

    title: {
      marginTop: 10,
      fontSize: 25,
      fontWeight: 'bold',
      lineHeight: 30,
      fontWeight: 'bold',
      color: defaultTitleColor,
    },

    subtitle: {
      fontSize: 30,
      fontWeight: '600',
    },
    link: {
      lineHeight: 30,
      fontSize: 16,
      color: '#0a7ea4',
    },
    summaryPoints: {
      fontSize: 30,
      fontWeight: '600',
    },
    feedChecked: {
      fontSize: 15,
      fontWeight: '500',
    },
    feedUnchecked: {
      fontSize: 15,
      fontWeight: '500',
    },
    wording: {
      fontSize: 50,
      fontWeight: '500',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      fontFamily: 'DMSerifDisplay-Regular'
    },
    wordingMid: {
      fontSize: 20,
      fontWeight: '300',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      fontFamily: 'DMSerifDisplay-Regular'
    }
  }), [colorScheme]);
  
  return (
    <Text
      style={[
        {
          color:
            type === 'default'
              ? defaultColor
              : type === 'error'
              ? errorColor
              : type === 'summaryPoints'
              ? default_brand_color
              : type === 'feedChecked'
              ? defaultColor
              : type === 'feedUnchecked'
              ? feed_unchecked_color
              : undefined,
        },
        type === 'default' ? styles.default : undefined,
        type === 'error' ? styles.error : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'summaryPoints' ? styles.summaryPoints : undefined,
        type === 'feedChecked' ? styles.feedChecked : undefined,
        type === 'feedUnchecked' ? styles.feedUnchecked : undefined,
        type === 'wording' ? styles.wording : undefined,
        type === 'wordingMid' ? styles.wordingMid : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
