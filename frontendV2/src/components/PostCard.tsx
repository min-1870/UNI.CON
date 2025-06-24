import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import moment from 'moment';

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

function getTagColor(tag: string, isDark: boolean): { backgroundColor: string; color: string } {
  const tagLower = tag.toLowerCase();
  
  if (tagLower.includes('school') || tagLower.includes('university')) {
    return { 
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', 
      color: isDark ? '#FCA5A5' : '#EF4444' 
    };
  }
  if (tagLower.includes('lunch') || tagLower.includes('food')) {
    return { 
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7', 
      color: isDark ? '#86EFAC' : '#16A34A' 
    };
  }
  if (tagLower.includes('it') || tagLower.includes('tech') || tagLower.includes('computer')) {
    return { 
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE', 
      color: isDark ? '#93C5FD' : '#2563EB' 
    };
  }
  if (tagLower.includes('study') || tagLower.includes('exam') || tagLower.includes('mid-term')) {
    return { 
      backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF', 
      color: isDark ? '#C4B5FD' : '#9333EA' 
    };
  }
  if (tagLower.includes('event') || tagLower.includes('party')) {
    return { 
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', 
      color: isDark ? '#FCD34D' : '#D97706' 
    };
  }
  if (tagLower.includes('housing') || tagLower.includes('accommodation')) {
    return { 
      backgroundColor: isDark ? 'rgba(8, 145, 178, 0.2)' : '#E0F2FE', 
      color: isDark ? '#67E8F9' : '#0891B2' 
    };
  }
  return { 
    backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', 
    color: isDark ? '#D1D5DB' : '#6B7280' 
  };
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const cardBackground = colorScheme === 'dark' ? '#1F2937' : '#FFF'; // Tailwind gray-800 or white
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');

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
  const maxLength = 120; // Reduced for better mobile display
  const shouldTruncate = normalizedData.body.length > maxLength;
  const displayContent = shouldTruncate ? `${normalizedData.body.slice(0, maxLength)}...` : normalizedData.body;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? 'rgba(234, 179, 8, 0.8)' : '#4ade80',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
      color: textColor,
    },
    timestamp: {
      fontSize: 10,
      color: placeholderColor,
      marginBottom: 5,
      textAlign: 'right',
      paddingLeft: 30,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: textColor,
      marginBottom: 8,
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      color: textColor,
      lineHeight: 20,
      marginBottom: 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    footerText: {
      fontSize: 12,
      color: placeholderColor,
      marginLeft: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
     
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(normalizedData.user_temp_name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{normalizedData.user_temp_name || 'Unknown'}   <Text style={styles.timestamp}>{moment(normalizedData.created_at).fromNow()}</Text></Text>

        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>
        {normalizedData.title}
      </Text>
      
      <Text style={styles.body} numberOfLines={3}>
        {displayContent}
      </Text>
      
      {normalizedData.course_code && (
        <View style={styles.tagsContainer}>
          {normalizedData.course_code.split(',').map((tag: string, index: number) => {
            const tagColors = getTagColor(tag.trim(), colorScheme === 'dark');
            return (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: tagColors.backgroundColor }]}
              >
                <Text style={[styles.tagText, { color: tagColors.color }]}>
                  #{tag.trim()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="heart-outline" size={16} color={placeholderColor} />
          <Text style={styles.footerText}>{normalizedData.likes_count || 0}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="chatbubble-outline" size={16} color={placeholderColor} />
          <Text style={styles.footerText}>{normalizedData.comments_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PostCard;