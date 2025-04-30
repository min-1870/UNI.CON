import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";

export default function ProfilePage() {

  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("posted");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [school, setSchool] = useState('');
  const fetchedArticlePage = useRef(null);

  const apiEndpoints = {
    posted: `${API_URL}/community/article/posted_articles`,
    saved: `${API_URL}/community/article/saved_articles`,
    commented: `${API_URL}/community/article/commented_articles`,
    liked: `${API_URL}/community/article/liked_articles`,
  };

  useEffect(() => {
    fetchArticles();
    const fetchSchool = async () => {
      const storedSchool = await getData('initial');
      setSchool(storedSchool||"");
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

  const renderHeader = () => (
    <>
      <ThemedView style={styles.titleContainer}> TODO fix the header to match the design
        <ThemedText type={'title'}>UNI.CON</ThemedText>
        <ThemedText type={'title'}>{school.toUpperCase()}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          type={sortOption === 'posted' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('posted')}
        >
          Posted
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'saved' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('saved')}
        >
          Saved
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'commented' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('commented')}
        >
          Commented
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'liked' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('liked')}
        >
          Liked
        </ThemedButton>
      </ThemedView>
    </>
  );
  return (
    <ThemedView style={styles.container}>
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
            ListHeaderComponent={renderHeader}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
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
  },
  titleContainer: {
    marginTop: 20,
    gap: 20,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  feedContainer: {
    
    alignItems: 'stretch',
    gap: 20,
  },
});
