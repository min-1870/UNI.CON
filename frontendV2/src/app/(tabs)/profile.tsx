import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import { router } from 'expo-router';

export default function ProfilePage() {

  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("posted");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [university, setUniversity] = useState('');
  const [points, setPoints] = useState('');
  const [email, setEmail] = useState('');
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
      const storedUniversity = await getData('university');
      const storedEmail = await getData('email');
      const storedPoints = await getData('points');
      setUniversity(storedUniversity||"");
      setEmail(storedEmail||"");
      setPoints(storedPoints||'');
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
    },
    titleContainer: {
      gap: 20,
    },
    credibilityScoreContainer: {
      gap: 10,
    },
    summaryContainer: {
      gap: 10,
    },
    rowsContainer: {
      gap: 10,
      marginLeft: 20,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 20,
    },
    feedContainer: {
      margin: 20,
      alignItems: 'stretch',
      gap: 20,
    },
    csRowContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-end',
      marginLeft: 20,
    },
  });

  const renderHeader = () => (
    <>
      <ThemedView style={styles.titleContainer}>
        <ThemedView style={styles.credibilityScoreContainer}>
          <ThemedText type={'subtitle'}>Credibility Score</ThemedText>
          <ThemedView style={styles.csRowContainer}>
          <ThemedText type={'summaryPoints'}>{points}</ThemedText>
          <ThemedText type={'default'}>Points</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.summaryContainer}>
          <ThemedText type={'subtitle'}>Account Summary</ThemedText>
          <ThemedView style={styles.rowsContainer}>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'defaultSemiBold'}>University</ThemedText>
              <ThemedText type={'default'}>{university}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'defaultSemiBold'}>Student Email</ThemedText>
              <ThemedText type={'default'}>{email}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'defaultSemiBold'}>Google Account</ThemedText>
              <ThemedText type={'default'}>(PLACE HOLDER)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'defaultSemiBold'}>Update Password</ThemedText>
              <ThemedText onPress={() => router.push(`/newPassword`)} type={'default'}>(Click for Update)</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
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

