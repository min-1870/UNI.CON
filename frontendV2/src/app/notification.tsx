import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";

export default function NotificationPage() {

  const [nextOldNotificationPage, setNextOldNotificationPage] = useState(null);
  const [oldNotifications, setOldNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [school, setSchool] = useState('');
  const fetchedOldNotificationPage = useRef(null);

  console.log("NotificationPage rendered");
  useEffect(() => {
    fetchOldNotification();
    const fetchSchool = async () => {
      const storedSchool = await getData('initial');
      setSchool(storedSchool||"");
    };
    fetchSchool();
  }, []);
  
  const fetchOldNotification = async () => {
    setLoading(true);
    const response = await fetchAPI(URLs.OLD_NOTIFICATIONS, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      console.log(response.data)
      setOldNotifications(response.data?.results?.notifications || null);
      setNextOldNotificationPage(response.data?.next || null);
      console.log(response)
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
    fetchedOldNotificationPage.current = null;
  }

  // const fetchArticles = async () => {
  //   setLoading(true);
  //   const response = await fetchAPI(apiEndpoints[sortOption], {
  //     method: 'GET',
  //     token: true,
  //   });
  //   if (!response.error) {
  //     setArticles(response.data?.results?.articles || null);
  //     // console.log(response.data)
  //     setNextArticlePage(response.data?.next || null);
  //   } else {
  //     setError(response?.data?.detail || "An error occurred");
  //   }
  //   setLoading(false);
  //   fetchedArticlePage.current = null;
  // };

  // const fetchMoreArticles = async () => {
  //   if (!nextArticlePage || nextArticlePage == fetchedArticlePage.current) return;
    
  //   const response = await fetchAPI(nextArticlePage, {
  //     method: 'GET',
  //     token: true,
  //   });
  //   if (!response.error) {
  //     setArticles(prevArticles => [
  //       ...prevArticles,
  //       ...(response.data?.results?.articles || []),
  //     ]);
  //     console.log(response.data)
  //     fetchedArticlePage.current = nextArticlePage;
  //     setNextArticlePage(response.data?.next || null);
  //   } else {
  //     setError(response?.data?.detail || "An error occurred");
  //   }
    
  // };

  const renderHeader = () => (
    <>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type={'default'}>UNI.CON</ThemedText>
        <ThemedText type={'default'}>{school.toUpperCase()}</ThemedText>
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
            data={oldNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ThemedText type="default">{item.content}</ThemedText>}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText>No oldNotifications found.</ThemedText>}
            ListHeaderComponent={renderHeader}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              // fetchMoreArticles();
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
  feedContainer: {
    alignItems: 'stretch',
    marginHorizontal: 20,
    gap: 20,
  },
});
