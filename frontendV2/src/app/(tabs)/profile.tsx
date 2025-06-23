import { ArticleType, InitialDataType } from '@/constants/types';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useArticlesStore } from '@/store/articleStore';
import ThemedArticle from '@/components/ThemedArticle';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import * as AuthSession from 'expo-auth-session';
import { ImageBackground } from "react-native";
import Toast from 'react-native-toast-message';
import { Animated } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import URLs from "@/constants/Urls";

export default function ProfilePage() {
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("posted");
  const [initialData, setInitialData] = useState<InitialDataType|null>(null);
  const [loading, setLoading] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const isFetchingMore = useRef(false);
  const route = useRoute();
  
  const lastResetPage = useArticlesStore(s => s.lastResetPage);
  const feedIds = useArticlesStore(s => s.feeds[route.name]) || {};
  const articlesById = useArticlesStore(s => s.articlesById) || {};
  const feedArticles = (feedIds[sortOption] ?? []).map(id => articlesById[id]) || [];
  const nextArticlePage = useArticlesStore(s => s.nextArticlePage[route.name]) || {};
  const currentArticlePage = useArticlesStore(s => s.currentArticlePage[route.name]) || {};

  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  
  const discovery = {
    authorizationEndpoint: URLs.authorizationEndpoint,
    tokenEndpoint: URLs.tokenEndpoint,
  };

  const apiEndpoints = {
    posted: URLs.POSTED_ARTICLES,
    saved: URLs.SAVED_ARTICLES,
    commented: URLs.COMMENTED_ARTICLES,
    liked: URLs.LIKED_ARTICLES,
  };

  // Fetch again when the page is reset
  useEffect(() => {
    if (lastResetPage && lastResetPage === route.name) {
      fetchArticles();
    }
  },[lastResetPage]);

  // FETCH ONCE: initial data 
  useEffect(() => {
    (async () => {
      const stored = await getData('initialData');
      if (stored) setInitialData(JSON.parse(stored));
    })();
  }, []);
  
  useEffect(() => {
    if (!feedIds[sortOption] || feedIds[sortOption].length === 0) {
      fetchArticles();
    }
  }, [sortOption]);
    
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


  const fetchArticles = useCallback(async () => {
    // setLoading(true);
    if (feedIds && (feedIds[sortOption]||[]).length > 0) {
      return;
    }
    
    const res = await fetchAPI(apiEndpoints[sortOption], { method: 'GET', token: true });
    if (!res.error) {
      useArticlesStore.getState().setFeed(route.name, sortOption, res.data?.results?.articles || []);
      useArticlesStore.getState().setNextArticlePage(route.name, sortOption, res.data?.next || null);
    } else {
      Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading articles' });
    }
    // setLoading(false);
  }, [sortOption, lastResetPage]);

  useFocusEffect(
  useCallback(() => {
      if (!feedIds[sortOption] || feedIds[sortOption].length === 0) {
        fetchArticles();
      }
    }, [feedIds, sortOption, fetchArticles])
  );
  
  const fetchMoreArticles = useCallback(async () => {
    if (!nextArticlePage[sortOption] || nextArticlePage[sortOption] === currentArticlePage[sortOption] || isFetchingMore.current) {
      return;
    }
    
    isFetchingMore.current = true;
    const res = await fetchAPI(nextArticlePage[sortOption], { method: 'GET', token: true });
    if (!res.error) {
      useArticlesStore.getState().setFeed(route.name, sortOption, [...feedArticles, ...(res.data?.results?.articles || [])]);
      useArticlesStore.getState().setNextArticlePage(route.name, sortOption, res.data?.next || null);
    } else {
      Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading more' });
    }
    isFetchingMore.current = false;
  }, [nextArticlePage[sortOption]]);

  const connectGoogle = async () => {
    const GOOGLE_LINK_CALLBACK_URL = AuthSession.makeRedirectUri();
    try {

      // Get temp session ID from the API server
      const response = await fetchAPI(URLs.TEMP_STATE, {
        method: 'GET',
        token: true,
      });

      if (response.error) {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
        return;
      }

      // Generate a code verifier and challenge for PKCE
      const request = new AuthSession.AuthRequest({
        clientId: URLs.GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'], 
        redirectUri: GOOGLE_LINK_CALLBACK_URL,
        responseType: 'code',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
          state: response.data.state,
        },
      });

      // Send to Oauth
      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { code, state } = result.params;

        // Send back the response to API server
        const response = await fetchAPI(
          URLs.GOOGLE_LINK_URL, {
          method: 'POST',
          token: true,
          body: { code, state, code_verifier: request.codeVerifier }
        });

        if (response.error) {
          Toast.show({
            type: 'success',
            text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
          });
          return;
        }

      } else {
        console.log("Google sign-in cancelled or failed:", result);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    titleContainer: {
      gap: 20,
      margin: 15,
      backgroundColor: "transparent",
    },
    credibilityScoreContainer: {
      gap: 10,
      backgroundColor: "transparent",
    },
    csRowContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-end',
      margin: 15,
      backgroundColor: "transparent",
    },
    summaryContainer: {
      gap: 10,
      backgroundColor: "transparent",
    },
    rowsContainer: {
      gap: 10,
      margin: 15,
      backgroundColor: "transparent",
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: "transparent",
    },
    buttonContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      // justifyContent: 'space-between',
      padding: 3,
      borderRadius: 50,
      backgroundColor: default_card_background_color,
      marginHorizontal: 15,
      
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
    },
    feedContainer: {
      alignItems: 'stretch',
      gap: 20,
    },
  });

  const renderHeader = () => (
    <>
          <ImageBackground
            source={require("../../assets/images/indexBg.png")}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          >
          </ImageBackground>
      <ThemedView style={styles.titleContainer}>
        <ThemedView style={styles.credibilityScoreContainer}>
          <ThemedText type={'contentTitle'}>Credibility Score</ThemedText>
          <ThemedView style={styles.csRowContainer}>
            <ThemedText type={'summaryPoints'}>{initialData?.points}</ThemedText>
            <ThemedText type={'contentSubTitle'}>Points</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.summaryContainer}>
          <ThemedText type={'contentTitle'}>Account Summary</ThemedText>
          <ThemedView style={styles.rowsContainer}>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'contentSubTitle'}>University</ThemedText>
              <ThemedText type={'articleBody'}>{initialData?.university}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'contentSubTitle'}>Student Email</ThemedText>
              <ThemedText type={'articleBody'}>{initialData?.email}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'contentSubTitle'}>Google Account</ThemedText>
              <ThemedText type={'articleBody'} onPress={connectGoogle} >(PLACE HOLDER)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'contentSubTitle'}>Update Password</ThemedText>
              <ThemedText onPress={() => router.push(`/newPassword`)} type={'articleBody'}>(Click for Update)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.rowContainer}>
              <ThemedText type={'contentSubTitle'}>Logout</ThemedText>
              <ThemedText onPress={() => router.push(`/`)} type={'articleBody'}>(Click for Update)</ThemedText>
              
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          type={sortOption === 'posted' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('posted')}
        >
          <ThemedText type={sortOption === 'posted' ? 'feedChecked' : 'feedUnchecked'} >Posted</ThemedText>
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'saved' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('saved')}
        >
          <ThemedText type={sortOption === 'saved' ? 'feedChecked' : 'feedUnchecked'} >Saved</ThemedText>
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'commented' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('commented')}
        >
          <ThemedText type={sortOption === 'commented' ? 'feedChecked' : 'feedUnchecked'} >Commented</ThemedText>
        </ThemedButton>
        <ThemedButton
          type={sortOption === 'liked' ? 'feedChecked' : 'feedUnchecked'}
          onPress={() => setSortOption('liked')}
        >
          <ThemedText type={sortOption === 'liked' ? 'feedChecked' : 'feedUnchecked'} >Liked</ThemedText>
        </ThemedButton>
      </ThemedView>
    </>
  );
  return (
    <ThemedView style={styles.container}>
      {loading ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            data={feedArticles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ThemedArticle initialData={initialData} articleData={item} />}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<ThemedText type='contentPlaceholder'>No articles found.</ThemedText>}
            ListHeaderComponent={renderHeader}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              fetchMoreArticles();
            }}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
}

