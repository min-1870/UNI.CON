import { ArticleType, InitialDataType } from '@/constants/types';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import {fetchAPI, getData, setData} from "@/components/Utils";
import React, { useState, useEffect, useRef  } from "react";
import ThemedArticle from '@/components/ThemedArticle';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedTag from '@/components/ThemedTag';
import Toast from 'react-native-toast-message';
import { ImageBackground } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import URLs from "@/constants/Urls";

export default function HomePage() {

  const apiEndpoints = {
    all: URLs.TIME_SORTED_ARTICLES,
    hot: URLs.HOT_SORTED_ARTICLES,
    recommend: URLs.PREFERENCE_SORTED_ARTICLES,
  };

  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [initialData, setInitialData] = useState<InitialDataType|null>(null);
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<[]>([]);
  const isFetchingMore = useRef(false);


  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fetchedArticlePage = useRef(null);

  useEffect(() => {
    fetchArticles();
    fetchTrendingTags();
    fetchInitialData();
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

  const fetchInitialData = async () => {
    const storedInitialData = await getData('initialData');
    storedInitialData && setInitialData(JSON.parse(storedInitialData));
  };

  const fetchTrendingTags = async () => {
    setLoading(true);
    const response = await fetchAPI(URLs.TRENDING_TAGS, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setTags(Array.isArray(response.data?.tags) ? response.data.tags.slice(0, 3) : [])
      setData('trending_tags', Array.isArray(response.data?.tags) ? response.data.tags : []);
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setLoading(false);
  };
  
  const fetchArticles = async () => {
    setLoading(true);
    fetchedArticlePage.current = null;   
    const response = await fetchAPI(apiEndpoints[sortOption], {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      
      setArticles(response.data?.results?.articles || null);
      setNextArticlePage(response.data?.next || null);
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setLoading(false);
  };

  const fetchMoreArticles = async () => {
    if (
      !nextArticlePage ||
      nextArticlePage === fetchedArticlePage.current ||
      isFetchingMore.current
    ) {
      return;
    }
    isFetchingMore.current = true;    
    const response = await fetchAPI(nextArticlePage, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticles(prevArticles => [
        ...prevArticles,
        ...(response.data?.results?.articles || []),
      ]);
      fetchedArticlePage.current = nextArticlePage;
      setNextArticlePage(response.data?.next || null);
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    
    isFetchingMore.current = false;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: "relative", 
    },
    titleContainer: {
      margin: 15,
      backgroundColor: "transparent"
    },
    titleHeaderContainer:{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      backgroundColor: "transparent"
    },
    titleContentContainer:{
      marginHorizontal: 15,
      marginVertical: 30,
      backgroundColor: "transparent"
    },
    trendingTagsContainers:{
      flexDirection: 'row',
      alignSelf: 'flex-start',
      backgroundColor: "transparent"
    },
    buttonContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      marginHorizontal: 15,
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
      // marginHorizontal: 15,
      gap: 20,
    },
  });

  const renderHeader = () => (
    <>
      <ImageBackground
        source={require("../../assets/images/indexBg.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
      </ImageBackground>
      <ThemedView style={styles.titleContainer}>
        <ThemedView style={styles.titleHeaderContainer}>
          <ThemedText type={'contentTitle'}>UNI.CON</ThemedText>
          <Pressable onPress={() => router.push('/notification')}>
            <Ionicons
              name='notifications-outline'
              size={25}
            />
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.titleContentContainer}>
          <ThemedText type={'university'} style={{marginBottom:15}}>{initialData?.university}</ThemedText>
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
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ThemedArticle 
              initialData={initialData} 
              articleData={item}
            />}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
            ListHeaderComponent={renderHeader}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={9}
            removeClippedSubviews={true}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
}

