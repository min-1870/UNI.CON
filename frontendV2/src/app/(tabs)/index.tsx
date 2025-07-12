
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
import ThemedShimmer from '@/components/ThemedShimmer';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useArticlesStore } from '@/store/articleStore';
import { useRoute } from '@react-navigation/native';
import { useToast } from '@/contexts/ToastContext';


const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ArticleType>);

const Header = React.memo(function Header({
  initialData,
  tags,
  DEFAULT_CARD_BACKGROUND,
  BACKGROUND_GRADIENT_START,
  DEFAULT_TEXT,
  uniOnly,
  sortOption,
  setSortOption,
  setUniOnly,
  scrollY,
}: {
  initialData: InitialDataType | null;
  tags: string[];
  DEFAULT_CARD_BACKGROUND: string;
  BACKGROUND_GRADIENT_START: string;
  DEFAULT_TEXT: string;
  uniOnly: boolean;
  sortOption: keyof typeof apiEndpoints;
  setSortOption: (o: keyof typeof apiEndpoints) => void;
  setUniOnly: (u: boolean) => void;
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
    <View style={styles.titleContainer}>
      <View style={styles.titleHeaderContainer}>
        <ThemedText size='h3' font='displayBold'>UNI.CON</ThemedText>
        <Pressable onPress={() => router.push('/notification')}>
          <Ionicons name='notifications-outline' size={25} color={DEFAULT_TEXT}/>
        </Pressable>
      </View>
      <View style={styles.titleContentContainer}>
        <ThemedText size='h1' font='displayBold' style={{ marginBottom: 15 }}>
          {initialData?.university}
        </ThemedText>
        <ThemedText size='bigger' font='textMedium' style={{ marginBottom: 5 }}>
          Currently, they are chatting about..
        </ThemedText>
        <View style={styles.trendingTagsContainers}>
          {tags.map((tag, i) => (
            <Pressable key={i}>
              <ThemedTag text={tag} type='bigRanked' />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <View style={[styles.sortingButtons, { backgroundColor: DEFAULT_CARD_BACKGROUND }]}>
          {(['all','hot','recommend'] as const).map(opt => (
            <ThemedButton
              key={opt}
              type={sortOption === opt ? 'feedChecked' : 'feedUnchecked'}
              onPress={() => setSortOption(opt)}
            >
              <ThemedText size='smaller' color={sortOption === opt ? 'black' : 'gray'} font='textMedium'>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>
        <ThemedButton
          type={uniOnly ? 'elevatedToggled' : 'elevatedUnToggled'}
          onPress={() => setUniOnly(!uniOnly)}
        >
          <ThemedText size='smaller' color={uniOnly ? 'black' : 'gray' } font='textMedium'>{initialData?.initial.toUpperCase()+' only'}</ThemedText>
        </ThemedButton>
      </View>
    </View>
  </>
  );
}, (prev, next) => {
  return (
    prev.initialData === next.initialData &&
    prev.tags === next.tags &&
    prev.uniOnly === next.uniOnly &&
    prev.sortOption === next.sortOption &&
    prev.DEFAULT_CARD_BACKGROUND === next.DEFAULT_CARD_BACKGROUND
    
  );
});

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
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  titleContainer: {
    marginTop: 15,
    marginHorizontal: 15,
    backgroundColor: "transparent",
    marginBottom: 10,
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
    marginBottom: 100,
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
  const { showToast } = useToast();
  
  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const BACKGROUND_GRADIENT_START = useThemeColor({}, 'BACKGROUND_GRADIENT_START');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const route = useRoute();
  
  const [sortOption, setSortOption] = useState<keyof typeof apiEndpoints>("all");
  const [initialData, setInitialData] = useState<InitialDataType | null>(null);  
  const [tags, setTags] = useState<string[]>([]);
  const [uniOnly, setUniOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isFetchingMore = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

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
        showToast({ type: 'error', text1: res.data?.detail || 'Error loading tags' });
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

  // FETCH ARTICLES on mount & sortOption change
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    // await new Promise(resolve => setTimeout(resolve, 5000));
    if (feedIds && (feedIds[sortOption]||[]).length > 0) {
      return;
    }
    const res = await fetchAPI(apiEndpoints[sortOption], { method: 'GET', token: true });
    if (!res.error) {
      useArticlesStore.getState().setFeed(route.name, sortOption, res.data?.results?.articles || []);
      useArticlesStore.getState().setNextArticlePage(route.name, sortOption, res.data?.next || null);
    } else {
      showToast({ type: 'error', text1: res.data?.detail || 'Error loading articles' });
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
      showToast({ type: 'error', text1: res.data?.detail || 'Error loading more' });
    }
    isFetchingMore.current = false;
  }, [nextArticlePage[sortOption]]);

  const renderItem = useCallback(
    ({ item }: { item: ArticleType }) => (
      <ThemedArticle trendingTags={tags} initialData={initialData} articleData={item} />
    ),
    [initialData, articlesById]
  );
  return (
    <ThemedView style={styles.container}>
      <AnimatedFlatList
        data={
          uniOnly
            ? feedArticles.filter(a => a.unicon === false)
            : feedArticles
        }
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        extraData={[DEFAULT_CARD_BACKGROUND]}
        ListHeaderComponent={
          <Header
            initialData={initialData}
            tags={tags}
            DEFAULT_CARD_BACKGROUND={DEFAULT_CARD_BACKGROUND}
            DEFAULT_TEXT={DEFAULT_TEXT}
            uniOnly={uniOnly}
            sortOption={sortOption}
            setSortOption={setSortOption}
            setUniOnly={setUniOnly}
            scrollY={scrollY}
            BACKGROUND_GRADIENT_START={BACKGROUND_GRADIENT_START}
          />
        }
        ListEmptyComponent={loading ? (
          <>
            {[...Array(5)].map((_, idx) => (
              <ThemedShimmer idx={idx} type='article'></ThemedShimmer>
            ))}
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 200 }}>
            <ThemedText size='h3' font='textMedium' color="gray">No articles found.</ThemedText>
          </View>
        )}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={fetchMoreArticles}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </ThemedView>
  );
}