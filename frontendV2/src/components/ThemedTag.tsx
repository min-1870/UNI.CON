import { StyleSheet, View, Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { InitialDataType } from '@/constants/types';
import ThemedText from '@/components/ThemedText';
import { router } from 'expo-router';
import React from "react";
type TagProps = {
    text: string;
    type: 'default'| 'selectedDefault'|'ranked'|'selectedRanked'|'bigRanked'|'uni';
    unClickable?: boolean;
    initialData?: InitialDataType|null;
  };
export default function ThemedTag({
  text='',
  type ='default',
  unClickable = false,
  initialData,
}: TagProps) {

  const DEFAULT_TAG_BG = useThemeColor({}, 'DEFAULT_TAG_BACKGROUND');
  const DEFAULT_TEXT_COLOR = useThemeColor({}, 'DEFAULT_TEXT');
  const RANKED_TAG_BG = useThemeColor({}, 'RANKED_TAG_BACKGROUND');
  const RANKED_TAG_TEXT = useThemeColor({}, 'RANKED_TAG_TEXT');

  const styles = StyleSheet.create({
    tag: {
    backgroundColor: type === 'ranked' || type === 'bigRanked' || type === 'selectedRanked'
      ? RANKED_TAG_BG 
      : type === 'uni'
      ? initialData?.university_colors[text.toLowerCase()] || DEFAULT_TAG_BG
      : DEFAULT_TAG_BG,
    
    boxShadow: type === 'uni' 
      ? `0px 0px 9px ${initialData?.university_colors[text.toLowerCase()] || DEFAULT_TAG_BG}`
      : 'none',
    backdropFilter: type === 'uni' ? 'blur(9px)' : 'none', // For web platforms
    elevation: type === 'uni' ? 9 : 0, // For Android shadow

    borderWidth: type === 'selectedRanked' || type === 'selectedDefault' 
      ? 1.5 : 0,

    borderColor: type === 'selectedRanked' || type === 'selectedDefault'
      ? RANKED_TAG_TEXT : DEFAULT_TEXT_COLOR,

    borderRadius: type === 'bigRanked' ? 16 : 10,
    paddingHorizontal: type === 'bigRanked' ? 13 : 9,
    paddingVertical: type === 'bigRanked' ? 4 : 3,
    marginRight: type === 'bigRanked' ? 8 : 4,
    
    }
  });

  const textSize = type === 'bigRanked' 
      ? 'default' : type === 'uni' ? 'tiny' : 'smaller';

  const textColor = type === 'uni' 
      ? 'white' 
      : type === 'ranked' || type === 'selectedRanked' || type === 'bigRanked'
      ? 'brand'
      : 'default';

  return (
    <>
      { !unClickable ? (
        <Pressable onPress={() => {
          router.push({
            pathname: '/(tabs)/search',
            params: { tag: String(text) }, 
          });
        }}>
          <View style={styles.tag}>
            <ThemedText size={textSize} color={textColor}>{text}</ThemedText>
          </View>
        </Pressable>
      ) : (
        <View style={styles.tag}>
          <ThemedText size={textSize} color={textColor}>{text}</ThemedText>
        </View>
      )}
    </>
  );
}