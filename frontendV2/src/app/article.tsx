import { StyleSheet, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, Image, TextInput } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedComment from '@/components/ThemedComment';
import ThemedInput from '@/components/ThemedInput';
import React, { useState, useEffect } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ArticlePage() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { id: string } }>>();
  const articleId = route.params?.id;

  const [nextCommentPage, setNextCommentPage] = useState(null);
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
  const [newComment, setNewComment] = useState('');
  const [focusedComment, setFocusedComment] = useState<number | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleLiked, setArticleLiked] = useState(false);
  const [articleLikesCount, setArticleLikesCount] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, []);

  useEffect(() => {
    if (article) {
      setArticleLiked(!!article.like_status);
      setArticleLikesCount(article.likes_count || 0);
    }
  }, [article]);

  const fetchArticle = async () => {
    setLoading(true);
    setArticleLoading(true);
    const response = await fetchAPI(
      `${API_URL}/community/article/${articleId}/`, {
      method: 'GET',
      token: true,
    });
    console.log('Article response:', response);
    if (!response.error) {
      const article = response.data?.results?.article || response.data?.article || response.data?.results || response.data || null;
      setArticle(article);
      setComments(response.data?.results?.comments || response.data?.comments || []);
      setHeaderContent(<ThemedArticle type={'detail'} article_data={article} />);
    } else {
      setError(response?.data?.detail || "An error occurred");
      console.error('Article error:', response.data);
    }
    setLoading(false);
    setArticleLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const response = await fetchAPI(
      `${API_URL}/community/comment/`, {
      method: 'POST',
      token: true,
      body: {
        article: articleId,
        body: newComment,
      }
    });
    if (!response.error) {
      setComments((prevComments) => [
        {
          ...response.data,
          id: response.data.id,
          body: response.data.body,
          user_temp_name: response.data.user_temp_name,
          user_static_points: response.data.user_static_points,
          user_school: response.data.user_school,
          like_status: response.data.like_status,
        },
        ...prevComments,
      ]);
      setNewComment('');
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
  };

  const handleLikeArticle = async () => {
    if (!article) return;
    const url = `${API_URL}/community/article/${article.id}/${articleLiked ? 'unlike' : 'like'}/`;
    const response = await fetchAPI(url, { method: 'POST', token: true });
    if (!response.error) {
      setArticleLiked(!articleLiked);
      setArticleLikesCount(prev => prev + (articleLiked ? -1 : 1));
    } else {
      setError(response?.data?.detail || 'Failed to like article');
    }
  };

  const likeComment = async (commentId: string, parent_commentId: string | null) => {
    let url = '';
    if (parent_commentId) {
      url = comments.find((comment) => comment.id === parent_commentId)?.nested_comments.find((nestedComment: { id: string; }) => nestedComment.id === commentId)?.like_status
        ? `${API_URL}/community/comment/${commentId}/unlike/`  
        : `${API_URL}/community/comment/${commentId}/like/`;
    }
    else {
      url = comments.find((comment) => comment.id === commentId)?.like_status
        ? `${API_URL}/community/comment/${commentId}/unlike/`
        : `${API_URL}/community/comment/${commentId}/like/`;
    };
    const response = await fetchAPI(url, { method: 'POST', token: true });
    if (!response.error) {
      if (parent_commentId) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(parent_commentId)
              ? { ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: { id: string, like_status: boolean, likes_count: number;}) =>
                    String(nestedComment.id) === String(commentId)
                      ? { ...nestedComment,
                          like_status: !nestedComment.like_status,
                          likes_count: nestedComment.likes_count + (nestedComment.like_status ? -1 : 1),
                        }
                      : nestedComment
                  ),
                }
              : comment
          )
        );
      }
      else{
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? { ...comment,
                  like_status: !comment.like_status,
                  likes_count: comment.likes_count + (comment.like_status ? -1 : 1),
                }
              : comment
          )
        );
      }
    } else {
      setError(response?.data?.detail || "An error occurred");
      console.log(response);
    }
  };

  const fetchNestedComments = async (commentId: string) => {
    let comment = comments.find((comment) => comment.id === commentId)
    if (comment?.showReplies) {
      console.log("Hide replies")
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, showReplies: false, nested_comments: [] }
            : comment
        )
      );
      return;
    }else{
      const url = `${API_URL}/community/comment/${commentId}`;
      const response = await fetchAPI(url, { method: 'GET', token: true });
      if (!response.error) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? { ...comment,
                  nested_comments: response.data.results.comments,
                  showReplies: true,
                }
              : comment
          )
        );
      } else {
        setError(response?.data?.detail || "An error occurred");
      }
    }
  };

  const handleReplyComment = async () => {
    const response = await fetchAPI(
      `${API_URL}/community/comment/`, {
      method: 'POST',
      token: true,
      body: {
        article: articleId,
        parent_comment: focusedComment,
        body: newComment,
      }
    });
    if (!response.error) {

       setComments((prevComments) => 
        prevComments.map((comment) =>
          String(comment.id) === String(focusedComment)
            ? { ...comment, showReplies: false, nested_comments: [] }
            : comment
        )
      );
      if (focusedComment !== null) {
        fetchNestedComments(focusedComment.toString());
      }
      setNewComment('');
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Back to feed</Text>
        </View>

        {article && (
          <View style={styles.articleContainer}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.username}>@{article.user_temp_name || 'Unknown'}</Text>
            <Text style={styles.articleBody}>{article.body}</Text>

            {article.image && (
              <Image source={{ uri: article.image }} style={styles.mainImage} resizeMode="cover" />
            )}
            <View style={styles.tagsRow}>
              {(article.course_code ? article.course_code.split(',') : []).map((tag: string) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag.trim()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionItem} onPress={handleLikeArticle}>
                <Ionicons name={articleLiked ? 'heart' : 'heart-outline'} size={20} color={articleLiked ? '#e11d48' : '#666'} />
                <Text style={styles.actionText}>{articleLikesCount}</Text>
              </TouchableOpacity>
              <View style={styles.actionItem}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
                <Text style={styles.actionText}>{article.comments_count || 0}</Text>
              </View>
              <View style={styles.actionItem}>
                <MaterialCommunityIcons name="share-outline" size={20} color="#666" />
              </View>
            </View>

          </View>
        )}

        <Text style={styles.commentsTitle}>Comments</Text>
        {loading || articleLoading ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
        ) : error ? (
          <Text style={{ textAlign: 'center', color: 'red', marginTop: 20 }}>{error}</Text>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>@{item.user_temp_name || 'User'}</Text>
                  <Text style={styles.commentTime}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
                </View>
                <Text style={styles.commentBody}>{item.body}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No comments yet.</Text>}
          />
        )}

        {/* New Comment Input */}
        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.commentPostButton} onPress={handleSendComment}>
            <Text style={styles.commentPostButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    marginTop:30,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  articleContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  username: {
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#222',
    paddingHorizontal: 10,
  },
  commentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 8,
  },
  commentTime: {
    color: '#888',
    fontSize: 12,
  },
  commentBody: {
    color: '#222',
    fontSize: 15,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 10,
    color: '#222',
  },
  commentPostButton: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  commentPostButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  articleBody: {
    color: '#222',
    fontSize: 15,
  },
});
