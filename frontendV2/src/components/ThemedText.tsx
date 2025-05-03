import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'error' | 'summaryPoints';
};

export default function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const default_brand_color = useThemeColor({}, 'default_brand_color');
  const errorColor = useThemeColor({}, 'default_error_color');
  const defaultColor = useThemeColor({}, 'default_text_color');
  
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
              : undefined,
        },
        type === 'default' ? styles.default : undefined,
        type === 'error' ? styles.error : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'summaryPoints' ? styles.summaryPoints : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
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
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
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
});
