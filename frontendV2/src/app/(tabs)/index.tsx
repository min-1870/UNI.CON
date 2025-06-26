import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HomePage() {
  const { theme } = useTheme();
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [university, setUniversity] = useState('');
  const fetchedArticlePage = useRef(null);

  const apiEndpoints = {
    all: URLs.TIME_SORTED_ARTICLES,
    hot: URLs.HOT_SORTED_ARTICLES,
    recommend: URLs.PREFERENCE_SORTED_ARTICLES,
  };

  useEffect(() => {
    fetchArticles();
    const fetchSchool = async () => {
      const storedUniversity = await getData('university');
      setUniversity(storedUniversity||"");
    };
    fetchSchool();
  }, [sortOption]);
  
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
      backgroundColor: theme.colors.background,
    },
    titleContainer: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.xl,
      marginBottom: theme.spacing['4xl'],
    },
    titleContentContainer:{
      margin: theme.spacing.xl,
      gap: theme.spacing.xl,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      gap: theme.spacing.sm,
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.card,
      shadowColor: theme.computed.shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 13,
      shadowOpacity: 0.08,
      elevation: 10,
    },
    feedContainer: {
      alignItems: 'stretch',
      marginHorizontal: theme.spacing.xl,
      gap: theme.spacing.xl,
    },
  });

  const renderHeader = () => (
    <>
              <ThemedView variant="background" style={styles.titleContainer}>
          <ThemedText type="subtitle">UNI.CON</ThemedText>
          <ThemedView variant="background" style={styles.titleContentContainer}>
            <ThemedText type="title">{university}</ThemedText>
            <ThemedText type="defaultSemiBold">Currently, they are chatting about..</ThemedText>
          </ThemedView>
        </ThemedView>
      <ThemedView variant="transparent" style={styles.buttonContainer}>
        <ThemedButton
          variant={sortOption === 'all' ? 'primary' : 'chip'}
          size="sm"
          onPress={() => setSortOption('all')}
        >
          All
        </ThemedButton>
        <ThemedButton
          variant={sortOption === 'hot' ? 'primary' : 'chip'}
          size="sm"
          onPress={() => setSortOption('hot')}
        >
          Hot
        </ThemedButton>
        <ThemedButton
          variant={sortOption === 'recommend' ? 'primary' : 'chip'}
          size="sm"
          onPress={() => setSortOption('recommend')}
        >
          Recommend
        </ThemedButton>
      </ThemedView>
    </>
  );

  return (
    <ProtectedRoute>
      <ThemedView variant="background" style={styles.container}>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : (
          <>
            {error && <ThemedText type="error">{error}</ThemedText>}
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
          </>
        )}
      </ThemedView>
    </ProtectedRoute>
  );
}

