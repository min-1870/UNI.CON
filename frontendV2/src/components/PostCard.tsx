import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getTagColor(tag: string): string {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('school') || tagLower.includes('university')) return '#EF4444';
  if (tagLower.includes('lunch') || tagLower.includes('food')) return '#F97316';
  if (tagLower.includes('it') || tagLower.includes('tech') || tagLower.includes('computer')) return '#3B82F6';
  return '#6B7280';
}

interface Article {
  id: number;
  title: string;
  body: string;
  user_temp_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  like_status: boolean;
  save_status: boolean;
  course_code: string;
  user_school: string;
}

interface Post {
  id: string;
  user: string;
  timestamp: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  bookmarks: number;
  image?: string;
  like_status?: boolean;
}

interface PostCardProps {
  article?: Article;
  post?: Post;
  styles?: any;
  onPress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ article, post, styles: externalStyles, onPress }) => {
  // Normalize data from either article or post prop
  let normalizedData;
  
  if (article) {
    // API data format
    normalizedData = {
      id: article.id || 0,
      title: article.title || 'Untitled',
      body: article.body || '',
      user_temp_name: article.user_temp_name || 'Unknown User',
      created_at: article.created_at || new Date().toISOString(),
      likes_count: article.likes_count || 0,
      comments_count: article.comments_count || 0,
      views_count: article.views_count || 0,
      like_status: article.like_status || false,
      save_status: article.save_status || false,
      course_code: article.course_code || '',
      user_school: article.user_school || '',
      tags: article.course_code ? article.course_code.split(',').map(code => code.trim()).filter(Boolean) : [],
    };
  } else if (post) {
    // Feed data format
    normalizedData = {
      id: parseInt(post.id) || 0,
      title: post.title || 'Untitled',
      body: post.content || '',
      user_temp_name: post.user || 'Unknown User',
      created_at: post.timestamp || new Date().toISOString(),
      likes_count: post.likes || 0,
      comments_count: post.comments || 0,
      views_count: post.bookmarks || 0,
      like_status: post.like_status || false,
      save_status: false,
      course_code: post.tags ? post.tags.join(',') : '',
      user_school: '',
      tags: post.tags || [],
    };
  } else {
    // Fallback for empty props
    normalizedData = {
      id: 0,
      title: 'Untitled',
      body: '',
      user_temp_name: 'Unknown User',
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      views_count: 0,
      like_status: false,
      save_status: false,
      course_code: '',
      user_school: '',
      tags: [],
    };
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/article/${normalizedData.id}`);
    }
  };

  const renderTags = () => {
    const tags = [];
    
    // Add school tag
    if (normalizedData.user_school) {
      tags.push(normalizedData.user_school);
    }
    
    // Add tags from normalized data
    if (normalizedData.tags && normalizedData.tags.length > 0) {
      tags.push(...normalizedData.tags);
    }

    return tags.slice(0, 3).map((tag, index) => (
      <View key={index} style={[externalStyles?.tagBadge || styles.tagBadge, { backgroundColor: getTagColor(tag) }]}>
        <Text style={externalStyles?.tagText || styles.tagText}>{tag}</Text>
      </View>
    ));
  };

  return (
    <TouchableOpacity style={externalStyles?.postCard || styles.postCard} onPress={handlePress} activeOpacity={0.7}>
      <View style={externalStyles?.postHeader || styles.postHeader}>
        <View style={externalStyles?.userInfo || styles.userInfo}>
          <View style={externalStyles?.userAvatar || styles.userAvatar}>
            <Text style={externalStyles?.userAvatarText || styles.userAvatarText}>
              {normalizedData.user_temp_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={externalStyles?.userName || styles.userName}>@{normalizedData.user_temp_name}</Text>
            <Text style={externalStyles?.postTimestamp || styles.postTimestamp}>· {getRelativeTime(normalizedData.created_at)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={externalStyles?.postTitle || styles.postTitle} numberOfLines={2}>
        {normalizedData.title}
      </Text>
      
      <Text style={externalStyles?.postContent || styles.postContent} numberOfLines={3}>
        {normalizedData.body}
      </Text>
      
      <View style={externalStyles?.postTags || styles.postTags}>
        {renderTags()}
      </View>
      
      <View style={externalStyles?.postActions || styles.postActions}>
        <View style={externalStyles?.actionItem || styles.actionItem}>
          <Ionicons
            name={normalizedData.like_status ? 'heart' : 'heart-outline'}
            size={18}
            color={normalizedData.like_status ? '#e11d48' : '#666'}
          />
          <Text style={externalStyles?.actionText || styles.actionText}>{normalizedData.likes_count}</Text>
        </View>
        
        <View style={externalStyles?.actionItem || styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={externalStyles?.actionText || styles.actionText}>{normalizedData.comments_count}</Text>
        </View>
        
        <View style={externalStyles?.actionItem || styles.actionItem}>
          <MaterialCommunityIcons
            name={normalizedData.save_status ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={normalizedData.save_status ? '#3B82F6' : '#666'}
          />
          <Text style={externalStyles?.actionText || styles.actionText}>{normalizedData.views_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  postTimestamp: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PostCard;