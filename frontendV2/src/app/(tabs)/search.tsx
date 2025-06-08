import { ArticleType, InitialDataType } from '@/constants/types';
import React, { useState, useEffect, useRef  } from "react";
import ThemedArticle from '@/components/ThemedArticle';
import {fetchAPI, getData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import { StyleSheet, FlatList } from 'react-native';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import { Animated } from 'react-native';
import URLs from "@/constants/Urls";

export default function SearchPage() {

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [initialData, setInitialData] = useState<InitialDataType|null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedArticlePage = useRef(null);
  const [searchContent, setSearchContent] = useState('');

  useEffect(() => {
    fetchArticles();
    fetchInitialData();
  }, []);

  
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

  const fetchArticles = async () => {
    setLoading(true);
    const response = await (searchContent.length === 0 
      ? fetchAPI(URLs.HOT_SORTED_ARTICLES, {
          method: 'GET',
          token: true,
        })
      : fetchAPI(URLs.SEARCHING_ARTICLE(searchContent), {
          method: 'GET',
          token: true,
        }));
    if (!response.error) {
      setArticles(response.data?.results?.articles || null);
      console.log(response.data)
      setNextArticlePage(response.data?.next || null);
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
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
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    
  };


  const renderHeader = () => (
    <>
      <ThemedView style={styles.tagsContainer}>
        <ThemedText type={'contentTitle'}>Trending</ThemedText>
      </ThemedView>
      <ThemedView style={styles.resultsContainer}>
        <ThemedText type={'contentTitle'}>Results</ThemedText>
      </ThemedView>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.searchBarContainer}>
        <ThemedInput
          type={'search'}
          onChangeText={setSearchContent}
          value={searchContent}
          placeholder="search anything..."
          keyboardType='default'
          onSubmitEditing={fetchArticles}
        />
      </ThemedView>
      {loading ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ThemedArticle initialData={initialData} articleData={item} />}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
            ListHeaderComponent={renderHeader}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 20,
  },
  searchBarContainer: {
  },
  tagsContainer: {
  },
  resultsContainer: {
  },
  feedContainer: {
    alignItems: 'stretch',
    gap: 20,
  },
});
