import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppContainer from '@/components/AppContainer';
import PostCard from '@/components/PostCard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import BottomNav from '@/components/ui/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';

import { fetchAPI, getData, setData } from '@/components/Utils';
import URLs from '@/constants/Urls';
import { router } from 'expo-router';

export default function SearchPage() {
  const [searchText, setSearchText] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Theme colors
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');
  const brandColor = useThemeColor({}, 'default_brand_color');
  
  const searchRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bounceAnim = useRef(new Animated.Value(0.8)).current;

  // Local data to avoid conflicts
  const trendingTopics = [
    { tag: 'Computer Science', color: '#57EC6B', bgColor: 'rgba(87, 236, 107, 0.1)', count: 125 },
    { tag: 'Study Groups', color: '#FF6B35', bgColor: 'rgba(255, 107, 53, 0.1)', count: 89 },
    { tag: 'Campus Events', color: '#57EC6B', bgColor: 'rgba(87, 236, 107, 0.1)', count: 67 },
    { tag: 'Housing', color: '#FFD23F', bgColor: 'rgba(255, 210, 63, 0.1)', count: 45 },
    { tag: 'Food', color: '#57EC6B', bgColor: 'rgba(87, 236, 107, 0.1)', count: 34 },
    { tag: 'Internships', color: '#6B73FF', bgColor: 'rgba(107, 115, 255, 0.1)', count: 28 },
  ];

  const popularCategories = [
    { name: 'Academic', color: '#6B73FF', bgColor: 'rgba(107, 115, 255, 0.1)' },
    { name: 'Social', color: '#57EC6B', bgColor: 'rgba(87, 236, 107, 0.1)' },
    { name: 'Events', color: '#FFD23F', bgColor: 'rgba(255, 210, 63, 0.1)' },
    { name: 'Resources', color: '#6B73FF', bgColor: 'rgba(107, 115, 255, 0.1)' },
    { name: 'Help', color: '#FF6B35', bgColor: 'rgba(255, 107, 53, 0.1)' },
    { name: 'Entertainment', color: '#FF6B9D', bgColor: 'rgba(255, 107, 157, 0.1)' },
  ];

  useEffect(() => {
    loadRecentSearches();
    fetchTrendingArticles();
    
    // Animate page load with jelly effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Auto-search with debounce
  useEffect(() => {
    if (searchText.trim().length > 2) {
      const debounceTimer = setTimeout(() => {
        handleSearch(searchText);
      }, 800); // Wait 800ms after user stops typing

      return () => clearTimeout(debounceTimer);
    } else if (searchText.trim().length === 0) {
      setShowResults(false);
      setError(null);
    }
  }, [searchText]);

  const loadRecentSearches = async () => {
    try {
      const recent = await getData('recentSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (err) {
      console.log('No recent searches found');
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;
      
      let updatedSearches = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)];
      updatedSearches = updatedSearches.slice(0, 5); // Keep only 5 recent searches
      
      setRecentSearches(updatedSearches);
      await setData('recentSearches', JSON.stringify(updatedSearches));
    } catch (err) {
      console.log('Failed to save recent search');
    }
  };

  const fetchTrendingArticles = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI(URLs.ARTICLE_HOT, {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchQuery = query || searchText.trim();
    if (!searchQuery || searchQuery.length < 1) {
      setError('Please enter a search term');
      return;
    }

    console.log('🔍 Searching for:', searchQuery);
    setSearching(true);
    setShowResults(true);
    setSearchFocused(false);
    setError(null);

    try {
      // Save to recent searches
      await saveRecentSearch(searchQuery);
      
      console.log('📡 API URL:', URLs.SEARCHING_ARTICLE(searchQuery));
      const response = await fetchAPI(URLs.SEARCHING_ARTICLE(searchQuery), {
        method: 'GET',
        token: true,
      });
      
      console.log('🔍 Search response:', response);
      
      if (!response.error) {
        const searchResults = response.data?.results?.articles || response.data?.articles || [];
        console.log('📝 Search results:', searchResults);
        setArticles(searchResults);
        
        if (searchResults.length === 0) {
          setError(`No results found for "${searchQuery}"`);
        }
      } else {
        console.error('Search API error:', response.data);
        setError(response?.data?.detail || 'Search failed. Please try again.');
        setArticles([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please check your connection and try again.');
      setArticles([]);
    } finally {
      setSearching(false);
    }
  };

  const handleTrendingClick = (topic: string) => {
    setSearchText(topic);
    handleSearch(topic);
  };

  const handleRecentClick = (recent: string) => {
    setSearchText(recent);
    handleSearch(recent);
  };

  const handleCategoryClick = (category: string) => {
    setSearchText(category.toLowerCase());
    handleSearch(category.toLowerCase());
  };

  const clearSearch = () => {
    setSearchText('');
    setShowResults(false);
    setSearchFocused(false);
    setError(null);
    fetchTrendingArticles();
  };

  const handleLikeArticle = async (articleId: number, currentLikeStatus: boolean) => {
    try {
      const url = currentLikeStatus ? URLs.ARTICLE_UNLIKE(String(articleId)) : URLs.ARTICLE_LIKE(String(articleId));
      const response = await fetchAPI(url, { method: 'POST', token: true });
      
      if (!response.error) {
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



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    content: {
      flex: 1,
    },
    searchHeader: {
      backgroundColor: cardBackground,
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: textColor,
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6',
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    searchIcon: {
      marginRight: 12,
      color: placeholderColor,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: textColor,
      paddingVertical: 2,
    },
    clearButton: {
      padding: 8,
      marginLeft: 4,
    },
    resultsCount: {
      fontSize: 14,
      color: placeholderColor,
      marginTop: 8,
    },
    scrollContent: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginLeft: 8,
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    topicCard: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    topicTag: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    topicCount: {
      fontSize: 12,
      color: placeholderColor,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
    },
    recentText: {
      flex: 1,
      fontSize: 16,
      color: textColor,
      marginLeft: 12,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      marginBottom: 8,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: placeholderColor,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    errorText: {
      fontSize: 16,
      color: placeholderColor,
      marginTop: 16,
      textAlign: 'center',
      marginHorizontal: 20,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: brandColor,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: placeholderColor,
      marginTop: 8,
      textAlign: 'center',
      marginHorizontal: 20,
    },
    resultsList: {
      paddingHorizontal: 20,
    },
  });

  const renderTrendingTopics = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: bounceAnim }
          ]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={20} color="#57EC6B" />
        <Text style={styles.sectionTitle}>Trending Now</Text>
      </View>
      <View style={styles.topicsGrid}>
        {trendingTopics.map((topic: any, index: number) => (
          <Animated.View
            key={index}
            style={{
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: Animated.add(
                    slideAnim,
                    new Animated.Value(index * 5)
                  )
                },
                { scale: bounceAnim }
              ]
            }}
          >
            <TouchableOpacity
              style={[styles.topicCard, { backgroundColor: topic.bgColor }]}
              onPress={() => handleTrendingClick(topic.tag)}
              activeOpacity={0.7}
            >
              <Text style={[styles.topicTag, { color: topic.color }]}>
                #{topic.tag}
              </Text>
              <Text style={styles.topicCount}>{topic.count} posts</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;
    
    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: bounceAnim }
            ]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color="#6B73FF" />
          <Text style={styles.sectionTitle}>Recent Searches</Text>
        </View>
        {recentSearches.map((search: string, index: number) => (
          <Animated.View
            key={index}
            style={{
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: Animated.add(
                    slideAnim,
                    new Animated.Value(index * 2)
                  )
                },
                { scale: bounceAnim }
              ]
            }}
          >
            <TouchableOpacity
              style={styles.recentItem}
              onPress={() => handleRecentClick(search)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={16} color={placeholderColor} />
              <Text style={styles.recentText}>{search}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  const renderPopularCategories = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: bounceAnim }
          ]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="grid" size={20} color="#FF6B35" />
        <Text style={styles.sectionTitle}>Popular Categories</Text>
      </View>
      <View style={styles.categoriesGrid}>
        {popularCategories.map((category: any, index: number) => (
          <Animated.View
            key={index}
            style={{
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: Animated.add(
                    slideAnim,
                    new Animated.Value(index * 3)
                  )
                },
                { scale: bounceAnim }
              ]
            }}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: category.bgColor,
                  borderColor: category.color,
                }
              ]}
              onPress={() => handleCategoryClick(category.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="search" size={64} color={placeholderColor} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleSearch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (articles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={placeholderColor} />
          <Text style={styles.emptyText}>No Results Found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search terms or browse trending topics
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        style={styles.resultsList}
        data={articles}
        keyExtractor={(item) => item.id}
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
                ['general'],
              likes: item.likes_count,
              comments: item.comments_count,
              bookmarks: item.save_status ? 1 : 0,
              image: item.image,
              like_status: item.like_status || false,
              save_status: item.save_status || false,
            }}
            onPress={() => router.push(`/article/${item.id}` as any)}
            onLike={() => handleLikeArticle(item.id, item.like_status || false)}
            onSave={() => handleSaveArticle(item.id, item.save_status || false)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  return (
    <ProtectedRoute>
      <AppContainer>
        <View style={styles.container}>
          {/* Fixed Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Search</Text>
              {showResults && (
                <TouchableOpacity onPress={clearSearch}>
                  <Text style={{ color: brandColor, fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons 
                  name="search" 
                  size={20} 
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  placeholder="Search articles, topics, users..."
                  placeholderTextColor={placeholderColor}
                  value={searchText}
                  onChangeText={setSearchText}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onSubmitEditing={() => handleSearch()}
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setSearchText('')}
                  >
                    <Ionicons name="close-circle" size={20} color={placeholderColor} />
                  </TouchableOpacity>
                )}
              </View>
              
              {showResults && (
                <Text style={styles.resultsCount}>
                  {articles.length} result{articles.length !== 1 ? 's' : ''} found
                </Text>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {showResults ? (
              renderSearchResults()
            ) : (
              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderTrendingTopics()}
                {renderRecentSearches()}
                {renderPopularCategories()}
              </ScrollView>
            )}
          </View>
        </View>

                 <BottomNav />
      </AppContainer>
    </ProtectedRoute>
  );
} 