import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import PostCard from '@/components/PostCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchAPI, getData } from '@/components/Utils';
import URLs from '@/constants/Urls';
import { router, useFocusEffect } from 'expo-router';
import CreatePost from '@/components/CreatePost';
import AppContainer from '@/components/AppContainer';
import BottomNav from '@/components/ui/BottomNav';
import NotificationPanel from '@/components/NotificationPanel';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';


// Create AnimatedFlatList for native scroll events
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const TAGS = ['All', 'School', 'IT'];

interface Article {
  id: number;
  user_temp_name: string;
  created_at: string;
  title: string;
  body: string;
  course_code: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  save_status: boolean;
  user_school: string;
  image?: string;
  like_status: boolean;
  tag?: string;
}

type FilterType = 'All' | 'Hot' | 'Recommended';

export default function Feed() {
  const colorScheme = useColorScheme();

  const containerBackground = colorScheme === 'dark' ? '#101214' : '#FFFFFF';
  const headerBackground = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const stickyHeaderBackground = colorScheme === 'dark' ? 'rgba(31,41,55,0.5)' : '#FFFFFF';
  const headerTitleColor = colorScheme === 'dark' ? '#FFFFFF' : '#222';
  const searchFilterColor = colorScheme === 'dark' ? '#1F2937' : '#222';
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const fetchedPage = useRef<string | null>(null);
  const flatListRef = useRef<any>(null);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  
  // Animation state for navbar
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);
  
  // Sticky header animation state
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderTranslateY = useRef(new Animated.Value(-60)).current;

  const apiEndpoints: Record<FilterType, string> = {
    All: URLs.ARTICLE(),
    Hot: URLs.ARTICLE_HOT,
    Recommended: URLs.ARTICLE_PREFERENCE,
  };

  useEffect(() => {
    fetchArticles();
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [selectedFilter]);

  // Auto-refresh when user returns to feed screen
  useFocusEffect(
    useCallback(() => {
      // Refresh articles when returning to feed to show updated likes/comments
      handleRefresh();
    }, [])
  );

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = apiEndpoints[selectedFilter];
      console.log(`🔍 Fetching ${selectedFilter} articles from:`, endpoint);
      
      const response = await fetchAPI(endpoint, {
        method: 'GET',
        token: true,
      });

      console.log(`📊 ${selectedFilter} API Response:`, response);

      if (!response.error) {
        const articles = response.data?.results?.articles || response.data?.articles || [];
        console.log(`📝 ${selectedFilter} Articles found:`, articles.length);
        
        setArticles(articles);
        setNextPage(response.data?.next || null);
        fetchedPage.current = endpoint;
      } else {
        console.error(`❌ ${selectedFilter} API Error:`, response);
        setError(response?.data?.detail || "An error occurred");
      }
    } catch (err) {
      console.error(`💥 ${selectedFilter} Network Error:`, err);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetchAPI(apiEndpoints[selectedFilter], {
        method: 'GET',
        token: true,
      });

      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
        setNextPage(response.data?.next || null);
        fetchedPage.current = apiEndpoints[selectedFilter];
        setError(null);
      } else {
        setError(response?.data?.detail || "An error occurred");
      }
    } catch (err) {
      setError("Failed to refresh articles");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchMoreArticles = async () => {
    if (!nextPage || nextPage === fetchedPage.current) return;
    
    try {
      const response = await fetchAPI(nextPage, {
        method: 'GET',
        token: true,
      });

      if (!response.error) {
        setArticles(prevArticles => [
          ...prevArticles,
          ...(response.data?.results?.articles || []),
        ]);
        fetchedPage.current = nextPage;
        setNextPage(response.data?.next || null);
      } else {
        setError(response?.data?.detail || "An error occurred");
      }
    } catch (err) {
      setError("Failed to load more articles");
    }
  };

  const filteredArticles = articles.filter(post => {
    const matchesTag = selectedTag === 'All' || (post.course_code && post.course_code.toLowerCase().includes(selectedTag.toLowerCase()));
    const matchesSearch =
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.body.toLowerCase().includes(searchText.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const FILTERS: FilterType[] = ['All', 'Hot', 'Recommended'];

  const handleCreatePost = async ({ title, content, hashtags, images, unicon }: { title: string; content: string; hashtags: string[]; images: string[]; unicon?: boolean }) => {
    setPosting(true);
    try {
      const accessToken = await getData('access');
      const body = {
        title,
        body: content,
        unicon: !!unicon,
      } as any;
      if (hashtags && hashtags.length > 0) {
        body.course_code = hashtags;
      }
      const response = await fetchAPI(URLs.ARTICLE(), {
        method: 'POST',
        token: true,
        body,
      });
      if (!response.error) {
        setCreatePostVisible(false);
        await fetchArticles();
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      } else {
        setError(response?.data?.detail || 'Failed to post');
      }
    } catch (err) {
      setError('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleSearchClick = () => {
    router.push('/search' as any);
  };

  const handleAddClick = () => {
    setCreatePostVisible(true);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false, // Changed to false to prevent VirtualizedList error
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        // More responsive scroll detection - lower threshold and faster animation
        if (scrollDirection === 'down' && currentScrollY > 30 && !isScrollingDown.current) {
          // Hide main header and show sticky header when scrolling down
          isScrollingDown.current = true;
          Animated.parallel([
            // Hide main header
            Animated.timing(headerOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
              toValue: -120,
              duration: 150,
              useNativeDriver: true,
            }),
            // Show sticky header
            Animated.timing(stickyHeaderOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(stickyHeaderTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else if (scrollDirection === 'up' && isScrollingDown.current && currentScrollY < 200) {
          // Show main header and hide sticky header when scrolling up
          isScrollingDown.current = false;
          Animated.parallel([
            // Show main header
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            // Hide sticky header
            Animated.timing(stickyHeaderOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(stickyHeaderTranslateY, {
              toValue: -60,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const handleLikeArticle = async (articleId: number, currentLikeStatus: boolean) => {
    try {
      const url = currentLikeStatus ? URLs.ARTICLE_UNLIKE(String(articleId)) : URLs.ARTICLE_LIKE(String(articleId));
      const response = await fetchAPI(url, { method: 'POST', token: true });
      
      if (!response.error) {
        // Update the article in the local state
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article.id === articleId 
              ? { 
                  ...article, 
                  like_status: !currentLikeStatus,
                  likes_count: article.likes_count + (currentLikeStatus ? -1 : 1)
                }
              : article
          )
        );
      } else {
        console.error('Like failed:', response);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleSaveArticle = async (articleId: number, currentSaveStatus: boolean) => {
    try {
      const url = currentSaveStatus ? URLs.ARTICLE_UNSAVE(String(articleId)) : URLs.ARTICLE_SAVE(String(articleId));
      const response = await fetchAPI(url, { method: 'POST', token: true });
      
      if (!response.error) {
        // Update the article in the local state
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article.id === articleId 
              ? { ...article, save_status: !currentSaveStatus }
              : article
          )
        );
      } else {
        console.error('Save failed:', response);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Create memoized styles to prevent recreation on every render
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: containerBackground,
      paddingTop: 50,
    },
    headerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: headerBackground,
      paddingTop: 60,
      paddingBottom: 15,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      borderBottomWidth: colorScheme === 'light' ? 1 : 0,
      borderBottomColor: '#E5E7EB',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: 'bold',
      marginBottom: 20,
      color: headerTitleColor,
    },
    headerSubtitle: {
      fontSize: 20,
      color: headerTitleColor,
    },
    tagsContainer: {
      paddingVertical: 6,
      maxHeight: 40,
      marginBottom: 10,
    },
    tagChip: {
      marginRight: 8,
    },
    tagChipSelected: {
      backgroundColor: '#57EC6B',
    },
    notificationButton: {
      position: 'relative',
      padding: 4,
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#FF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    newPostContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 0.2,
      borderColor: '#E5E7EB',
      height: 50,
      marginHorizontal: 15,
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 8,
      marginBottom: 15,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    searchInput: {
      marginLeft: 10,
      flex: 1,
      fontSize: 16,
      color: searchFilterColor,
    },
    filterToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 15,
      marginBottom: 15,
    },
    filterTabs: {
      flexDirection: 'row',
    },
    filterTab: {
      paddingHorizontal: 15,
      height: 32,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB',
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterTabSelected: {
      backgroundColor: '#57EC6B',
      borderColor: '#57EC6B',
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 18,
      color: colorScheme === 'dark' ? '#F9FAFB' : '#374151',
    },
    filterTabTextSelected: {
      color: '#fff',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switchLabel: {
      marginRight: 8,
      color: '#666',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      marginTop: 20,
    },
    emptyText: {
      textAlign: 'center',
      color: '#666',
      marginTop: 20,
    },
    stickyHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 20,
      zIndex: 1001,
      borderBottomWidth: 0.5,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.2,
      shadowRadius: 16,
      elevation: 12,
    } as any,
    stickyHeaderText: {
      fontSize: 26,
      fontWeight: '600',
      color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(34, 34, 34, 0.85)',
      textAlign: 'center',
      marginBottom: 0,
      letterSpacing: 1,
      zIndex: 1002,
    },
    glassOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    },
  }), [colorScheme, containerBackground, headerBackground, headerTitleColor, searchFilterColor]);

  return (
    <ProtectedRoute>
      <AppContainer>
        <View style={styles.container}>
          {/* Sticky Mini Header - Shows when main header is hidden */}
          <Animated.View 
            style={[
              styles.stickyHeader,
              {
                opacity: stickyHeaderOpacity,
                transform: [{ 
                  translateY: stickyHeaderTranslateY
                }],
              }
            ]}
          >
            {/* Glass effect overlay */}
            <View style={styles.glassOverlay} />
            <Text style={styles.stickyHeaderText}>UNI.CON</Text>
          </Animated.View>

          {/* Animated Header Container - All header elements in one container */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              }
            ]}
          >
            {/* Main Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>UNICON</Text>
                <Text style={styles.headerSubtitle}>UNSW SYDNEY</Text>
              </View>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => setNotificationVisible(true)}
              >
                <Ionicons name="notifications-outline" size={24} color="#333" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>2</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
              contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center'}}
            >
              {TAGS.map(tag => (
                <ThemedButton
                  key={tag}
                  variant="chip"
                  size="sm"
                  style={[
                    styles.tagChip,
                    selectedTag === tag && styles.tagChipSelected,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  {tag}
                </ThemedButton>
              ))}
            </ScrollView>

            {/* Filter Tabs and Toggle */}
            <View style={styles.filterToggleContainer}>
              <View style={styles.filterTabs}>
                {FILTERS.map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterTab,
                      selectedFilter === filter && styles.filterTabSelected,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        selectedFilter === filter && styles.filterTabTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Toggle</Text>
                <Switch
                  value={isSwitchOn}
                  onValueChange={setIsSwitchOn}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </Animated.View>

          {/* Posts List */}
          {loading && articles.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#57EC6B" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <AnimatedFlatList
              ref={flatListRef}
              data={filteredArticles as Article[]}
              keyExtractor={(item) => String((item as Article).id)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 240 }}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={8}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#57EC6B']} // Android
                  tintColor="#57EC6B" // iOS
                  progressViewOffset={240} // Offset for header
                />
              }
              renderItem={({ item }: any) => (
                <PostCard
                  article={{
                    ...item,
                    like_status: item.like_status || false,
                    views_count: item.views_count || 0,
                    user_school: item.user_school || '',
                  } as Article}
                  onPress={() => {
                    // Debug: Log the item data to see what tags are available
                    console.log('Article data:', {
                      id: (item as Article).id,
                      course_code: (item as Article).course_code,
                      tags: (item as Article).course_code ? (item as Article).course_code.split(',').map((tag: string) => tag.trim()).filter(Boolean) : ['school', 'study']
                    });
                    router.push(`/article/${(item as Article).id}` as any);
                  }}
                  onLike={() => handleLikeArticle((item as Article).id, (item as Article).like_status || false)}
                  onSave={() => handleSaveArticle((item as Article).id, (item as Article).save_status || false)}
                />
              )}
              onEndReached={fetchMoreArticles}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No articles found.</Text>
              }
            />
          )}
        </View>
        <BottomNav 
          onSearchClick={handleSearchClick}
          onAddClick={handleAddClick}
        />
        
        <CreatePost
          visible={createPostVisible}
          onClose={() => setCreatePostVisible(false)}
          onSubmit={handleCreatePost}
          loading={posting}
        />

        <NotificationPanel 
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
        />
      </AppContainer>
    </ProtectedRoute>
  );
}
