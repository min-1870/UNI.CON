import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fetchAPI, getData } from "@/components/Utils";
import AppContainer from '@/components/AppContainer';
import BottomNav from '@/components/ui/BottomNav';
import URLs from "@/constants/Urls";
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '@/components/PostCard';
import ChangePasswordModal from '@/components/ChangePasswordModal';

// Mock user data - replace with real API call
const userData = {
  id: 1,
  name: 'Michael Chen',
  username: 'michelc',
  email: 'root@unsw.edu.au',
  university: 'University of New South Wales',
  verified: true,
  credibilityScore: 140,
  joinDate: 'September 2023',
  bio: 'Computer Science student passionate about AI and web development. Always looking for interesting discussions!',
  avatar: '',
  stats: {
    posts: 23,
    comments: 157,
    likes: 892,
    saved: 45
  }
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posted');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [realStats, setRealStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    saved: 0
  });

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [postedRes, savedRes, commentedRes, likedRes] = await Promise.all([
        fetchAPI(URLs.POSTED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.SAVED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.COMMENTED_ARTICLES, { method: 'GET', token: true }),
        fetchAPI(URLs.LIKED_ARTICLES, { method: 'GET', token: true })
      ]);

      setRealStats({
        posts: postedRes.data?.count || userData.stats.posts,
        saved: savedRes.data?.count || userData.stats.saved,
        comments: commentedRes.data?.count || userData.stats.comments,
        likes: likedRes.data?.count || userData.stats.likes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      const apiEndpoints = {
        posted: URLs.POSTED_ARTICLES,
        saved: URLs.SAVED_ARTICLES,
        commented: URLs.COMMENTED_ARTICLES,
        liked: URLs.LIKED_ARTICLES,
      };

      const response = await fetchAPI(apiEndpoints[activeTab as keyof typeof apiEndpoints], {
        method: 'GET',
        token: true,
      });
      
      if (!response.error) {
        const articles = response.data?.results?.articles || [];
        
        switch (activeTab) {
          case 'posted':
            setPosts(articles);
            break;
          case 'saved':
            setSavedPosts(articles);
            break;
          case 'commented':
            setComments(articles);
            break;
          case 'liked':
            setLikedPosts(articles);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const handleLogout = () => {
    // Add logout logic here
    router.replace('/Login');
  };

  const handleSettings = () => {
    // Navigate to settings or show settings modal
    console.log('Settings clicked');
  };

  const handleSearchClick = () => {
    router.push('/search');
  };

  const handleAddClick = () => {
    console.log('Add clicked');
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      );
    }

    switch (activeTab) {
      case 'posted':
        return (
          <View style={styles.tabContent}>
            {posts.length > 0 ? (
              posts.map((post, index) => (
                <PostCard key={index} article={post} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>Share your first post!</Text>
              </View>
            )}
          </View>
        );
      case 'saved':
        return (
          <View style={styles.tabContent}>
            {savedPosts.length > 0 ? (
              savedPosts.map((post, index) => (
                <PostCard key={index} article={post} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No saved posts yet</Text>
              </View>
            )}
          </View>
        );
      case 'commented':
        return (
          <View style={styles.tabContent}>
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <PostCard key={index} article={comment} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No comments yet</Text>
              </View>
            )}
          </View>
        );
      case 'liked':
        return (
          <View style={styles.tabContent}>
            {likedPosts.length > 0 ? (
              likedPosts.map((post, index) => (
                <PostCard key={index} article={post} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No liked posts yet</Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with Settings */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>MC</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{userData.name}</Text>
                  {userData.verified && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </View>
                <Text style={styles.username}>@{userData.username}</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.university}>{userData.university}</Text>
                  <View style={styles.joinBadge}>
                    <Text style={styles.joinText}>{userData.joinDate}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.bio}>{userData.bio}</Text>

            {/* Credibility Score */}
            <View style={styles.credibilitySection}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.credibilityGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.credibilityLabel}>Credibility Score</Text>
                <Text style={styles.credibilityValue}>{userData.credibilityScore}</Text>
                <Text style={styles.credibilitySubtext}>Points</Text>
              </LinearGradient>
            </View>

            {/* Account Summary */}
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>Account Summary</Text>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>University</Text>
                <Text style={styles.accountValue}>{userData.university}</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Student Email</Text>
                <Text style={styles.accountValue}>{userData.email}</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Google Account</Text>
                <Text style={styles.accountValue}>(PLACE HOLDER)</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Update Password</Text>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(true)}>
                  <Text style={styles.accountLink}>Change Password</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Logout</Text>
                <TouchableOpacity onPress={handleLogout}>
                  <Text style={[styles.accountLink, { color: '#EF4444' }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{realStats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{realStats.comments}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{realStats.likes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{realStats.saved}</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
            </View>
          </View>

          {/* Tabs Section */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsList}>
              {[
                { key: 'posted', label: 'Posted', icon: 'document-text' },
                { key: 'liked', label: 'Liked', icon: 'heart' },
                { key: 'commented', label: 'Commented', icon: 'chatbubble' },
                { key: 'saved', label: 'Saved', icon: 'bookmark' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabItem,
                    activeTab === tab.key && styles.tabItemActive
                  ]}
                  onPress={() => handleTabChange(tab.key)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={16} 
                    color={activeTab === tab.key ? '#fff' : '#6B7280'} 
                    style={{ marginRight: tab.key === 'commented' ? 8 : 6 }}
                  />
                  <Text style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderTabContent()}
          </View>
        </ScrollView>

        <BottomNav 
          onSearchClick={handleSearchClick}
          onAddClick={handleAddClick}
        />
      </AppContainer>
      
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  university: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
    flex: 1,
  },
  joinBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  joinText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 20,
  },
  credibilitySection: {
    marginBottom: 20,
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
  credibilityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  credibilityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  credibilitySubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  accountSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  accountValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  accountLink: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
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
  tabsContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  tabsList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F9FAFB',
  },
  tabItemActive: {
    backgroundColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  commentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});

