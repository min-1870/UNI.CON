import { StyleSheet, FlatList } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import React, { useState, useEffect, useRef  } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as AuthSession from 'expo-auth-session';

export default function ProfilePage() {
  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("posted");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [university, setUniversity] = useState('');
  const [points, setPoints] = useState('');
  const [email, setEmail] = useState('');
  const fetchedArticlePage = useRef(null);

  const BACKEND_STATE_URL = `${API_URL}/account/user/google_auth_session/`;
  const GOOGLE_LINK_URL = `${API_URL}/account/user/googlelink/`
  const GOOGLE_CLIENT_ID = '654153127818-9aao6il7d5vv3ivdb27nlsa58s7i6knl.apps.googleusercontent.com';
  const GOOGLE_LINK_CALLBACK_URL = AuthSession.makeRedirectUri();
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint:         'https://oauth2.googleapis.com/token',
  };

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

  const connectGoogle = async () => {
    try {

      // Get temp session ID from the API server
      const response = await fetchAPI(BACKEND_STATE_URL, {
        method: 'GET',
        token: true,
      });

      if (response.error) {
        setError(response?.data?.detail || "An error occurred");
        return;
      }

      // Generate a code verifier and challenge for PKCE
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
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
          GOOGLE_LINK_URL, {
          method: 'POST',
          token: true,
          body: { code, state, code_verifier: request.codeVerifier }
        });

        if (response.error) {
          setError(response?.data?.detail || "An error occurred");
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
      marginBottom: 20,
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
      // alignSelf: 'flex-start',
      gap: 20,
      padding: 5,
      borderRadius: 50,
      backgroundColor: default_card_background_color,
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 3 },
      
      shadowRadius: 13,
      shadowOpacity: 0.08,
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
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
              <ThemedText type={'default'} onPress={connectGoogle} >(PLACE HOLDER)</ThemedText>
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

