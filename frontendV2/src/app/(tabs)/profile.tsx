import { ArticleType, InitialDataType } from '@/constants/types';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useArticlesStore } from '@/store/articleStore';
import ThemedArticle from '@/components/ThemedArticle';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData, removeData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import { Animated, StyleSheet, FlatList, View, Pressable } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedTag from '@/components/ThemedTag';
import ThemedShimmer from '@/components/ThemedShimmer';
import * as AuthSession from 'expo-auth-session';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import URLs from "@/constants/Urls";
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'

import OverflowMenu from '@/components/ThemedOverflowMenu';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ArticleType>);

const Header = React.memo(function Header({
  initialData,
  tags,
  DEFAULT_CARD_BACKGROUND,
  BACKGROUND_GRADIENT_START,
  DEFAULT_TEXT,
  sortOption,
  setSortOption,
  connectGoogle,
  logout,
  setUniOnly,
  scrollY,
}: {
  initialData: InitialDataType | null;
  tags: string[];
  DEFAULT_CARD_BACKGROUND: string;
  BACKGROUND_GRADIENT_START: string;
  DEFAULT_TEXT: string;
  uniOnly?: boolean;
  sortOption: keyof typeof apiEndpoints;
  setSortOption: (o: keyof typeof apiEndpoints) => void;
  connectGoogle: () => Promise<void>;
  logout: () => void;
  setUniOnly?: (u: boolean) => void;
  scrollY: Animated.Value;
}) {
    
  // parallax the gradient up by 50% of scroll:
  const translateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });
return (
    <>
      <Animated.View
        style={[
          styles.gradient,
          { transform: [{ translateY }] }
        ]}
      >
        <LinearGradient
          colors={[BACKGROUND_GRADIENT_START,  'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>    
      <View style={styles.nheaderContainer}>
        <View style={styles.nheaderHeaderContainer}>
          <ThemedText type='contentTitle'>UNI.CON</ThemedText>
            <Pressable onPress={logout}>
              <Feather
              name="log-out"
              size={20}
              color={DEFAULT_TEXT}
              />
            </Pressable>
        </View>
        <View style={styles.nheaderContentContainer}>
          
          <View style={styles.nheaderScoreContainer}>
            <ThemedText type={'university'}>Credibility Score</ThemedText>
            <View style={styles.nheaderScoreScoreContainer}>
              <ThemedText type={'summaryPoints'}>{initialData?.points}</ThemedText>
              <ThemedText type={'default'}>Points</ThemedText>
            </View>
          </View>
          <View style={styles.nheaderAccountContainer}>
            <ThemedText type={'contentSubTitle'}>Account Summary</ThemedText>
            <View style={styles.nheaderAccountTagsContainer}>
              {tags.map((tag, i) => (
                <ThemedTag key={i} unClickable={true} text={tag} type='bigRanked' />
              ))}
            </View>
          </View>
          <View style={styles.nheaderAccountContainer}>
            <Pressable onPress={connectGoogle} style={styles.settingButton}>
              <ThemedText type={'default'}>Connect Google</ThemedText>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color="#000" />
            </Pressable>
            <Pressable onPress={()=>router.navigate('/newPassword')} style={styles.settingButton}>
              <ThemedText type={'default'}>Update Password</ThemedText>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color="#000" />
            </Pressable>            
          </View>
        </View>
      </View>
      <View style={[styles.buttonContainer, { backgroundColor: DEFAULT_CARD_BACKGROUND }]}>
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
      </View>
    </>
  );
}, (prev, next) => {
  return (
    prev.initialData === next.initialData &&
    prev.tags === next.tags &&
    prev.uniOnly === next.uniOnly &&
    prev.sortOption === next.sortOption
  );
});

  const apiEndpoints = {
    posted: URLs.POSTED_ARTICLES,
    saved: URLs.SAVED_ARTICLES,
    commented: URLs.COMMENTED_ARTICLES,
    liked: URLs.LIKED_ARTICLES,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 500,
    },
    nheaderContainer:{
      margin: 15,
    },
    nheaderHeaderContainer:{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: "transparent",
    },
    nheaderContentContainer:{
      padding: 20,
      gap: 30,
    },
    nheaderScoreContainer: {
      gap: 10,
    },
    nheaderScoreScoreContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-end',
    },
    nheaderAccountContainer: {
      gap: 10,
    },
    nheaderAccountTagsContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      flexWrap: 'wrap',
      gap: 10,
      backgroundColor: "transparent",
    },
    settingButton:{
      display:'flex',
      flexDirection:'row',
      gap:5,
      alignItems:'center'
    },
    buttonContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      marginBottom: 10,
      padding: 3,
      borderRadius: 50,
      marginHorizontal: 15,
      
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
    },
    feedContainer: {
      alignItems: 'stretch',
    },
  });
export default function ProfilePage() {
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("posted");
  const [initialData, setInitialData] = useState<InitialDataType|null>(null);
  const [loading, setLoading] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const isFetchingMore = useRef(false);
  const route = useRoute();
  const router = useRouter()
  
  const lastResetPage = useArticlesStore(s => s.lastResetPage);
  const feedIds = useArticlesStore(s => s.feeds[route.name]) || {};
  const articlesById = useArticlesStore(s => s.articlesById) || {};
  const feedArticles = (feedIds[sortOption] ?? []).map(id => articlesById[id]) || [];
  const nextArticlePage = useArticlesStore(s => s.nextArticlePage[route.name]) || {};
  const currentArticlePage = useArticlesStore(s => s.currentArticlePage[route.name]) || {};

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const BACKGROUND_GRADIENT_START = useThemeColor({}, 'BACKGROUND_GRADIENT_START');

  const discovery = {
    authorizationEndpoint: URLs.authorizationEndpoint,
    tokenEndpoint: URLs.tokenEndpoint,
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

  const fetchArticles = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
  }, [sortOption, lastResetPage]);

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


  const handleLogout = () => {
    removeData();
    useArticlesStore.getState().clear();
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully',
    });
    router.replace('/login');
  }

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

  return (
    <ThemedView style={styles.container}>        
      <AnimatedFlatList
        data={feedArticles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ThemedArticle initialData={initialData} articleData={item} />}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <>
            {[...Array(5)].map((_, idx) => (
              <ThemedShimmer key={idx} type="article"/>
            ))}
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 200 }}>
            <ThemedText type="contentPlaceholder">No articles found.</ThemedText>
          </View>
        )}
        ListHeaderComponent={<Header
          initialData={initialData}
          tags={[initialData?.university, initialData?.email].filter((tag): tag is string => typeof tag === 'string')}
          DEFAULT_CARD_BACKGROUND={DEFAULT_CARD_BACKGROUND}
          DEFAULT_TEXT={useThemeColor({}, 'DEFAULT_TEXT')}
          uniOnly={false}
          sortOption={sortOption}
          setSortOption={setSortOption}
          setUniOnly={() => {}}
          logout={handleLogout}
          scrollY={scrollY}
          BACKGROUND_GRADIENT_START={BACKGROUND_GRADIENT_START}
          connectGoogle={connectGoogle}
        />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          fetchMoreArticles();
        }}
      />
    </ThemedView>
  );
}

