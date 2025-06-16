import React, { useState, useEffect, useRef, memo } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  ActivityIndicator,
  Animated,
  Pressable,
} from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { ArticleType, InitialDataType } from '@/constants/types';
import URLs from '@/constants/Urls';
import { fetchAPI, getData } from '@/components/Utils';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedTag from '@/components/ThemedTag';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import ThemedInput from '@/components/ThemedInput';

// Memoized Tag header
const TagHeader = memo<{
  tags: string[];
  selectedTag?: string;
  onTagPress: (tag: string) => void;
}>(function TagHeader({ tags, selectedTag, onTagPress }) {
  return (
    <View style={styles.tagsRow}>
      {tags.map((t) => (
        <Pressable key={t} onPress={() => onTagPress(t)}>
          <ThemedTag searchPage = {true}text={t} type={selectedTag && selectedTag == t ? 'selectedRanked' : 'ranked'} />
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
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [initialData, setInitialData] = useState<InitialDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const fetchedPage = useRef<string | null>(null);

  const [searchContent, setSearchContent] = useState('');
  const [searchTag, setSearchTag] = useState<string | undefined>(route.params?.tag || undefined);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
    fetchTrendingTags();
    fetchArticles();
  }, []);

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: loading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [loading]);


  useEffect(() => {
    searchContent.length == 0 && fetchArticles();
  },[searchTag]);

  useEffect(() => {
    setSearchTag(route.params?.tag);
  },[route.params?.tag]);
  

  const fetchInitialData = async () => {
    const stored = await getData('initialData');
    if (stored) setInitialData(JSON.parse(stored));
  };

  const fetchTrendingTags = async () => {
    setLoading(true);
    const resp = await fetchAPI(URLs.TRENDING_TAGS, { method: 'GET', token: true });
    if (!resp.error) setTags(resp.data.tags || []);
    else Toast.show({ type: 'error', text1: resp.data.detail || 'Error' });
    setLoading(false);
  };

  const fetchArticles = async () => {
    setLoading(true);
    let url = '';
    if (searchContent.length > 0) {
      url = URLs.SEARCHING_ARTICLE(searchContent);
    } else if (searchTag) {
      url = URLs.SEARCHING_TAG(searchTag);
    } else {
      url = URLs.HOT_SORTED_ARTICLES;
    }    

    const resp = await fetchAPI(url, { method: 'GET', token: true });
    if (!resp.error) {
      setArticles(resp.data.results.articles || []);
      setNextPage(resp.data.next || null);
    } else {
      Toast.show({ type: 'error', text1: resp.data.detail || 'Error' });
    }
    setLoading(false);
    fetchedPage.current = null;
  };

  const fetchMore = async () => {
    if (!nextPage || fetchedPage.current === nextPage) return;
    const resp = await fetchAPI(nextPage, { method: 'GET', token: true });
    if (!resp.error) {
      setArticles((prev) => [...prev, ...resp.data.results.articles]);
      setNextPage(resp.data.next || null);
      fetchedPage.current = nextPage;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {loading && articles.length === 0 ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            data={
              searchTag
                ? articles.filter(a =>
                    Array.isArray(a.tag)
                      ? (a.tag as string[]).includes(searchTag)
                      : true
                  )
                : articles
            }
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ThemedArticle initialData={initialData} articleData={item} />
            )}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            onEndReached={fetchMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <>
                <ThemedView style={styles.headerContainer}>
                  <ThemedView style={styles.searchContainers}>
                    <SearchHeader
                      value={searchContent}
                      onChange={setSearchContent}
                      onSubmit={() => {
                        setSearchTag(undefined);
                        fetchArticles();
                      }}
                    />
                  </ThemedView>
                  <ThemedText type={'contentTitle'}>Tags</ThemedText>
                  <ThemedView style={styles.trendingTagsContainers}>
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
                  </ThemedView>
                </ThemedView>
              </>
            }
          />
        </Animated.View>
      )}
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
  },
  trendingTagsContainers:{
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: "transparent",
    marginHorizontal:15,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    height: 50,
    borderRadius: 50,
    backgroundColor: "#fff",
  },
  feedContainer: {
    alignItems: 'stretch',
    gap: 20,
    paddingVertical: 15,
  },
});