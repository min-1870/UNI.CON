import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Pressable,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useArticlesStore } from '@/store/articleStore';
import { ArticleType, InitialDataType } from '@/constants/types';
import URLs from '@/constants/Urls';
import { fetchAPI, getData } from '@/components/Utils';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedTag from '@/components/ThemedTag';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import ThemedInput from '@/components/ThemedInput';
import ThemedShimmer from '@/components/ThemedShimmer';
import { router } from "expo-router";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const TagHeader = memo<{
  tags: string[];
  selectedTag?: string;
  onTagPress: (tag: string) => void;
}>(function TagHeader({ tags, selectedTag, onTagPress }) {
  return (
    <View style={styles.tagsRow}>
      {tags.map((t) => (
        <Pressable key={t} onPress={() => onTagPress(t)}>
          <ThemedTag text={t} unClickable={true} type={selectedTag && selectedTag == t ? 'selectedRanked' : 'ranked'} />
        </Pressable>
      ))}
    </View>
  );
});

// Memoized Search input header
const SearchHeader = memo<{
  value: string;
  onChange: (t: string) => void;
  onSubmit: () => void;
}>(function SearchHeader({ value, onChange, onSubmit }) {
  return (
    <ThemedInput
      type="search"
      placeholder="Search…"
      value={value}
      onChangeText={onChange}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
    />
  );
});

type SearchRoute = RouteProp<{ Search: { tag?: string } }, "Search">;

export default function SearchPage() {
  const route = useRoute<SearchRoute>();
  const isFetchingMore = useRef(false);
  
  const [searchTag, setSearchTag] = useState<string | undefined>(route.params?.tag || undefined);
  const [initialData, setInitialData] = useState<InitialDataType | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [searchContent, setSearchContent] = useState('');
  const [sortOption, setSortOption] = useState('hot');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);  
    
    
  const lastResetPage = useArticlesStore(s => s.lastResetPage);
  const feedIds = useArticlesStore(s => s.feeds[route.name]) || {};
  const articlesById = useArticlesStore(s => s.articlesById) || {};
  const feedArticles = (feedIds[sortOption] ?? []).map(id => articlesById[id]) || [];
  const nextArticlePage = useArticlesStore(s => s.nextArticlePage[route.name]) || {};
  const currentArticlePage = useArticlesStore(s => s.currentArticlePage[route.name]) || {};

  useEffect(() => {
    if (lastResetPage && lastResetPage === route.name) {
      fetchArticles();
    }
  },[lastResetPage]);

  useEffect(() => {  
    if (searchContent.length > 0 && searched) { 
      setSearched(false);
      setSortOption(searchContent);
      setSearchTag(undefined);
    }else if (searchContent.length == 0 && searched) {
      setSearched(false);
      setSortOption(searchTag || 'hot');
    }
  },[searched]);
  
  useEffect(() => {
    if (searchContent.length == 0 && searchTag) { 
      setSortOption(searchTag);
    }else if (searchContent.length == 0 && !searchTag) {
      setSortOption('hot');
    }
  },[searchTag]);

  useEffect(() => {
    fetchArticles();
  },[sortOption])
    
  useEffect(() => {
    if (route.params?.tag) {
      setSearchContent('');
      setSearchTag(route.params?.tag);
      router.push({
        pathname: '/(tabs)/search',
      });
    }
  },[searchTag, route.params?.tag]);

  useEffect(() => {
    (async () => {
      const stored = await getData('initialData');
      if (stored) setInitialData(JSON.parse(stored));
    })();

    (async () => {
      setLoading(true);
      const res = await fetchAPI(URLs.TRENDING_TAGS, { method: 'GET', token: true });
      if (!res.error) {
        const allTags = Array.isArray(res.data?.tags) ? res.data.tags : [];
        setTags(allTags);
      } else {
        Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading tags' });
      }
      setLoading(false);
    })();
  }, []);
  
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    if (feedIds && (feedIds[sortOption]||[]).length > 0) {
      return;      
    }
    let url = '';
    if (searchContent.length > 0) {
      url = URLs.SEARCHING_ARTICLE(searchContent);
    } else if (searchTag) {
      url = URLs.SEARCHING_TAG(searchTag);
    } else {
      url = URLs.HOT_SORTED_ARTICLES;
    } 
    const res = await fetchAPI(url, { method: 'GET', token: true });
    if (!res.error) {      
      useArticlesStore.getState().setFeed(route.name, sortOption, res.data?.results?.articles || []);
      useArticlesStore.getState().setNextArticlePage(route.name, sortOption, res.data?.next || null);
    } else {
      Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading articles' });
    }
    setLoading(false);
  }, [searchContent, searchTag, sortOption, lastResetPage]);


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

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={
          searchTag
            ? feedArticles.filter(a =>
                Array.isArray(a.tag)
                  ? (a.tag as string[]).includes(searchTag)
                  : true
              )
            : feedArticles
        }
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ThemedArticle initialData={initialData} articleData={item} />
        )}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        onEndReached={fetchMoreArticles}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={loading ? (
          <>
            {[...Array(5)].map((_, idx) => (
              <ThemedShimmer idx={idx} ></ThemedShimmer>
            ))}
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 200 }}>
            <ThemedText type="contentPlaceholder">No articles found.</ThemedText>
          </View>
        )}
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <View style={styles.searchContainers}>
                <ThemedText type="contentTitle">Search</ThemedText>
                <SearchHeader
                  value={searchContent}
                  onChange={setSearchContent}
                  onSubmit={() => {
                    setSearchTag(undefined);     
                    setSearched(true);
                  }}
                />
              </View>
              <ThemedText type={'contentTitle'}>Tags</ThemedText>
              <View style={styles.trendingTagsContainers}>
                <TagHeader
                  tags={tags}
                  selectedTag={searchTag}
                  onTagPress={(tag) => {
                    if (searchTag === tag) {
                      setSearchTag(undefined);
                    }
                    else {
                      setSearchTag(tag);
                    }
                  }}
                />
              </View>
            </View>
          </>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { 
    marginHorizontal: 15,
    gap: 10,
  },
  searchContainers:{
    gap: 10,
  },
  trendingTagsContainers:{
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: "transparent",
    marginHorizontal:15,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feedContainer: {
    alignItems: 'stretch',
    gap: 20,
    paddingVertical: 15,
  },
});
