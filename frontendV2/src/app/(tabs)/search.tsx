import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import ThemedInput from '@/components/ThemedInput';

export default function SearchPage() {

  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [school, setSchool] = useState('');
  const fetchedArticlePage = useRef(null);
  const [searchContent, setSearchContent] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  
  const fetchArticles = async () => {
    setLoading(true);
    const response = await (searchContent.length === 0 
      ? fetchAPI(`${API_URL}/community/article/hot`, {
          method: 'GET',
          token: true,
        })
      : fetchAPI(`${API_URL}/community/article/search?search_content=${searchContent}`, {
          method: 'GET',
          token: true,
        }));
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


  const renderHeader = () => (
    <>
      <ThemedView style={styles.tagsContainer}>
        <ThemedText type={'subtitle'}>Trending</ThemedText>
      </ThemedView>
      <ThemedView style={styles.resultsContainer}>
        <ThemedText type={'subtitle'}>Results</ThemedText>
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
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : (
        <>
          {error || <ThemedText type="error">{error}</ThemedText>}
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ThemedArticle article_data={item} />}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
            ListHeaderComponent={renderHeader}
          />
        </>
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
