
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  Pressable,
  ImageBackground,
  View,
  Animated,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ArticleType, InitialDataType } from '@/constants/types';
import URLs from "@/constants/Urls";
import { fetchAPI, getData, setData } from "@/components/Utils";
import ThemedArticle from '@/components/ThemedArticle';
import ThemedButton from '@/components/ThemedButton';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedTag from '@/components/ThemedTag';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useArticlesStore } from '@/store/articleStore';
import { useRoute } from '@react-navigation/native';

const apiEndpoints = {
  all: URLs.TIME_SORTED_ARTICLES,
  hot: URLs.HOT_SORTED_ARTICLES,
  recommend: URLs.PREFERENCE_SORTED_ARTICLES,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  titleContainer: {
    marginTop: 15,
    marginHorizontal: 15,
    backgroundColor: "transparent",
  },
  titleHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "transparent",
  },
  titleContentContainer: {
    marginHorizontal: 15,
    marginVertical: 30,
    backgroundColor: "transparent",
  },
  trendingTagsContainers: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: "transparent",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortingButtons: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 10,
    padding: 3,
    borderRadius: 50,
    boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(10px)',
    elevation: 10,
  },
  feedContainer: {
    alignItems: 'stretch',
    gap: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default function HomePage() {
  const defaultCardBg = useThemeColor({}, 'default_card_background_color');
  const route = useRoute();
  
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [initialData, setInitialData] = useState<InitialDataType | null>(null);  
  const [tags, setTags] = useState<string[]>([]);
  const [uniOnly, setUniOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isFetchingMore = useRef(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const lastResetPage = useArticlesStore(s => s.lastResetPage);
  const feedIds = useArticlesStore(s => s.feeds[route.name]) || {};
  const articlesById = useArticlesStore(s => s.articlesById) || {};
  const feedArticles = (feedIds[sortOption] ?? []).map(id => articlesById[id]) || [];
  const nextArticlePage = useArticlesStore(s => s.nextArticlePage[route.name]) || {};
  const currentArticlePage = useArticlesStore(s => s.currentArticlePage[route.name]) || {};

  // FETCH ONCE: initial data & tags
  useEffect(() => {
    setLoading(true);
    (async () => {
      const stored = await getData('initialData');
      if (stored) setInitialData(JSON.parse(stored));
    })();

    (async () => {
      const res = await fetchAPI(URLs.TRENDING_TAGS, { method: 'GET', token: true });
      if (!res.error) {
        const allTags = Array.isArray(res.data?.tags) ? res.data.tags : [];
        setTags(allTags.slice(0, 3));
        setData('trending_tags', allTags);
      } else {
        Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading tags' });
      }
      
    })();
    fetchArticles();
    setLoading(false);
  }, []);

  // Fetch again when the page is reset
  useEffect(() => {
    if (lastResetPage && lastResetPage === route.name) {
      fetchArticles();

    }
  },[lastResetPage]);

  // Fetch articles when sortOption changes
  useEffect(() => {
    if (!feedIds[sortOption] || feedIds[sortOption].length === 0) {
      fetchArticles();
    }
  }, [sortOption]);

  // Animate content opacity based on loading state
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
  }, [loading, contentOpacity]);

  // FETCH ARTICLES on mount & sortOption change
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

  const renderHeader = useCallback(() => (
    <>
      <ImageBackground
        source={require("../../assets/images/indexBg.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <ThemedView style={styles.titleContainer}>
        <ThemedView style={styles.titleHeaderContainer}>
          <ThemedText type='contentTitle'>UNI.CON</ThemedText>
          <Pressable onPress={() => router.push('/notification')}>
            <Ionicons name='notifications-outline' size={25} />
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.titleContentContainer}>
          <ThemedText type='university' style={{ marginBottom: 15 }}>
            {initialData?.university}
          </ThemedText>
          <ThemedText type='contentSubTitle' style={{ marginBottom: 5 }}>
            Currently, they are chatting about..
          </ThemedText>
          <ThemedView style={styles.trendingTagsContainers}>
            {tags.map((tag, i) => (
              <Pressable key={i}>
                <ThemedTag text={tag} type='bigRanked' />
              </Pressable>
            ))}
          </ThemedView>
        </ThemedView>
        <View style={styles.buttonContainer}>
          <ThemedView style={[styles.sortingButtons, { backgroundColor: defaultCardBg }]}>
            {(['all','hot','recommend'] as const).map(opt => (
              <ThemedButton
                key={opt}
                type={sortOption === opt ? 'feedChecked' : 'feedUnchecked'}
                onPress={() => setSortOption(opt)}
              >
                <ThemedText type={sortOption === opt ? 'feedChecked' : 'feedUnchecked'}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </ThemedText>
              </ThemedButton>
            ))}
          </ThemedView>
          <ThemedButton
            type={uniOnly ? 'elevatedToggled' : 'elevatedUnToggled'}
            onPress={() => setUniOnly(!uniOnly)}
          >
            <ThemedText type={uniOnly ? 'feedChecked' : 'feedUnchecked'}>{initialData?.initial.toUpperCase()+' only'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedView>
    </>
  ), [initialData, tags, sortOption, defaultCardBg, uniOnly]);

  const renderItem = useCallback(
    ({ item }: { item: ArticleType }) => (
      <ThemedArticle trendingTags={tags} initialData={initialData} articleData={item} />
    ),
    [initialData, articlesById]
  );
  return (
    <ThemedView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <FlatList
          data={
            uniOnly
              ? feedArticles.filter(a => a.unicon === true)
              : feedArticles
          }
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<ThemedText>No articles found.</ThemedText>}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={fetchMoreArticles}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </Animated.View>
    </ThemedView>
  );
}