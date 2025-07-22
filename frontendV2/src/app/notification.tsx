import React, { useState, useEffect, useLayoutEffect, useRef  } from "react";
import ThemedNotification from '@/components/ThemedNotification';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, FlatList, View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import {fetchAPI} from "@/components/Utils";
import { Animated } from 'react-native';
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';


export default function NotificationPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [nextNotificationPage, setNextNotificationPage] = useState(null);
  const [last_check_at, setLastCheckAt] = useState('');
  const fetchedNotificationPage = useRef(null);
  const isFetchingMore = useRef(false);
  const [loading, setLoading] = useState(false);

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotification();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: DEFAULT_CARD_BACKGROUND, // navbar background
        // shadowColor: 'transparent', // remove iOS bottom border
        elevation: 0, // remove Android shadow
        borderWidth: 0, 
      },
      headerTintColor: DEFAULT_TEXT,
      headerTitleAlign: 'center',
      headerTitle: 'Notifications',
    });
  }, [navigation, loading, DEFAULT_CARD_BACKGROUND, DEFAULT_TEXT]);

  const fetchNotification = async () => {
    setLoading(true);

    const response = await fetchAPI(
      URLs.NOTIFICATIONS, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setLastCheckAt(response.data?.last_check_at || '');
      setNotifications(response.data?.results?.notifications || []);
      setNextNotificationPage(response.data?.next || null);
    } else {
      showToast({
        type: 'error',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setLoading(false);
    fetchedNotificationPage.current = nextNotificationPage;
  }


  const fetchMoreNotification = async () => {
    if (!nextNotificationPage || nextNotificationPage === fetchedNotificationPage.current || isFetchingMore.current) {

      return;
    }
    isFetchingMore.current = true;
    const response = await fetchAPI(
      nextNotificationPage, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setNotifications(prevNotifications => [
        ...prevNotifications,
        ...(response.data?.results?.notifications || []),
      ]);
      setNextNotificationPage(response.data?.next || null);
      fetchedNotificationPage.current = response.data?.next || null;
    } else {
      showToast({
        type: 'error',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    isFetchingMore.current = false;
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? null : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ThemedNotification last_check_at={last_check_at} notification_data={item}/>}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            
              <ThemedText size='h3' font='textMedium' color="gray" >No Notification found.</ThemedText>
            
          }
          onEndReachedThreshold={0.5}
          onEndReached={fetchMoreNotification}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  feedContainer: {
    alignItems: 'stretch',
    padding: 16,
    gap: 20,
  },
  feedWrapper:{ 
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100
  }
});
