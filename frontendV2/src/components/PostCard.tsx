import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
            <Text style={styles.postTimestamp}>· {post.timestamp}</Text>
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
      <View style={styles.postActions}>
        <View style={styles.actionItem}>
          <Ionicons name="heart-outline" size={18} color="#666" />
          <Text style={styles.actionText}>{post.likes}</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </View>
        <View style={styles.actionItem}>
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={18}
            color="#666"
          />
          <Text style={styles.actionText}>{post.bookmarks}</Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;