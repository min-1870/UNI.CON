import React, { useState, useEffect, useRef, memo, useCallback } from "react";
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
import { useArticlesStore } from '@/store/articleStore';
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
  const isFetchingMore = useRef(false);
  const searched = useRef(true);
  const [searchContent, setSearchContent] = useState('');
  const [sortOption, setSortOption] = useState('hot');
  const [searchTag, setSearchTag] = useState<string | undefined>(route.params?.tag || undefined);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (searched.current) {
      const so = searchContent.length > 0
        ? searchContent
        : searchTag
        ? searchTag
        : 'hot'
      setSortOption(so);
      if (!feedIds[so] || feedIds[so].length === 0) {
        fetchArticles();
      }
      searched.current = false;
    } 
    
    console.log(searched.current, searchContent, searchTag, searchContent.length > 0
        ? searchContent
        : searchTag
        ? searchTag
        : 'hot');
  },[searchTag, setSearchContent]);
  const feedIds = useArticlesStore(s => s.feeds) || {};
  const articlesById = useArticlesStore(s => s.articlesById);
  const feedArticles = (feedIds[sortOption] || []).map(id => articlesById[id]) || [];
  const nextArticlePage = useArticlesStore(s => s.nextArticlePage);
  const currentArticlePage = useArticlesStore(s => s.currentArticlePage);

  // useEffect(() => {    
  //   fetchInitialData();
  //   fetchTrendingTags();
  //   fetchArticles();
  // }, []);

  // FETCH ONCE: initial data & tags
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

  
  
  useEffect(() => {
    if (!feedIds[sortOption] || feedIds[sortOption].length === 0) {
      fetchArticles();
    }
  }, [sortOption]);

  // const fetchArticles = async () => {
  const fetchArticles = useCallback(async () => {
    // setLoading(true);
    console.log(searchContent);
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

    // const resp = await fetchAPI(url, { method: 'GET', token: true });
    // if (!resp.error) {
    //   setArticles(resp.data.results.articles || []);
    //   setNextPage(resp.data.next || null);
    // } else {
    //   Toast.show({ type: 'error', text1: resp.data.detail || 'Error' });
    // }
    const res = await fetchAPI(url, { method: 'GET', token: true });
    if (!res.error) {
      console.log(sortOption);
      
      useArticlesStore.getState().setFeed(sortOption, res.data?.results?.articles || []);
      useArticlesStore.getState().setNextArticlePage(sortOption, res.data?.next || null);
    } else {
      Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading articles' });
    }
    // setLoading(false);
    // fetchedPage.current = null;
  
  }, [sortOption]);

  // const fetchMore = async () => {
  //   if (!nextPage || fetchedPage.current === nextPage) return;
  //   const resp = await fetchAPI(nextPage, { method: 'GET', token: true });
  //   if (!resp.error) {
  //     setArticles((prev) => [...prev, ...resp.data.results.articles]);
  //     setNextPage(resp.data.next || null);
  //     fetchedPage.current = nextPage;
  //   }
  // };
  const fetchMoreArticles = useCallback(async () => {
    if (!nextArticlePage[sortOption] || nextArticlePage[sortOption] === currentArticlePage[sortOption] || isFetchingMore.current) {
      return;
    }
    
    isFetchingMore.current = true;
    const res = await fetchAPI(nextArticlePage[sortOption], { method: 'GET', token: true });
    if (!res.error) {
      useArticlesStore.getState().setFeed(sortOption, [...feedArticles, ...(res.data?.results?.articles || [])]);
      useArticlesStore.getState().setNextArticlePage(sortOption, res.data?.next || null);
    } else {
      Toast.show({ type: 'error', text1: res.data?.detail || 'Error loading more' });
    }
    isFetchingMore.current = false;
  }, [nextArticlePage[sortOption]]);

  return (
    <ThemedView style={styles.container}>
      {loading && articles.length === 0 ? null : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
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
            ListHeaderComponent={
              <>
                <ThemedView style={styles.headerContainer}>
                  <ThemedView style={styles.searchContainers}>
                    <SearchHeader
                      value={searchContent}
                      onChange={setSearchContent}
                      onSubmit={() => {
                        setSearchTag(undefined);
                        // fetchArticles();
                        searched.current = true;
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


















// import React, { useState, useEffect, useRef, memo } from "react";
// import {
//   StyleSheet,
//   FlatList,
//   View,
//   ActivityIndicator,
//   Animated,
//   Pressable,
// } from "react-native";
// import { useRoute, RouteProp } from '@react-navigation/native';
// import Toast from 'react-native-toast-message';
// import { useArticlesStore } from '@/store/articleStore';
// import { ArticleType, InitialDataType } from '@/constants/types';
// import URLs from '@/constants/Urls';
// import { fetchAPI, getData } from '@/components/Utils';
// import ThemedArticle from '@/components/ThemedArticle';
// import ThemedTag from '@/components/ThemedTag';
// import ThemedView from '@/components/ThemedView';
// import ThemedText from '@/components/ThemedText';
// import ThemedInput from '@/components/ThemedInput';

// // Memoized Tag header
// const TagHeader = memo<{
//   tags: string[];
//   selectedTag?: string;
//   onTagPress: (tag: string) => void;
// }>(function TagHeader({ tags, selectedTag, onTagPress }) {
//   return (
//     <View style={styles.tagsRow}>
//       {tags.map((t) => (
//         <Pressable key={t} onPress={() => onTagPress(t)}>
//           <ThemedTag searchPage = {true}text={t} type={selectedTag && selectedTag == t ? 'selectedRanked' : 'ranked'} />
//         </Pressable>
//       ))}
//     </View>
//   );
// });

// // Memoized Search input header
// const SearchHeader = memo<{
//   value: string;
//   onChange: (t: string) => void;
//   onSubmit: () => void;
// }>(function SearchHeader({ value, onChange, onSubmit }) {
//   return (
//     <ThemedInput
//       type="search"
//       placeholder="Search…"
//       value={value}
//       onChangeText={onChange}
//       returnKeyType="search"
//       onSubmitEditing={onSubmit}
//     />
//   );
// });

// type SearchRoute = RouteProp<{ Search: { tag?: string } }, "Search">;

// export default function SearchPage() {
//   const route = useRoute<SearchRoute>();
//   const contentOpacity = useRef(new Animated.Value(0)).current;

//   const [articles, setArticles] = useState<ArticleType[]>([]);
//   const [initialData, setInitialData] = useState<InitialDataType | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [nextPage, setNextPage] = useState<string | null>(null);
//   const fetchedPage = useRef<string | null>(null);

//   const [searchContent, setSearchContent] = useState('');
//   const [searchTag, setSearchTag] = useState<string | undefined>(route.params?.tag || undefined);
//   const [tags, setTags] = useState<string[]>([]);

//   const sortOption = searchContent 
//     ? searchContent
//     : searchTag
//     ? searchTag
//     : 'hot'; // Default to 'hot' if no search or tag is provided
//   const feedIds = useArticlesStore(s => s.feeds) || {};
//   const articlesById = useArticlesStore(s => s.articlesById);
//   const feedArticles = (feedIds[sortOption] || []).map(id => articlesById[id]) || [];
//   const nextArticlePage = useArticlesStore(s => s.nextArticlePage);
//   const currentArticlePage = useArticlesStore(s => s.currentArticlePage);

//   useEffect(() => {    
//     fetchInitialData();
//     fetchTrendingTags();
//     fetchArticles();
//   }, []);

//   useEffect(() => {
//     Animated.timing(contentOpacity, {
//       toValue: loading ? 0 : 1,
//       duration: 250,
//       useNativeDriver: true,
//     }).start();
//   }, [loading]);


//   useEffect(() => {
//     searchContent.length == 0 && fetchArticles();
//   },[searchTag]);

//   useEffect(() => {
//     setSearchTag(route.params?.tag);
//   },[route.params?.tag]);
  

//   const fetchInitialData = async () => {
//     const stored = await getData('initialData');
//     if (stored) setInitialData(JSON.parse(stored));
//   };

//   const fetchTrendingTags = async () => {
//     setLoading(true);
//     const resp = await fetchAPI(URLs.TRENDING_TAGS, { method: 'GET', token: true });
//     if (!resp.error) setTags(resp.data.tags || []);
//     else Toast.show({ type: 'error', text1: resp.data.detail || 'Error' });
//     setLoading(false);
//   };

//   const fetchArticles = async () => {
//     setLoading(true);
//     let url = '';
//     if (searchContent.length > 0) {
//       url = URLs.SEARCHING_ARTICLE(searchContent);
//     } else if (searchTag) {
//       url = URLs.SEARCHING_TAG(searchTag);
//     } else {
//       url = URLs.HOT_SORTED_ARTICLES;
//     }    

//     const resp = await fetchAPI(url, { method: 'GET', token: true });
//     if (!resp.error) {
//       setArticles(resp.data.results.articles || []);
//       setNextPage(resp.data.next || null);
//     } else {
//       Toast.show({ type: 'error', text1: resp.data.detail || 'Error' });
//     }
//     setLoading(false);
//     fetchedPage.current = null;
//   };

//   const fetchMore = async () => {
//     if (!nextPage || fetchedPage.current === nextPage) return;
//     const resp = await fetchAPI(nextPage, { method: 'GET', token: true });
//     if (!resp.error) {
//       setArticles((prev) => [...prev, ...resp.data.results.articles]);
//       setNextPage(resp.data.next || null);
//       fetchedPage.current = nextPage;
//     }
//   };

//   return (
//     <ThemedView style={styles.container}>
//       {loading && articles.length === 0 ? null : (
//         <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
//           <FlatList
//             data={
//               searchTag
//                 ? articles.filter(a =>
//                     Array.isArray(a.tag)
//                       ? (a.tag as string[]).includes(searchTag)
//                       : true
//                   )
//                 : articles
//             }
//             keyExtractor={(item) => String(item.id)}
//             renderItem={({ item }) => (
//               <ThemedArticle initialData={initialData} articleData={item} />
//             )}
//             contentContainerStyle={styles.feedContainer}
//             showsVerticalScrollIndicator={false}
//             scrollEnabled={true}
//             keyboardShouldPersistTaps="handled"
//             onEndReached={fetchMore}
//             onEndReachedThreshold={0.5}
//             ListHeaderComponent={
//               <>
//                 <ThemedView style={styles.headerContainer}>
//                   <ThemedView style={styles.searchContainers}>
//                     <SearchHeader
//                       value={searchContent}
//                       onChange={setSearchContent}
//                       onSubmit={() => {
//                         setSearchTag(undefined);
//                         fetchArticles();
//                       }}
//                     />
//                   </ThemedView>
//                   <ThemedText type={'contentTitle'}>Tags</ThemedText>
//                   <ThemedView style={styles.trendingTagsContainers}>
//                     <TagHeader
//                       tags={tags}
//                       selectedTag={searchTag}
//                       onTagPress={(tag) => {
//                         if (searchTag === tag) {
//                           setSearchTag(undefined);
//                         }
//                         else {
//                           setSearchTag(tag);
//                         }
//                       }}
//                     />
//                   </ThemedView>
//                 </ThemedView>
//               </>
//             }
//           />
//         </Animated.View>
//       )}
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   headerContainer: { 
//     marginHorizontal: 15,
//     gap: 10,
//   },
//   searchContainers:{
//   },
//   trendingTagsContainers:{
//     flexDirection: 'row',
//     alignSelf: 'flex-start',
//     backgroundColor: "transparent",
//     marginHorizontal:15,
//   },
//   tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//   input: {
//     height: 50,
//     borderRadius: 50,
//     backgroundColor: "#fff",
//   },
//   feedContainer: {
//     alignItems: 'stretch',
//     gap: 20,
//     paddingVertical: 15,
//   },
// });