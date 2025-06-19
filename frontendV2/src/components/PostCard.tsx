import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function getRelativeTime(dateString) {
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

// PostCard expects props:
// - post: { user, timestamp, title, content, tags, likes, comments, bookmarks, image }
// - styles: StyleSheet object from feed.tsx (for reuse)
const PostCard = ({ post, styles }) => {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {post.user.charAt(0)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.userName}>@{post.user}</Text>
            <Text style={styles.postTimestamp}>· {getRelativeTime(post.timestamp)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>
        {post.content}
      </Text>
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={{
            width: '100%',
            height: 180,
            borderRadius: 12,
            marginBottom: 12,
            marginTop: 4,
          }}
          resizeMode="cover"
        />
      )}
      <View style={styles.postTags}>
        {post.tags && post.tags.map(tag => (
          <View key={tag} style={styles.postTagBadge}>
            <Text style={styles.postTagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.postActions, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
          <Ionicons
            name={post.like_status ? 'heart' : 'heart-outline'}
            size={18}
            color={post.like_status ? '#e11d48' : '#666'}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
          <Ionicons name="chatbubble-outline" size={18} color="#666" style={{ marginRight: 4 }} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={18}
            color="#666"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.actionText}>{post.bookmarks}</Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;