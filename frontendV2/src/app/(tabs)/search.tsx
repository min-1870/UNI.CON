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
  
  const searchRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Local data to avoid conflicts
  const trendingTopics = [
    { tag: 'Computer Science', color: '#3B82F6', count: 125 },
    { tag: 'Study Groups', color: '#10B981', count: 89 },
    { tag: 'Campus Events', color: '#F59E0B', count: 67 },
    { tag: 'Housing', color: '#8B5CF6', count: 45 },
    { tag: 'Food', color: '#EF4444', count: 34 },
    { tag: 'Internships', color: '#06B6D4', count: 28 },
  ];

  const popularCategories = [
    'Academic', 'Social', 'Career', 'Sports', 'Technology', 'Arts'
  ];

  useEffect(() => {
    loadRecentSearches();
    fetchTrendingArticles();
    
    // Animate page load
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

  const handleSearchClick = () => {
    // Already on search page
  };

  const handleAddClick = () => {
    router.push('/(tabs)' as any);
  };

  const renderTrendingTopics = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={20} color="#EF4444" />
        <Text style={styles.sectionTitle}>Trending Now</Text>
      </View>
      <View style={styles.topicsGrid}>
        {trendingTopics.map((topic: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={[styles.topicCard, { backgroundColor: `${topic.color}15` }]}
            onPress={() => handleTrendingClick(topic.tag)}
            activeOpacity={0.7}
          >
            <Text style={[styles.topicTag, { color: topic.color }]}>
              #{topic.tag}
            </Text>
            <Text style={styles.topicCount}>{topic.count} posts</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>Recent Searches</Text>
        </View>
        {recentSearches.map((search: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => handleRecentClick(search)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <Text style={styles.recentText}>{search}</Text>
            <Ionicons name="arrow-up-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPopularCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people" size={20} color="#10B981" />
        <Text style={styles.sectionTitle}>Popular Categories</Text>
      </View>
      <View style={styles.categoriesGrid}>
        {popularCategories.map((category: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryButton}
            onPress={() => handleCategoryClick(category)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="search-outline" size={64} color="#E5E7EB" />
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
          <Ionicons name="document-outline" size={64} color="#E5E7EB" />
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
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.title}>Search</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  placeholder="Search posts, hashtags, or content..."
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
                  <ActivityIndicator size="small" color="#3B82F6" style={styles.searchingIndicator} />
                )}
                {searchText.length > 0 && (
                  <>
                    <TouchableOpacity onPress={() => handleSearch()} style={styles.searchButton}>
                      <Ionicons name="search" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Search Results Count */}
            {searchText && showResults && (
              <Text style={styles.resultsCount}>
                {searching ? 'Searching...' : `${articles.length} result${articles.length !== 1 ? 's' : ''} found`}
              </Text>
            )}
            
            {/* Search Hint */}
            {searchText.length > 0 && searchText.length <= 2 && !showResults && (
              <Text style={styles.searchHint}>
                Type at least 3 characters to search automatically
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
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading trending posts...</Text>
                  </View>
                )}
                
                {articles.length > 0 && !showResults && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flame" size={20} color="#F59E0B" />
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
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    Search Results for "{searchText}"
                  </Text>
                </View>
                {renderSearchResults()}
              </View>
            )}
          </ScrollView>

          {/* Trending Tags Overlay */}
          {searchFocused && (
            <>
              <TouchableOpacity 
                style={styles.overlay}
                onPress={() => setSearchFocused(false)}
                activeOpacity={1}
              />
              <View style={styles.trendingOverlay}>
                <View style={styles.overlayHeader}>
                  <Ionicons name="trending-up" size={16} color="#EF4444" />
                  <Text style={styles.overlayTitle}>Trending Tags</Text>
                </View>
                                 {trendingTopics.slice(0, 6).map((topic: any, index: number) => (
                   <TouchableOpacity
                     key={index}
                     style={styles.overlayItem}
                     onPress={() => handleTrendingClick(topic.tag)}
                   >
                     <View style={[styles.rankBadge, { 
                       backgroundColor: index === 0 ? '#10B981' : 
                                      index === 1 ? '#3B82F6' : 
                                      index === 2 ? '#8B5CF6' : '#6B7280' 
                     }]}>
                       <Text style={styles.rankText}>{String(index + 1).padStart(2, '0')}</Text>
                     </View>
                     <Text style={styles.overlayItemText}>#{topic.tag}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
            </>
          )}
        </View>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  searchHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60, // Add top padding for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    padding: 4,
    marginRight: 8,
  },
  searchingIndicator: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  searchHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  topicTag: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  resultsList: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 30,
  },
  trendingOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 40,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overlayItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

