import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ThemedButton from '@/components/ThemedButton';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import type { TabParamList } from './(tabs)/_layout';
import { Ionicons } from '@expo/vector-icons';
import URLs from "@/constants/Urls";
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  View,
  Text,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import Toast from 'react-native-toast-message';

import ThemedTag from '@/components/ThemedTag';
import { router } from 'expo-router';


type Article = {
  title: string;
  body: string;
  unicon: boolean;
  tags: string[];
};

export default function ArticleEditPage() {
  const route = useRoute<RouteProp<{ params: { id: string } }>>();
  const articleId = route.params?.id;
  
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [loading, setLoading] = useState(false);

  const [orgArticle,  setOrgArticle]  = useState<Article>({
    title: '',
    body: '',
    unicon: false,
    tags: [],
  });
  const [article,  setArticle]  = useState<Article>({
    title: '',
    body: '',
    unicon: false,
    tags: [],
  });

  
  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const place_holder_color = useThemeColor({}, 'default_placeholder_color');
  const default_text_color = useThemeColor({}, 'default_text_color');

  
  const [raw, setRaw] = useState('');       // what the user is typing now
  const [tags, setTags] = useState<string[]>([]);  // all confirmed tags


  useEffect(() => {
    fetchArticle();
  }, []);

  useEffect(() => {
  setArticle(JSON.parse(JSON.stringify(orgArticle)));
  }, [orgArticle]);

  const fetchArticle = async () => {
    setLoading(true);
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId)), {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setOrgArticle({
        title: response.data?.results?.article?.title,
        body: response.data?.results?.article?.body,
        unicon: response.data?.results?.article?.unicon,
        tags: response.data?.results?.article?.tag,
      })
    } else {
      // setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };

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
    setArticle((prev) => ({
    ...prev,
    tags: prev.tags.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    if (!article.title || !article.body) {
      Toast.show({
        type: 'error',
        text1: `Title and body cannot be empty!`,
      });
      setLoading(false);
      return;
    }
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId) + '/'), 
      {
        method: 'PATCH',
        token: true,
        body: { 
          title: article.title, 
          body: article.body, 
          // unicon: article.unicon,
          // tag: article.tags
        },
      }
    );
    if (!response.error){
      setArticle({
        title: '',
        body: '',
        unicon: false,
        tags: [],
      })
      router.push(`/article?id=${articleId}`);
    }else{
      Toast.show({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    if (!article.title || !article.body) {
      Toast.show({
        type: 'error',
        text1: `Title and body cannot be empty!`,
      });
      setLoading(false);
      return;
    }
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId) + '/'), 
      {
        method: 'DELETE',
        token: true,
        body: {},
      }
    );
    if (!response.error){
      setArticle({
        title: '',
        body: '',
        unicon: false,
        tags: [],
      })
      router.push(`/article?id=${articleId}`);
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
      headerTitle: 'Edit',
      headerTintColor: default_text_color,
      headerRight: () => (
        <Pressable onPress={() => {
              if (
                article.title === orgArticle?.title &&
                article.body === orgArticle?.body &&
                article.unicon === orgArticle?.unicon &&
                JSON.stringify(article.tags) === JSON.stringify(orgArticle?.tags)
              ) {
                handleDelete();
              } else {
                handleUpdate();
              }
            }}>
          <ThemedText
            type={'default'}
            disabled={loading}
            style={{ marginRight: 30 }}
          >
            {article.title === orgArticle?.title &&
            article.body === orgArticle?.body &&
            article.unicon === orgArticle?.unicon &&
            JSON.stringify(article.tags) === JSON.stringify(orgArticle?.tags)
              ? 'Delete'
              : 'Update'}
          </ThemedText>
        </Pressable>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, handleUpdate, loading]);


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
            value={article.title}
            onChangeText={text => setArticle(prev => ({ ...prev, title: text }))}
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
            value={article.body}
            onChangeText={text => setArticle(prev => ({ ...prev, body: text }))}
            textAlignVertical="top"      //keep cursor at top on Android
            scrollEnabled                //allow scrolling when text overflows
          />
        </ThemedView>
        <ThemedView style={styles.uniconContainer}>
            <ThemedText>
              By turning on the unicon option your post will be visible to other supported university students
            </ThemedText>
            <ThemedButton
              type={article.unicon ? 'toggled' : 'unToggled'}
              onPress={() => setArticle(prev => ({ ...prev, unicon: !article.unicon }))}
            >
              <ThemedText type='contentSubTitle'>UNI.CON</ThemedText>
            </ThemedButton>
          </ThemedView>
      </ThemedView>
        
      <ThemedView style={styles.tagAreaContainer}>
        <ThemedText type={'contentSubTitle'}>Add Tags</ThemedText>
        <View style={styles.chipContainer}>
          {article.tags.map((tag, i) => (
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

