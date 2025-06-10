import {View, NativeSyntheticEvent, TextInputKeyPressEventData,} from 'react-native';
import ThemedTag from '@/components/ThemedTag';import { router } from 'expo-router';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StyleSheet, TextInput, Pressable,  ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useLayoutEffect } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import Toast from 'react-native-toast-message';
import type { TabParamList } from './_layout';
import { Feather } from '@expo/vector-icons';
import {fetchAPI} from "@/components/Utils";
import URLs from "@/constants/Urls";

import Markdown from 'react-native-markdown-display'
import * as ImagePicker from 'expo-image-picker'; 
export default function NewArticlePage() {
  
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [bodies,  setBodies]  = useState<string[]>([""]);
  const [imgs,  setImgs]  = useState<string[]>([]);
  const [inputHeights, setInputHeights] = useState<{ [key: number]: number }>({});
  const [unicon, setUnicon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const place_holder_color = useThemeColor({}, 'default_placeholder_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  
  const handlePost = async () => {
    setLoading(true);
    if (!title || !body) {
      Toast.show({
        type: 'error',
        text1: `Title and body cannot be empty!`,
      });
      setLoading(false);
      return;
    }
    const response = await fetchAPI(
      URLs.ARTICLE(), 
      {
        method: 'POST',
        token: true,
        body: { 
          title: title, 
          body: body, 
          unicon: unicon,
          tag: tags
        },
      }
    );
    if (!response.error){
      setTitle('');
      setBody('');
      setUnicon(false);
      setRaw('');
      setTags([]);
      router.push(`/article?id=${response.data.id}`);
    }else{
      Toast.show({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }
    setLoading(false);
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
        <Feather 
          name="arrow-left" 
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


  const handlePickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Compress image a bit
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setBodies(prevBodies => [...prevBodies, "newbody"])
      setImgs(prevImgs => [...prevImgs, localUri])
    }
  };

  const handleCurrentBody = async (text: string, idx: number) => {
    setBodies((prevBodies) =>
      prevBodies.map((body, i) => (i === idx ? text : body))
    );
  }
  const handleContentSizeChange = (event: NativeSyntheticEvent<{ contentSize: { height: number } }>, idx: number) => {
    setInputHeights(prev => ({
        ...prev,
        [idx]: event.nativeEvent.contentSize.height
    }));
  };
  const handleRemoveImg = async (idx: number) => {
    setImgs((prevImgs) => prevImgs.filter((_, i) => i !== idx));
    setBodies((prevBodies) => {
      if (prevBodies.length < 2 || idx < 0 || idx >= prevBodies.length - 1) return prevBodies;
      const mergedBody = prevBodies[idx] + "\n" + prevBodies[idx + 1];
      return [
      ...prevBodies.slice(0, idx),
      mergedBody,
      ...prevBodies.slice(idx + 2),
      ];
    });

  }

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: default_card_background_color,
      overflow: 'scroll',
    },
    imageBlock: {  // <--- ADD THIS STYLE
      width: '100%',
      aspectRatio: 16 / 9, // A common aspect ratio, adjust as needed
      borderRadius: 8,
      marginVertical: 10,
    },
    cardContainer:{
      // flex: 2,
      // height: 200,
      minHeight: 500,
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
      activeBodyTextArea: {
    minHeight: 150, // Give a nice, large area for typing. Adjust as needed.
    marginBottom: 20, // Add space only after the very last input.
  },
  bodyTextArea: {
    borderWidth: 0,
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: default_text_color,
  },
    tagAreaContainer:{
      padding: 20,
      gap: 20,
      display: 'flex',
      minHeight: 200,
      // flex: 1,
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
    <ScrollView 
        style={{ backgroundColor: default_card_background_color }} 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled" // Good practice for forms in ScrollViews
    >
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
          {bodies.map((bodyText, idx) => {
            // Determine if this is the last text input block
            const isLastBlock = idx === bodies.length - 1;

            return (
              // Use a Fragment with a unique key. This is very important!
              <React.Fragment key={`content-block-${idx}`}>
                <TextInput
                    style={[
                        styles.bodyTextArea,
                        // Apply the dynamic height from state
                        { height: inputHeights[idx] || undefined },
                        isLastBlock && styles.activeBodyTextArea
                    ]}
                    // Use the new handler
                    onContentSizeChange={(e) => handleContentSizeChange(e, idx)}
                    underlineColorAndroid="transparent"
                    multiline
                    placeholder={isLastBlock ? "Continue writing..." : ""}
                    placeholderTextColor={place_holder_color}
                    value={bodyText}
                    onChangeText={(text) => handleCurrentBody(text, idx)}
                    textAlignVertical="top"
                    scrollEnabled={false} // This is still very important!
                />

                {/* I also fixed your image rendering logic here from the previous answer */}
                {imgs[idx] && (
                  <Pressable onPress={() => handleRemoveImg(idx)}>
                    <Image
                      source={{ uri: imgs[idx] }}
                      style={styles.imageBlock}
                    />
                  </Pressable>
                )}
              </React.Fragment>
            );
          })}
        </ThemedView>
        <ThemedView style={styles.uniconContainer}>
            <ThemedText>
              By turning on the unicon option your post will be visible to other supported university students
            </ThemedText>
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => handlePickImage()}
            >
              <ThemedText type='contentSubTitle'>+</ThemedText>
            </ThemedButton>
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => {setUnicon(!unicon); setInputHeights([]); setImgs([]); ;setBodies([""])}}
            >
              <ThemedText type='contentSubTitle'>UNI.CON</ThemedText>
            </ThemedButton>
          </ThemedView>
      </ThemedView>
        
      <ThemedView style={styles.tagAreaContainer}>
        <ThemedText type={'contentSubTitle'}>Add Tags</ThemedText>
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
    </ScrollView>
  );
}

