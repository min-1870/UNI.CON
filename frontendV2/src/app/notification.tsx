import React, { useState, useEffect, useLayoutEffect, useRef  } from "react";
import ThemedNotification from '@/components/ThemedNotification';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, FlatList, View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import {fetchAPI} from "@/components/Utils";
import { Animated } from 'react-native';
import URLs from "@/constants/Urls";

export default function NotificationPage() {
  const [newNotifications, setNewNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [oldNotifications, setOldNotifications] = useState<{ id: string; [key: string]: any }[]>([]);
  const [nextNewNotificationPage, setNextNewNotificationPage] = useState(null);
  const [nextOldNotificationPage, setNextOldNotificationPage] = useState(null);
  const [loading, setLoading] = useState(false);

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fetchedNewNotificationPage = useRef(null);
  const fetchedOldNotificationPage = useRef(null);
  const navigation = useNavigation();
  
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
      headerTitle: 'Update Password',
    });
  }, [navigation, loading, DEFAULT_CARD_BACKGROUND, DEFAULT_TEXT]);

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
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setLoading(false);
    if (isNew) {
      fetchedNewNotificationPage.current = null;
    } else {
      fetchedOldNotificationPage.current = null;
    }
  }


  const fetchMoreNotification = async (isNew = false) => {
    if (isNew){
      if (!nextNewNotificationPage || nextNewNotificationPage == fetchedNewNotificationPage.current) return;
    }else{
      if (!nextOldNotificationPage || nextOldNotificationPage == fetchedOldNotificationPage.current) return; 
    }
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
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <ThemedText size='h3' font='displayBold'>Recent</ThemedText>
            <View style={styles.feedWrapper}>
              <FlatList
                data={newNotifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ThemedNotification notification_data={item}/>}
                contentContainerStyle={styles.feedContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  
                    <ThemedText size='h3' font='textMedium' color="gray" >No Notification found.</ThemedText>
                  
                }
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                  fetchMoreNotification(true);
                }}
              />
            </View>
          <ThemedText size='h3' font='displayBold'>Older</ThemedText>
          <View style={styles.feedWrapper}>
            <FlatList
              data={oldNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ThemedNotification notification_data={item}/>}
              contentContainerStyle={styles.feedContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <ThemedText size='h3' font='textMedium' color="gray" >No Notification found.</ThemedText>
              }
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                fetchMoreNotification(false);
              }}
            />
          </View>
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
    alignSelf: 'center',
  },
  feedWrapper:{ 
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100
  }
});
