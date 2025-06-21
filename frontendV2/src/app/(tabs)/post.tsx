import {View, NativeSyntheticEvent, TextInputKeyPressEventData,} from 'react-native';
import { StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState, useLayoutEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import Toast from 'react-native-toast-message';
import type { TabParamList } from './_layout';
import ThemedTag from '@/components/ThemedTag';
import {fetchAPI} from "@/components/Utils";
import URLs from "@/constants/Urls";

export default function NewArticlePage() {
  
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [unicon, setUnicon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const place_holder_color = useThemeColor({}, 'default_placeholder_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  
  const handlePost = async () => {
    setLoading(true);
    
    // Validate required fields
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: `Title cannot be empty!`,
      });
      setLoading(false);
      return;
    }

    if (!body.trim()) {
      Toast.show({
        type: 'error',
        text1: `Body cannot be empty!`,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchAPI(
        URLs.ARTICLE(), 
        {
          method: 'POST',
          token: true,
          body: { 
            title: title.trim(), 
            body: body.trim(), 
            unicon: unicon,
            tag: tags // Backend expects this field
          },
        }
      );
      
      if (!response.error){
        Toast.show({
          type: 'success',
          text1: 'Post created successfully!',
        });
        
        // Reset form
        setTitle('');
        setBody('');
        setUnicon(false);
        setRaw('');
        setTags([]);
        
        // Navigate to the created article
        navigation.navigate('home');
      } else {
        console.error('Post creation failed:', response.data);
        Toast.show({
          type: 'error',
          text1: `Failed to post: ${response.data?.detail || 'Unknown error'}`,
        });
      }
    } catch (error) {
      console.error('Post creation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Network error. Please try again.',
      });
    }
    
    setLoading(false);
  };  

  // Temporarily disabled image upload functionality
  // const handleUploadImgs = async (imgResult: ImagePickerResult) => {
  //   // Image upload implementation will be added later when backend endpoint is ready
  //   return null;
  // };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
      backgroundColor: default_card_background_color, // navbar background
      // shadowColor: 'transparent', // remove iOS bottom border
      elevation: 0, // remove Android shadow
      borderWidth: 0, 
      },
      headerTintColor: default_text_color,
      headerLeft: () => (
        <Feather 
          name="arrow-left" 
          size={24} 
          color={default_text_color}
          onPress={() => {
            setTitle('');
            setBody('');
            setUnicon(false);
            setRaw('');
            setTags([]);
            navigation.navigate('home');
          }}
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

  // Simplified - removed complex image and multi-body functionality for now

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === ' ' || e.nativeEvent.key === ',') {
      const word = raw.trim().toLocaleLowerCase();
      if (word.length > 0 && !tags.includes(word)) {
        setTags([...tags, word]);
      }
      setRaw(''); 
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
    },
    cardContainer: {
      minHeight: 500,
      display: 'flex',
      color: default_card_background_color,
      borderRadius: 30,
      padding: 20, 
      marginBottom: 20,
      
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
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
      gap: 10,
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
      color: default_text_color,
      marginBottom: 20,
      minHeight: 120,
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
    <ThemedView style={styles.container}>
      <ThemedView style={styles.cardContainer}>
        <ThemedView style={styles.textAreasContainer}>
          <TextInput
            style={styles.titleTextArea}
            underlineColorAndroid="transparent" 
            numberOfLines={6}            
            placeholder="Title"
            placeholderTextColor={place_holder_color}
            value={title}
            onChangeText={setTitle}
            textAlignVertical="top"      
            scrollEnabled                
          />
          <TextInput
            style={styles.bodyTextArea}
            underlineColorAndroid="transparent"
            multiline
            placeholder="What's on your mind?"
            placeholderTextColor={place_holder_color}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
            scrollEnabled={true}
          />
        </ThemedView>
        <ThemedView style={styles.uniconContainer}>
            <ThemedText>
              By enabling the unicon option your post will be visible to other supported university students
            </ThemedText>
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => {setUnicon(!unicon);}}
            >
              <ThemedText type='contentSubTitle'>UNI.CON</ThemedText>
            </ThemedButton>
          </ThemedView>
      </ThemedView>
      <ThemedView style={styles.tagAreaContainer}>
        <ThemedText type={'contentSubTitle'}>Add Tags</ThemedText>
        <View style={styles.chipContainer}>
          {tags.map((tag, i) => (
            <Pressable onPress={() => removeTag(i)} key={i}>
              <ThemedTag text={tag} type={'default'}/>
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

