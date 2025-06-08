import { useThemeColor } from '@/hooks/useThemeColor';
import { Text, StyleSheet, View } from 'react-native';
import { InitialDataType } from '@/constants/types';
import { useFonts } from 'expo-font';
import React from "react";

type TagProps = {
    text: string;
    type: 'default'|'ranked'|'bigRanked'|'uni';
    initialData?: InitialDataType|null;
  };
export default function ThemedTag({
  text='',
  type ='default',
  initialData,
}: TagProps) {
  
  const [fontsLoaded] = useFonts({
    textRegular: require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    textBold: require('../assets/fonts/SF-Pro-Text-Bold.otf'),
  });
  const background_color = useThemeColor({}, 'default_tag_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const rankedBackgroundColor = useThemeColor({}, 'rankedTagBackgroundColor');
  const rankedTextColor = useThemeColor({}, 'rankedTagTextColor');
  const uniTextColor = useThemeColor({}, 'uniTagTextColor');

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
        backgroundColor: initialData?.university_colors[text.toLowerCase()] ? initialData?.university_colors[text.toLowerCase()] : background_color,
        borderRadius: 16,
        paddingHorizontal: 5,
        paddingVertical: 3,

        shadowColor: initialData?.university_colors[text.toLowerCase()] ? initialData?.university_colors[text.toLowerCase()] : background_color,
        shadowRadius: 20,
        shadowOpacity: 1,
        backdropFilter: 'blur(10px)', // For web platforms
        elevation: 10, // For Android shadow
        },
        Text: {
        fontSize: 8,
        color: uniTextColor,
        fontFamily: 'textBold',
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