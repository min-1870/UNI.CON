import React, { useState, useEffect, useMemo } from "react";
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
import { fetchAPI, getData, removeData } from "@/components/Utils";
import AppContainer from '@/components/AppContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/ui/BottomNav';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

import URLs from "@/constants/Urls";
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '@/components/PostCard';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import moment from 'moment';

// TODO -- Mock user data - replace with real API call
const userData = {
  id: 1,
  name: 'Leo Lim',
  username: 'leoooolim',
  email: 'root@unsw.edu.au',
  university: 'UNSW Sydney',
  verified: true,
  credibilityScore: 1247,
  joinDate: 'September 2023',

  avatar: '',
  stats: {
    posts: 23,
    comments: 157,
    likes: 892,
    saved: 45
  }
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posted');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);


  const [realStats, setRealStats] = useState({
    posts: 23,
    comments: 157,
    likes: 892,
    saved: 45
  });

  // Theme colors
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');
  const brandColor = useThemeColor({}, 'default_brand_color');

  // Additional theme colors
  const headerBackground = colorScheme === 'dark' ? '#101214' : '#FFFFFF';
  const secondaryTextColor = colorScheme === 'dark' ? '#D1D5DB' : '#6B7280';
  const mutedTextColor = colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF';
  const borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB';
  const profileSectionBg = colorScheme === 'dark' ? '#101214' : '#FFFFFF';
  const tabBackground = colorScheme === 'dark' ? '#101214' : '#FFFFFF';
  const emptyStateColor = colorScheme === 'dark' ? '#6B7280' : '#D1D5DB';

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

  const handleLogout = async () => {
    try {
      await logout();
      
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
      });
      
      // Navigate to login page
      router.replace('/Login');
    } catch (error) {
      console.error('Error during logout:', error);
      Toast.show({
        type: 'error',
        text1: 'Error during logout',
      });
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
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
                <Ionicons name="document-outline" size={64} color={emptyStateColor} />
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
                <Ionicons name="bookmark-outline" size={64} color={emptyStateColor} />
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
                <Ionicons name="chatbubble-outline" size={64} color={emptyStateColor} />
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
                <Ionicons name="heart-outline" size={64} color={emptyStateColor} />
                <Text style={styles.emptyText}>No liked posts yet</Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  // Dynamic styles based on theme
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      backgroundColor: headerBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
    },
    settingsButton: {
      padding: 8,
      borderRadius: 20,
    },
    logoutButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
    },
    content: {
      flex: 1,
    },
    profileSection: {
      backgroundColor: profileSectionBg,
      padding: 20,
      borderBottomWidth: colorScheme === 'dark' ? 1 : 0,
      borderBottomColor: borderColor,
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
      color: textColor,
      marginRight: 8,
    },
    username: {
      fontSize: 16,
      color: secondaryTextColor,
      marginBottom: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    university: {
      fontSize: 14,
      color: secondaryTextColor,
      marginRight: 12,
      flex: 1,
    },
    joinBadge: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.8)' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    joinText: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    bio: {
      fontSize: 14,
      color: textColor,
      marginBottom: 20,
      lineHeight: 20,
    },
    credibilitySection: {
      marginBottom: 20,
      height: 70,

    },
    credibilityGradient: {
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-around',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    credibilityLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: '#fff',
      opacity: 0.9,
    },
    credibilityValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
    },
    credibilitySubtext: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.8,
    },

    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      width: '25%',
      height: 3,
      backgroundColor: brandColor,
      borderRadius: 1.5,
    },
    statsGrid: {
      position: 'relative',
      flexDirection: 'row',
      backgroundColor: colorScheme === 'dark' ? 'rgba(16, 18, 20, 0.6)' : '#F9FAFB',
      borderRadius: 16,
      padding: 20,
      paddingBottom: 15,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    statItemActive: {
      transform: [{ scale: 1.05 }],
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 4,
    },
    statValueActive: {
      color: brandColor,
    },
    statLabel: {
      fontSize: 14,
      color: secondaryTextColor,
      fontWeight: '500',
    },
    statLabelActive: {
      color: brandColor,
      fontWeight: '600',
    },
    contentSection: {
      backgroundColor: tabBackground,
      paddingTop: 20,
      borderTopWidth: colorScheme === 'dark' ? 1 : 0,
      borderTopColor: borderColor,
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
      color: mutedTextColor,
    },
    emptySubtext: {
      marginTop: 4,
      fontSize: 14,
      color: mutedTextColor,
    },
  }), [colorScheme, backgroundColor, headerBackground, cardBackground, textColor, secondaryTextColor, mutedTextColor, borderColor, profileSectionBg, tabBackground, emptyStateColor, brandColor]);

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <AppContainer>
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            alwaysBounceVertical={false}
          >
            {/* Header with Settings */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
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
              <Text style={styles.bio}>Computer Science student passionate about AI and web development. Always looking for interesting discussions!</Text>

              {/* Credibility Score */}
              <View style={styles.credibilitySection}>
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  style={styles.credibilityGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.credibilityValue}>{userData.credibilityScore}</Text>
                  <Text style={styles.credibilityLabel}>Credit Points 👏 </Text>
                </LinearGradient>
              </View>

              {/* Stats as Tabs */}
              <View style={styles.statsTabsContainer}>
                {/* Stats Grid as Tabs */}
                <View style={styles.statsGrid}>
                  {[
                    { key: 'posted', label: 'Posts', value: realStats.posts },
                    { key: 'commented', label: 'Comments', value: realStats.comments },
                    { key: 'liked', label: 'Likes', value: realStats.likes },
                    { key: 'saved', label: 'Saved', value: realStats.saved },
                  ].map((stat) => (
                    <TouchableOpacity
                      key={stat.key}
                      style={[
                        styles.statItem,
                        activeTab === stat.key && styles.statItemActive
                      ]}
                      onPress={() => handleTabChange(stat.key)}
                    >
                      <Text style={[
                        styles.statValue,
                        activeTab === stat.key && styles.statValueActive
                      ]}>
                        {stat.value}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        activeTab === stat.key && styles.statLabelActive
                      ]}>
                        {stat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Tab Indicator positioned directly on stats */}
                  <View style={[
                    styles.tabIndicator,
                    { 
                      left: activeTab === 'posted' ? '4.5%' : 
                            activeTab === 'commented' ? '30.5%' : 
                            activeTab === 'liked' ? '57.5%' : '81.5%',
                    }
                  ]} />
                </View>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              {renderTabContent()}
            </View>
          </ScrollView>
        </AppContainer>
        
        <ChangePasswordModal
          visible={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      </View>
    </ProtectedRoute>
  );
} 