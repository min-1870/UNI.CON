import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedNotification from '@/components/ThemedNotification';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";

export default function NotificationPage() {

  const [nextNewNotificationPage, setNextNewNotificationPage] = useState(null);
  const [newNotifications, setNewNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [nextOldNotificationPage, setNextOldNotificationPage] = useState(null);
  const [oldNotifications, setOldNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [school, setSchool] = useState('');
  const fetchedNewNotificationPage = useRef(null);
  const fetchedOldNotificationPage = useRef(null);

  console.log("NotificationPage rendered");
  useEffect(() => {
    fetchNotification(true);
    fetchNotification(false);
  }, []);

  const fetchNotification = async (isNew = true) => {
    setLoading(true);

    const response = await fetchAPI(
      isNew ? URLs.NEW_NOTIFICATIONS : URLs.OLD_NOTIFICATIONS, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      if (isNew) {
        setNewNotifications(response.data?.results?.notifications || null);
        setNextNewNotificationPage(response.data?.next || null);
      } else {
        setOldNotifications(response.data?.results?.notifications || null);
        setNextOldNotificationPage(response.data?.next || null);
      }
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
    if (isNew) {
      fetchedNewNotificationPage.current = null;
    } else {
      fetchedOldNotificationPage.current = null;
    }
  }


  const fetchMoreNotification = async (isNew = false) => {
    if (!nextNewNotificationPage || nextNewNotificationPage == fetchedNewNotificationPage.current) return;
    if (!nextOldNotificationPage || nextOldNotificationPage == fetchedOldNotificationPage.current) return;
    
    const nextPage = isNew ? nextNewNotificationPage : nextOldNotificationPage;
    if (!nextPage) {
      return;
    }
    const response = await fetchAPI(
      nextPage, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      if (isNew) {
        setNewNotifications(prevNotifications => [
          ...prevNotifications,
          ...(response.data?.results?.notifications || []),
        ]);
        fetchedNewNotificationPage.current = nextNewNotificationPage;
        setNextNewNotificationPage(response.data?.next || null);
      } else {
        setOldNotifications(prevNotifications => [
          ...prevNotifications,
          ...(response.data?.results?.notifications || []),
        ]);
        fetchedOldNotificationPage.current = nextOldNotificationPage;
        setNextOldNotificationPage(response.data?.next || null);
      }
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="contentTitle">Recent</ThemedText>
      <FlatList
        data={newNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ThemedNotification notification_data={item}/>}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedText type='contentPlaceholder'>No Notification found.</ThemedText>
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          fetchMoreNotification(true);
        }}
      />
      <ThemedText type="contentTitle">Older</ThemedText>
      <FlatList
        data={oldNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ThemedNotification notification_data={item}/>}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedText type='contentPlaceholder'>No Notification found.</ThemedText>
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          fetchMoreNotification(false);
        }}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
});
