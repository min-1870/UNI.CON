import { StyleSheet, FlatList } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FeedArticle } from '@/components/ThemedArticles';

import React, { useState, useEffect } from "react";
import {fetchAPI} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";


export default function HomePage() {

  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const apiEndpoints = {
    all: `${API_URL}/community/article`,
    hot: `${API_URL}/community/article/hot`,
    recommend: `${API_URL}/community/article/preference`,
  };

  useEffect(() => {
    fetchArticles();
  }, [sortOption]);
  
  const fetchArticles = async () => {
    setLoading(true);
    const response = await fetchAPI(apiEndpoints[sortOption], {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticles(response.data?.results?.articles || null);
      setNextArticlePage(response.data?.next || null);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FeedArticle key={item.id} article={item} />}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 30,
  },
  feedContainer: {
    alignItems: 'center',
    gap: 20,
  },
});
