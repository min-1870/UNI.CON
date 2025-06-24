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
              <Ionicons name="search-outline" size={18} color={placeholderColor} />
              <Text style={styles.recentText}>{search}</Text>
              <Ionicons name="arrow-up-outline" size={16} color={placeholderColor} />
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
        <Ionicons name="people" size={20} color="#57EC6B" />
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
              style={[styles.categoryButton, { backgroundColor: category.bgColor, borderColor: category.color }]}
              onPress={() => handleCategoryClick(category.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, { color: category.color }]}>{category.name}</Text>
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
          <Ionicons name="search-outline" size={64} color={placeholderColor} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => handleSearch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (articles.length === 0 && showResults) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={placeholderColor} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different keywords or browse trending topics</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard article={item} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsList}
      />
    );
  };

  return (
    <View style={styles.container}>
      <AppContainer>
        <View style={styles.content}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
              <Text style={styles.title}>Search</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={placeholderColor} style={styles.searchIcon} />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  placeholder="Search posts, hashtags, or content..."
                  placeholderTextColor={placeholderColor}
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={() => handleSearch()}
                  onFocus={() => setSearchFocused(true)}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                  editable={!searching}
                />
                {searching && (
                  <ActivityIndicator size="small" color={brandColor} />
                )}
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={placeholderColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Results Count */}
            {searchText && showResults && (
              <Text style={styles.resultsCount}>
                {searching ? 'Searching...' : `${articles.length} result${articles.length !== 1 ? 's' : ''} found`}
              </Text>
            )}
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!showResults ? (
              <>
                {renderTrendingTopics()}
                {renderRecentSearches()}
                {renderPopularCategories()}
                
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={brandColor} />
                    <Text style={styles.loadingText}>Loading trending posts...</Text>
                  </View>
                )}
                
                {articles.length > 0 && !showResults && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flame" size={20} color={brandColor} />
                      <Text style={styles.sectionTitle}>Trending Posts</Text>
                    </View>
                    <FlatList
                      data={articles.slice(0, 5)}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <PostCard article={item} />
                      )}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Search Results for "{searchText}"
                </Text>
                {renderSearchResults()}
              </View>
            )}
          </ScrollView>
        </View>
      </AppContainer>
    </View>
  );
}

