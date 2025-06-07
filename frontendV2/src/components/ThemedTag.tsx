import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, StyleSheet, View, type ButtonProps } from 'react-native';
import React, { useState, useEffect, useRef  } from "react";
import { ReactNode } from 'react';
import {fetchAPI, getData, setData} from "@/components/Utils";
import { useFonts } from 'expo-font';
type TagProps = {
    text: string;
    type: 'default'|'ranked'|'bigRanked'|'uni';
  };
  

export default function ThemedTag({
  text='',
  type ='default',
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
    const [uniColor, setUniColor] = useState<string | null>(null);

    
  useEffect(() => {
    const fetchColor = async () => {
      const ColorsRaw = await getData('university_colors');
      let Colors;
      try {
        Colors = ColorsRaw ? JSON.parse(ColorsRaw) : null;
      } catch (e) {
        Colors = null;
      }
      setUniColor(Colors[text.toLowerCase()])
    };
    fetchColor();
  }, []);
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
        backgroundColor: uniColor ? uniColor : background_color,
        borderRadius: 16,
        paddingHorizontal: 5,
        paddingVertical: 3,

        shadowColor: uniColor ? uniColor : background_color,
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