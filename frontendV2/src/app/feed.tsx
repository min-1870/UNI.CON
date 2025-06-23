import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import PostCard from '@/components/PostCard';
import { fetchAPI, getData } from '@/components/Utils';
import URLs from '@/constants/Urls';
import { router } from 'expo-router';
import CreatePost from '@/components/CreatePost';
import AppContainer from '@/components/AppContainer';
import BottomNav from '@/components/ui/BottomNav';

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
  save_status: boolean;
  image?: string;
  like_status?: boolean;
}

type FilterType = 'All' | 'Hot' | 'Recommended';

export default function Feed() {
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const fetchedPage = useRef<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  
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

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAPI(apiEndpoints[selectedFilter], {
        method: 'GET',
        token: true,
      });

      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
        setNextPage(response.data?.next || null);
        fetchedPage.current = apiEndpoints[selectedFilter];
      } else {
        setError(response?.data?.detail || "An error occurred");
      }
    } catch (err) {
      setError("Failed to load articles");
    } finally {
      setLoading(false);
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
      useNativeDriver: true,
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

  return (
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
            <Text style={styles.headerTitle}>UNICON</Text>
            <Text style={styles.headerSubtitle}>UNSW SYDNEY</Text>
          </View>

          {/* Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsContainer}
            contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center'}}
          >
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagBadge,
                  selectedTag === tag && styles.tagBadgeSelected,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === tag && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
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
          <FlatList
            ref={flatListRef}
            data={filteredArticles}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 240 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={8}
            renderItem={({ item }) => (
              <PostCard
                post={{
                  id: String(item.id),
                  user: item.user_temp_name || 'Unknown',
                  timestamp: item.created_at,
                  title: item.title,
                  content: item.body,
                  tags: item.course_code ? 
                    item.course_code.split(',').map((tag: string) => tag.trim()).filter(Boolean) : 
                    ['school', 'study'], // Fallback tags for testing
                  likes: item.likes_count,
                  comments: item.comments_count,
                  bookmarks: item.save_status ? 1 : 0,
                  image: item.image,
                  like_status: item.like_status || false,
                }}
                onPress={() => {
                  // Debug: Log the item data to see what tags are available
                  console.log('Article data:', {
                    id: item.id,
                    course_code: item.course_code,
                    tags: item.course_code ? item.course_code.split(',').map((tag: string) => tag.trim()).filter(Boolean) : ['school', 'study']
                  });
                  router.push(`/article/${item.id}` as any);
                }}
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
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 15,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#282828',
  },
  tagsContainer: {
    paddingVertical: 6,
    maxHeight: 40,
    marginBottom: 10,
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginRight: 10,
    textAlign: 'center',
  },
  tagBadgeSelected: {
    backgroundColor: '#57EC6B',
  },
  tagText: {
    color: '#444',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#fff',
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
    color: '#222',
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
    backgroundColor: '#FEFEFE',
    borderWidth: 0.2,
    borderColor: '#E5E7EB',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabSelected: {
    backgroundColor: '#57EC6B',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // More transparent base
    backdropFilter: 'blur(20px) saturate(180%)', // Enhanced blur with saturation
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 1001,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  } as any,
  stickyHeaderText: {
    fontSize: 26,
    fontWeight: '600',
    color: 'rgba(34, 34, 34, 0.85)', // Elegant transparency
    textAlign: 'center',
    marginBottom: 0,
    letterSpacing: 1,
    zIndex: 1002, // Above the glass overlay
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Subtle white overlay
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
});
