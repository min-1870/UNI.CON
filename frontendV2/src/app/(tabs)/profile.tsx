import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { fetchAPI, getData } from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import PostCard from '@/components/PostCard';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import AppContainer from '@/components/AppContainer';
import URLs from "@/constants/Urls";

export default function ProfilePage() {
  const default_card_background_color = useThemeColor({}, 'default_card_background_color');
  const [activeTab, setActiveTab] = useState<keyof typeof apiEndpoints>("posted");
  const [nextArticlePage, setNextArticlePage] = useState(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [university, setUniversity] = useState('');
  const [points, setPoints] = useState('');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    saved: 0
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fetchedArticlePage = useRef(null);

  const apiEndpoints = {
    posted: URLs.POSTED_ARTICLES,
    saved: URLs.SAVED_ARTICLES,
    commented: URLs.COMMENTED_ARTICLES,
    liked: URLs.LIKED_ARTICLES,
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const initializeData = async () => {
    await Promise.all([
      fetchUserData(),
      fetchStats(),
      fetchArticles()
    ]);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchUserData = async () => {
    const storedUniversity = await getData('university');
    const storedEmail = await getData('email');
    const storedPoints = await getData('points');
    setUniversity(storedUniversity || "University of Sydney");
    setEmail(storedEmail || "");
    setPoints(storedPoints || '1,247');
  };

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [postedRes, savedRes, commentedRes, likedRes] = await Promise.all([
        fetchAPI(URLs.POSTED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.SAVED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.COMMENTED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.LIKED_ARTICLES, { method: 'GET', token: true })
      ]);

      setStats({
        posts: postedRes.data?.count || 0,
        saved: savedRes.data?.count || 0,
        comments: commentedRes.data?.count || 0,
        likes: likedRes.data?.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchAPI(apiEndpoints[activeTab], {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        setArticles(response.data?.results?.articles || []);
        setNextArticlePage(response.data?.next || null);
      } else {
        setError(response?.data?.detail || "Failed to load articles");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
      fetchedArticlePage.current = null;
    }
  };

  const fetchMoreArticles = async () => {
    if (!nextArticlePage || nextArticlePage === fetchedArticlePage.current) return;
    
    try {
      const response = await fetchAPI(nextArticlePage, {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        setArticles(prevArticles => [
          ...prevArticles,
          ...(response.data?.results?.articles || []),
        ]);
        fetchedArticlePage.current = nextArticlePage;
        setNextArticlePage(response.data?.next || null);
      }
    } catch (error) {
      console.error('Error fetching more articles:', error);
    }
  };

  const handleTabPress = (tab: keyof typeof apiEndpoints) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    setArticles([]);
    setExpandedPostId(null);
  };

  const handlePostPress = (postId: string) => {
    if (expandedPostId === postId) {
      // Close expanded post
      setExpandedPostId(null);
    } else {
      // Open post details
      router.push(`/article/${postId}`);
    }
  };

  const renderCredibilityScore = () => (
    <View style={styles.credibilityContainer}>
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        style={styles.credibilityGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.credibilityTitle}>Credibility Score</Text>
        <Text style={styles.credibilityScore}>{points}</Text>
        <Text style={styles.credibilitySubtitle}>Points</Text>
      </LinearGradient>
    </View>
  );

  const renderAccountSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.sectionTitle}>Account Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>University</Text>
          <Text style={styles.summaryValue}>{university}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Student Email</Text>
          <Text style={styles.summaryValue}>{email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Google Account</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Connect Account</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Update Password</Text>
          <TouchableOpacity onPress={() => setShowChangePasswordModal(true)}>
            <Text style={styles.linkText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.posts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.comments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.likes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.saved}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {Object.keys(apiEndpoints).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab
          ]}
          onPress={() => handleTabPress(tab as keyof typeof apiEndpoints)}
        >
          <Text style={[
            styles.tabText,
            activeTab === tab && styles.activeTabText
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderArticleList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (articles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No {activeTab} articles yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard 
            article={item} 
            onPress={() => handlePostPress(item.id.toString())}
          />
        )}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={fetchMoreArticles}
        contentContainerStyle={styles.articleList}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCredibilityScore()}
            {renderAccountSummary()}
            {renderStats()}
            {renderTabs()}
            <View style={styles.articlesContainer}>
              {renderArticleList()}
            </View>
          </ScrollView>
        </Animated.View>

        <ChangePasswordModal
          visible={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for bottom nav
  },
  credibilityContainer: {
    marginBottom: 24,
  },
  credibilityGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  credibilityTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  credibilityScore: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  credibilitySubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  summaryValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
  },
  articlesContainer: {
    minHeight: 300,
  },
  articleList: {
    gap: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
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
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});

