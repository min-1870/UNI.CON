import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ThemedButton from '@/components/ThemedButton';
import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import type { TabParamList } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import URLs from "@/constants/Urls";
import {
  View,
  Text,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import ThemedTag from '@/components/ThemedTag';

export default function NewArticlePage() {
  
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [unicon, setUnicon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('error here');

  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const place_holder_color = useThemeColor({}, 'default_placeholder_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  
  const [raw, setRaw] = useState('');       // what the user is typing now
  const [tags, setTags] = useState<string[]>([]);  // all confirmed tags
  // when the user presses space (or comma), commit the current word as a tag
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === ' ' || e.nativeEvent.key === ',') {
      const word = raw.trim();
      if (word.length > 0 && !tags.includes(word)) {
        setTags([...tags, word]);
      }
      setRaw('');  // clear the input
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handlePost = async () => { //TODO fix this function to post the article
    setLoading(true);
    const response = await fetchAPI(
      URLs.ARTICLE(), 
      {
        method: 'POST',
        token: true,
        body: { 
          title: title, 
          body: body, 
          unicon: unicon,
          tags: []
        },
      }
    );
    setLoading(false);
    if (!response.error){

    }else{

    }
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
      gap: 20,
      display: 'flex',
      flex: 1,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    tagTextArea: {
      flexGrow: 1,
      minWidth: 80,
      fontSize: 16,
      padding: 4,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.cardContainer}>
        <ThemedView style={styles.textAreasContainer}>
          <TextInput
            style={styles.titleTextArea}
            underlineColorAndroid="transparent" 
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
            underlineColorAndroid="transparent" 
            multiline
            numberOfLines={6}            //initial height (Android only)
            placeholder="Body Text"
            placeholderTextColor={place_holder_color}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"      //keep cursor at top on Android
            scrollEnabled                //allow scrolling when text overflows
          />
        </ThemedView>

        {error || <ThemedText type="error">{error}</ThemedText>}
        <ThemedView style={styles.uniconContainer}>
            <ThemedText>
              By turning on the unicon option your post will be visible to other supported university students
            </ThemedText>
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => {setUnicon(!unicon)}}
            >
              UNI.CON
            </ThemedButton>
          </ThemedView>
      </ThemedView>
        
      <ThemedView style={styles.tagAreaContainer}>
        <ThemedText type={'subtitle'}>Add Tags</ThemedText>
        <View style={styles.chipContainer}>
          {tags.map((tag, i) => (
            <Pressable onPress={() => removeTag(i)}>
              <ThemedTag text={tag} type={'default'} key={i}/>
            </Pressable>
          ))}
          <TextInput
            style={styles.tagTextArea}
            value={raw}
            onChangeText={setRaw}
            onKeyPress={onKeyPress}
            placeholder="Type and hit space"
            placeholderTextColor={place_holder_color}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </ThemedView>
    </ThemedView>
  );
}

