import { StyleSheet, Image, Platform, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';

import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';

export default function Notification() {

  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#ffffff' }, 'articleBackground');
  const placeHolderColor = useThemeColor({ light: '#ffffff', dark: '#ffffff' }, 'postPlaceHolder');
  console.log(placeHolderColor)
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    cardContainer:{
      backgroundColor,
      borderRadius: 30,
      padding: 30, 
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 3 },
      
      shadowRadius: 13,
      shadowOpacity: 0.08,
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow

    },
    textAreasContainer:{
  
    },
    uniconContainer:{
      display: 'flex',
      flexDirection: 'row',
      backgroundColor,
    },
    tagAreaContainer:{
  
    },
    titleTextArea: {
      backgroundColor,
      borderWidth: 0,         
      borderRadius: 4,
      padding: 8,
      fontSize: 26,
      height: 60,
      
    },
    bodyTextArea: {
      flex: 1,
      backgroundColor,
      borderWidth: 0,
      borderRadius: 4,
      padding: 8,
      fontSize: 21,
    },
  });

  const [text, setText] = useState('');
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.cardContainer}>
        <ThemedView style={styles.textAreasContainer}>
          <TextInput
            style={styles.titleTextArea}
            multiline                    // ← enable multiple lines
            numberOfLines={6}            // ← initial height (Android only)
            placeholder="Title"
            placeholderTextColor={placeHolderColor}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"      // ← keep cursor at top on Android
            scrollEnabled                // ← allow scrolling when text overflows
          />
          <TextInput
            style={styles.bodyTextArea}
            multiline                    // ← enable multiple lines
            numberOfLines={6}            // ← initial height (Android only)
            placeholder="Body Text"
            placeholderTextColor={placeHolderColor}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"      // ← keep cursor at top on Android
            scrollEnabled                // ← allow scrolling when text overflows
          />
        </ThemedView>
        
        <ThemedView style={styles.textAreasContainer}>
        <ThemedView style={styles.uniconContainer}>
          <ThemedText>
            By turning on the unicon option your post will be visible to other supported university students
          </ThemedText>
          <ThemedButton
            type={'feedChecked'}
            onPress={() => {}}
          >
            UNI.CON
          </ThemedButton>
        </ThemedView>
        </ThemedView>
      </ThemedView>
        
      <ThemedView style={styles.tagAreaContainer}>

      </ThemedView>
    </ThemedView>
  );
}

