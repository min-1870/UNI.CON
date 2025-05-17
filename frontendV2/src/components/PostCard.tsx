import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// PostCard expects props:
// - post: { user, timestamp, title, content, tags, likes, comments, bookmarks, image }
// - styles: StyleSheet object from feed.tsx (for reuse)
interface Post {
  user: string;
  timestamp: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  bookmarks: number;
  image?: string;
}

interface PostCardProps {
  post: Post;
}

const styles = StyleSheet.create({
  
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
    transitionDuration: '200ms',
    transform: [{ scale: 1 }],
    maxWidth: 450,
    alignSelf: 'center',
     
   
  },
  postHeader: {
  
    flexDirection: 'row',
    marginBottom: 10,
    fontFamily: 'Roboto_400Regular',
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
    marginLeft:15,
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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
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