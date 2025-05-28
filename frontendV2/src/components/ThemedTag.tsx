import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, StyleSheet, View, type ButtonProps } from 'react-native';
import { ReactNode } from 'react';
import { useFonts } from 'expo-font';
type TagProps = {
    text: String;
    type: 'default'|'ranked'|'bigRanked'|'uni';
  };
  

export default function ThemedTag({
  text='',
  type ='default',
}: TagProps) {
  
    const [fontsLoaded] = useFonts({
      textRegular: require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    });
    const background_color = useThemeColor({}, 'default_tag_background_color');
    const textColor = useThemeColor({}, 'default_text_color');
    const rankedBackgroundColor = useThemeColor({}, 'rankedTagBackgroundColor');
    const rankedTextColor = useThemeColor({}, 'rankedTagTextColor');
    

  const styles = type === 'bigRanked' ?
    StyleSheet.create({
        tag: {
        backgroundColor: rankedBackgroundColor,
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 4,
        marginRight: 8,
        },
        Text: {
        fontSize: 14,
        color: rankedTextColor,
        fontFamily: 'textRegular',
        },
    })
    : type === 'ranked' ?
    StyleSheet.create({
        tag: {
        backgroundColor: rankedBackgroundColor,
        borderRadius: 16,
        paddingHorizontal: 9,
        paddingVertical: 4,
        marginRight: 8,
        },
        Text: {
        fontSize: 12,
        color: rankedTextColor,
        fontFamily: 'textRegular',
        },
    })
    : type === 'uni' ?
    StyleSheet.create({
        tag: {
        backgroundColor: background_color,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
        },
        Text: {
        fontSize: 14,
        color: textColor,
        },
    })
    : StyleSheet.create({ //default tag
        tag: {
        backgroundColor: background_color,
        borderRadius: 16,
        paddingHorizontal: 9,
        paddingVertical: 4,
        marginRight: 8,
        },
        Text: {
        fontSize: 12,
        color: textColor,
        fontFamily: 'textRegular',
        },
    });
  return (
    <View style={styles.tag}>
        <Text style={styles.Text}>{text}</Text>
    </View>
  );
}