import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

function getTagColor(tag: string): { backgroundColor: string; color: string } {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('school') || tagLower.includes('university')) 
    return { backgroundColor: '#FEE2E2', color: '#EF4444' };
  if (tagLower.includes('lunch') || tagLower.includes('food')) 
    return { backgroundColor: '#DCFCE7', color: '#16A34A' };
  if (tagLower.includes('it') || tagLower.includes('tech') || tagLower.includes('computer')) 
    return { backgroundColor: '#DBEAFE', color: '#2563EB' };
  if (tagLower.includes('study') || tagLower.includes('exam') || tagLower.includes('mid-term')) 
    return { backgroundColor: '#F3E8FF', color: '#9333EA' };
  if (tagLower.includes('event') || tagLower.includes('party')) 
    return { backgroundColor: '#FEF3C7', color: '#D97706' };
  if (tagLower.includes('housing') || tagLower.includes('accommodation')) 
    return { backgroundColor: '#E0F2FE', color: '#0891B2' };
  return { backgroundColor: '#F3F4F6', color: '#6B7280' };
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
  tag?: string;
  image?: string;
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
  onSave?: () => void;
  onTagClick?: (tag: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  article, 
  post, 
  styles: externalStyles, 
  onPress,
  onSave,
  onTagClick
}) => {
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
      hashtag: article.tag || '',
      image: article.image || undefined,
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
      hashtag: post.tags ? post.tags.join(' ') : '',
      image: post.image || undefined,
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
      hashtag: '',
      image: undefined,
    };
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/article/${normalizedData.id}`);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleTagPress = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const getTags = () => {
    const tags = [];
    
    // Add school tag if available
    if (normalizedData.user_school) {
      tags.push(normalizedData.user_school);
    }
    
    // Add course codes if available
    if (normalizedData.course_code) {
      const courseCodes = normalizedData.course_code.split(',').map(code => code.trim()).filter(Boolean);
      tags.push(...courseCodes);
    }
    
    // Add hashtags if available
    if (normalizedData.hashtag) {
      const hashtags = normalizedData.hashtag.split(/[\s,]+/).map(tag => tag.trim()).filter(Boolean);
      tags.push(...hashtags);
    }

    // Remove duplicates and limit to 2 tags (like in your example)
    return [...new Set(tags)].slice(0, 2);
  };

  const tags = getTags();
  const maxLength = 150;
  const shouldTruncate = normalizedData.body.length > maxLength;
  const displayContent = shouldTruncate ? `${normalizedData.body.slice(0, maxLength)}...` : normalizedData.body;

  return (
    <TouchableOpacity style={[
      styles.postCard,
      normalizedData.save_status && styles.savedCard,
      externalStyles?.postCard
    ]} onPress={handlePress} activeOpacity={0.7}>
      
      {/* Header with user info and timestamp */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {normalizedData.user_temp_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>@{normalizedData.user_temp_name.toLowerCase()}</Text>
        </View>
        <Text style={styles.timestamp}>{getRelativeTime(normalizedData.created_at)}</Text>
      </View>
      
      {/* Post title */}
      <Text style={styles.postTitle} numberOfLines={2}>
        {normalizedData.title}
      </Text>
      
      {/* Post content */}
      <View style={styles.contentContainer}>
        <Text style={styles.postContent} numberOfLines={shouldTruncate ? 3 : undefined}>
          {displayContent}
        </Text>
        {shouldTruncate && (
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.seeMoreText}>See more...</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Post image */}
      {normalizedData.image && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: normalizedData.image }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => {
            const tagColors = getTagColor(tag);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.tagBadge, { backgroundColor: tagColors.backgroundColor }]}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, { color: tagColors.color }]}>
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons
            name={normalizedData.like_status ? 'heart' : 'heart-outline'}
            size={16}
            color={normalizedData.like_status ? '#EF4444' : '#9CA3AF'}
          />
          <Text style={[
            styles.actionText,
            normalizedData.like_status && { color: '#EF4444' }
          ]}>
            {normalizedData.likes_count}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
          <Text style={styles.actionText}>{normalizedData.comments_count}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleSave} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={normalizedData.save_status ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={normalizedData.save_status ? '#9333EA' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  savedCard: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDE047',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatarText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingBottom: 8,
    lineHeight: 24,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  imageContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 192,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default PostCard;