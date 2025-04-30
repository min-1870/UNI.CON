import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ThemedButton from '@/components/ThemedButton';
import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import type { TabParamList } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import {API_URL} from "@/constants/Domains";

export default function NewArticlePage() {
  
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [tags,  setTags]  = useState('');
  const [loading, setLoading] = useState(false);


  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const place_holder_color = useThemeColor({}, 'default_placeholder_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  
  const handlePost = async () => { //TODO fix this function to post the article
    // setLoading(true);
    // const resp = await fetchAPI(`${API_URL}/community/article/`, {
    //   method: 'POST',
    //   token: true,
    //   body: { title, body },
    // });
    // setLoading(false);

    // if (!resp.error) {
    //   navigation.goBack();
    // } else {
    //   alert(resp.data.detail || 'Failed to post');
    // }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
      backgroundColor: default_card_background_color, // navbar background
      shadowColor: 'transparent', // remove iOS bottom border
      elevation: 0, // remove Android shadow
      borderWidth: 0, 
      },
      headerTintColor: default_text_color,
      headerLeft: () => (
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={default_text_color}
          onPress={() => navigation.navigate('home')}
          style={{ marginLeft: 20 }}
        />
      ),
      headerRight: () => (
        <ThemedText
          type={'default'} 
          onPress={handlePost} 
          disabled={loading}
          style={{ marginRight: 30 }}
        >
          Post
        </ThemedText>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, handlePost, loading]);


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
    },
    cardContainer:{
      flex: 2,
      display: 'flex',
      color: default_card_background_color,
      borderRadius: 30,
      padding: 20, 
      marginBottom: 20,

      
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 3 },
      
      shadowRadius: 13,
      shadowOpacity: 0.08,
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow

    },
    textAreasContainer:{
      display: 'flex',
      flex: 1,
    },
    uniconContainer:{
      display: 'flex',
      flexDirection: 'row',
    },
    titleTextArea: {
      borderWidth: 0,         
      borderRadius: 4,
      padding: 8,
      fontSize: 20,
      color: default_text_color,
    },
    bodyTextArea: {
      flex: 1,
      borderWidth: 0,
      borderRadius: 4,
      padding: 8,
      fontSize: 16,
      marginBottom: 20,
      color: default_text_color,
    },
    tagAreaContainer:{
      padding: 20,
      display: 'flex',
      flex: 1,
    },
    tagTextArea: {
      flex: 1,
      borderWidth: 0,
      borderRadius: 4,
      fontSize: 16,
      color: default_text_color,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.cardContainer}>
        <ThemedView style={styles.textAreasContainer}>
          <TextInput
            style={styles.titleTextArea}
            numberOfLines={6}            //initial height (Android only)
            placeholder="Title"
            placeholderTextColor={place_holder_color}
            value={title}
            onChangeText={setTitle}
            textAlignVertical="top"      //keep cursor at top on Android
            scrollEnabled                //allow scrolling when text overflows
          />
          <TextInput
            style={styles.bodyTextArea}
            multiline
            numberOfLines={6}            //initial height (Android only)
            placeholder="Body Text"
            placeholderTextColor={'#a8a4a4'}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"      //keep cursor at top on Android
            scrollEnabled                //allow scrolling when text overflows
          />
        </ThemedView>

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
        
      <ThemedView style={styles.tagAreaContainer}>
        <ThemedText type={'subtitle'}>Add Tags</ThemedText>

        <TextInput
            style={styles.tagTextArea}
            multiline
            numberOfLines={6}            //initial height (Android only)
            placeholder="tags"
            placeholderTextColor={place_holder_color}
            value={tags}
            onChangeText={setTags}
            textAlignVertical="top"      //keep cursor at top on Android
            scrollEnabled                //allow scrolling when text overflows
          />
      </ThemedView>
    </ThemedView>
  );
}

