import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AppContainer from '../components/AppContainer';
import PostCard from '../components/PostCard';
import BottomNav from '../components/ui/BottomNav';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { fetchAPI, getData } from '../components/Utils';
import URLs from '@/constants/Urls';

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

const Profile = () => {
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

      const response = await fetchAPI(apiEndpoints[activeTab], {
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

  const handleSearchClick = () => {
    console.log('Search clicked');
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
                <View key={index} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentTitle} numberOfLines={1}>
                      {comment.postTitle}
                    </Text>
                    <Text style={styles.commentTime}>{comment.timestamp}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                  <View style={styles.commentFooter}>
                    <Ionicons name="heart-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.commentLikes}>{comment.likes}</Text>
                  </View>
                </View>
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
    <AppContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
      </View>
      <BottomNav 
        onSearchClick={handleSearchClick}
        onAddClick={handleAddClick}
      />
      
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </AppContainer>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    paddingVertical: 8,
  },
  accountLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  accountLink: {
    fontSize: 16,
    color: '#3B82F6',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    flex: 1,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#10B981',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikes: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  // PostCard styles remain the same
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: '#ECDA57',
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: '300',
    fontSize: 15,
  },
  userName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
  },
  postTimestamp: {
    marginLeft: 15,
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 10,
    color: '#222',
  },
  postContent: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  postTagBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  postTagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 13,
  },
});

export default Profile; 