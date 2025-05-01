import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";

export default function NotificationPage() {

  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [nextOldNotificationPage, setNextOldNotificationPage] = useState(null);
  const [oldNotifications, setOldNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [school, setSchool] = useState('');
  const fetchedArticlePage = useRef(null);

  const apiEndpoints = {
    all: `${API_URL}/community/article`,
    hot: `${API_URL}/community/article/hot`,
    recommend: `${API_URL}/community/article/preference`,
  };

  useEffect(() => {
    fetchArticles();
    fetchNewNotification();
    fetchOldNotification();
    const fetchSchool = async () => {
      const storedSchool = await getData('initial');
      setSchool(storedSchool||"");
    };
    fetchSchool();
  }, [sortOption]);
  
  const fetchNewNotification = async () => {
    setLoading(true);
    const response = await fetchAPI(`${API_URL}/community/article/new_notifications`, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      console.log(response.data)
      
      // setArticles(response.data?.results?.articles || null);
      // console.log(response.data)
      // setNextArticlePage(response.data?.next || null);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
    fetchedArticlePage.current = null;
  }
  
  const fetchOldNotification = async () => {
    setLoading(true);
    const response = await fetchAPI(`${API_URL}/community/article/old_notifications`, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      console.log(response.data)
      setOldNotifications(response.data?.results?.notifications || null);
      setNextOldNotificationPage(response.data?.next || null);
      // setArticles(response.data?.results?.articles || null);
      // console.log(response.data)
      // setNextArticlePage(response.data?.next || null);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
    fetchedArticlePage.current = null;
  }

  const fetchArticles = async () => {
    setLoading(true);
    const response = await fetchAPI(apiEndpoints[sortOption], {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticles(response.data?.results?.articles || null);
      // console.log(response.data)
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type={'title'}>UNI.CON</ThemedText>
        <ThemedText type={'title'}>{school.toUpperCase()}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          type={sortOption === 'all' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('all')}
        >
          All
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'hot' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('hot')}
        >
          Hot
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'recommend' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('recommend')}
        >
          Recommend
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
    marginHorizontal: 20,
    gap: 20,
  },
});
