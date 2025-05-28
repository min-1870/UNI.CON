import { StyleSheet, FlatList, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData, setData} from "@/components/Utils";
import URLs from "@/constants/Urls";
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Animated } from 'react-native';

import ThemedTag from '@/components/ThemedTag';
export default function HomePage() {

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [university, setUniversity] = useState('');
  const [tags, setTags] = useState([]);
  const fetchedArticlePage = useRef(null);
  const default_card_background_color = useThemeColor({}, 'default_card_background_color');

  const apiEndpoints = {
    all: URLs.TIME_SORTED_ARTICLES,
    hot: URLs.HOT_SORTED_ARTICLES,
    recommend: URLs.PREFERENCE_SORTED_ARTICLES,
  };

  useEffect(() => {
    fetchArticles();
    fetchTrendingTags();
    const fetchSchool = async () => {
      const storedUniversity = await getData('university');
      setUniversity(storedUniversity||"");
    };
    fetchSchool();
    setError(false);
  }, [sortOption]);
  
  useEffect(() => {
    if (loading) {
      contentOpacity.setValue(0);
    } else {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const fetchTrendingTags = async () => {
    setLoading(true);
    const response = await fetchAPI(URLs.TRENDING_TAGS, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setTags(response.data?.tags)
      setData('trending_tags', Array.isArray(response.data?.tags) ? response.data.tags : []);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };
  
  const fetchArticles = async () => {
    setLoading(true);
    const response = await fetchAPI(apiEndpoints[sortOption], {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticles(response.data?.results?.articles || null);
      console.log(response.data)
      setNextArticlePage(response.data?.next || null);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
    fetchedArticlePage.current = null;
  };

  const fetchMoreArticles = async () => {
    if (!nextArticlePage || nextArticlePage == fetchedArticlePage.current) return;
    
    const response = await fetchAPI(nextArticlePage, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticles(prevArticles => [
        ...prevArticles,
        ...(response.data?.results?.articles || []),
      ]);
      console.log(response.data)
      fetchedArticlePage.current = nextArticlePage;
      setNextArticlePage(response.data?.next || null);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    titleContainer: {
      marginTop: 15,
    },
    titleContentContainer:{
      marginHorizontal: 15,
      marginVertical: 30
    },
    trendingTagsContainers:{
      flexDirection: 'row',
      alignSelf: 'flex-start',
    },
    buttonContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      gap: 10,
      padding: 3,
      borderRadius: 50,
      backgroundColor: default_card_background_color,
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 3 },
      
      shadowRadius: 13,
      shadowOpacity: 0.08,
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
    },
    feedContainer: {
      alignItems: 'stretch',
      marginHorizontal: 15,
      gap: 20,
    },
  });

  const renderHeader = () => (
    <>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type={'articleTitle'}>UNI.CON</ThemedText>
        <ThemedView style={styles.titleContentContainer}>
          <ThemedText type={'university'} style={{marginBottom:15}}>{university}</ThemedText>
          <ThemedText type={'contentSubTitle'} style={{ marginBottom:5 }}>Currently, they are chatting about..</ThemedText>
          <ThemedView style={styles.trendingTagsContainers}>
            {tags.slice(0, 3).map((tag, i) => (
              <Pressable key={i}>
                <ThemedTag text={tag} type={'bigRanked'} />
              </Pressable>
            ))}
          </ThemedView>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          type={sortOption === 'all' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('all')}
        >
          <ThemedText type={sortOption === 'all' ? 'feedChecked' : 'feedUnchecked'}>All</ThemedText>
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'hot' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('hot')}
        >
          <ThemedText type={sortOption === 'hot' ? 'feedChecked' : 'feedUnchecked'} >Hot</ThemedText>
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'recommend' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('recommend')}
        >
          <ThemedText type={sortOption === 'recommend' ? 'feedChecked' : 'feedUnchecked'} >Recommend</ThemedText>
        </ThemedButton>
      </ThemedView>
    </>
  );
  return (
    <ThemedView style={styles.container}>
      {loading ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          {error || <ThemedText type="error">{error}</ThemedText>}
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ThemedArticle article_data={item} />}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
            ListHeaderComponent={renderHeader}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
}

