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
import BottomNav from '@/components/ui/BottomNav';
import { fetchAPI } from '@/components/Utils';
import URLs from '@/constants/Urls';
import { router } from 'expo-router';

const TRENDING_TOPICS = [
  '💻 Computer Science',
  '📚 Study Groups',
  '🍕 Campus Food',
  '📝 Assignments',
  '🎉 Events',
  '📖 Textbooks',
  '💼 Internships',
  '🏠 Housing',
];

const RECENT_SEARCHES = [
  'COMP3900 project',
  'Study tips',
  'Exam preparation',
];

export default function SearchPage() {
  const [searchText, setSearchText] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate in the trending topics
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
    
    fetchTrendingArticles();
  }, []);

  const fetchTrendingArticles = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI(URLs.HOT_SORTED_ARTICLES, {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
        setNextPage(response.data?.next || null);
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchQuery = query || searchText.trim();
    if (!searchQuery) return;

    setSearching(true);
    setShowResults(true);
    setError(null);

    try {
      const response = await fetchAPI(URLs.SEARCHING_ARTICLE(searchQuery), {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
        setNextPage(response.data?.next || null);
      } else {
        setError('No results found');
        setArticles([]);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setArticles([]);
    } finally {
      setSearching(false);
    }
  };

  const handleTrendingClick = (topic: string) => {
    const cleanTopic = topic.replace(/[^\w\s]/gi, '').trim();
    setSearchText(cleanTopic);
    handleSearch(cleanTopic);
  };

  const handleRecentClick = (recent: string) => {
    setSearchText(recent);
    handleSearch(recent);
  };

  const clearSearch = () => {
    setSearchText('');
    setShowResults(false);
    setArticles([]);
    fetchTrendingArticles();
  };

  const handleSearchClick = () => {
    router.push('/search');
  };

  const handleAddClick = () => {
    console.log('Add clicked');
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
      <Text style={styles.sectionTitle}>🔥 Trending Topics</Text>
      <View style={styles.topicsGrid}>
        {TRENDING_TOPICS.map((topic, index) => (
          <TouchableOpacity
            key={index}
            style={styles.topicTag}
            onPress={() => handleTrendingClick(topic)}
            activeOpacity={0.7}
          >
            <Text style={styles.topicText}>{topic}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderRecentSearches = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🕒 Recent Searches</Text>
      {RECENT_SEARCHES.map((search, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recentItem}
          onPress={() => handleRecentClick(search)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color="#9CA3AF" />
          <Text style={styles.recentText}>{search}</Text>
          <Ionicons name="arrow-up-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
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
          <Text style={styles.emptySubtext}>Try different keywords</Text>
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
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <View style={styles.content}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <Text style={styles.title}>Search</Text>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  placeholder="Search posts, topics, or hashtags..."
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={() => handleSearch()}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
                
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading trending posts...</Text>
                  </View>
                )}
                
                {articles.length > 0 && !showResults && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 Trending Posts</Text>
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
                  <Text style={styles.resultsCount}>
                    {articles.length} results found
                  </Text>
                </View>
                {renderSearchResults()}
              </View>
            )}
          </ScrollView>
        </View>

        <BottomNav 
          onSearchClick={handleSearchClick}
          onAddClick={handleAddClick}
        />
      </AppContainer>
    </SafeAreaView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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
  clearButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
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
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
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
});
