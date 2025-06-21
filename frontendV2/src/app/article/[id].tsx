import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedComment from '@/components/ThemedComment';
import ThemedInput from '@/components/ThemedInput';
import { fetchAPI } from '@/components/Utils';
import URLs from '@/constants/Urls';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';

export default function ArticleDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [focusedComment, setFocusedComment] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1));
  const [slideOut, setSlideOut] = useState(false);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [articleLiked, setArticleLiked] = useState(false);
  const [articleLikes, setArticleLikes] = useState(0);

  useEffect(() => {
    // Slide in animation
    slideAnim.setValue(1);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    const response = await fetchAPI(
      URLs.ARTICLE(id as string), {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticle(response.data?.results?.article || null);
      setComments(response.data?.results?.comments || []);
      setArticleLiked(response.data?.results?.article?.like_status || false);
      setArticleLikes(response.data?.results?.article?.likes_count || 0);
    } else {
      setError(response?.data?.detail || 'An error occurred');
    }
    setLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const response = await fetchAPI(
      URLs.COMMENT(), {
      method: 'POST',
      token: true,
      body: {
        article: id,
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
      setError(response?.data?.detail || 'An error occurred');
    }
  };

  const handleArticleLike = async () => {
    if (!article) return;
    const url = articleLiked ? URLs.ARTICLE_UNLIKE(article.id) : URLs.ARTICLE_LIKE(article.id);
    const response = await fetchAPI(url, { method: 'POST', token: true });
    if (!response.error) {
      setArticleLiked(!articleLiked);
      setArticleLikes(articleLikes + (articleLiked ? -1 : 1));
    }
  };

  const likeComment = async (commentId: string, parent_commentId: string | null) => {
    let url = '';
    if (parent_commentId) {
      url = comments.find((comment) => comment.id === parent_commentId)?.nested_comments.find((nestedComment: { id: string; }) => nestedComment.id === commentId)?.like_status
        ? URLs.COMMENT_UNLIKE(commentId)
        : URLs.COMMENT_LIKE(commentId);
    } else {
      url = comments.find((comment) => comment.id === commentId)?.like_status
        ? URLs.COMMENT_UNLIKE(commentId)
        : URLs.COMMENT_LIKE(commentId);
    }
    const response = await fetchAPI(url, { method: 'POST', token: true });
    if (!response.error) {
      if (parent_commentId) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(parent_commentId)
              ? {
                  ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: { id: string; like_status: boolean; likes_count: number }) =>
                    String(nestedComment.id) === String(commentId)
                      ? {
                          ...nestedComment,
                          like_status: !nestedComment.like_status,
                          likes_count: nestedComment.likes_count + (nestedComment.like_status ? -1 : 1),
                        }
                      : nestedComment
                  ),
                }
              : comment
          )
        );
      } else {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? {
                  ...comment,
                  like_status: !comment.like_status,
                  likes_count: comment.likes_count + (comment.like_status ? -1 : 1),
                }
              : comment
          )
        );
      }
    } else {
      setError(response?.data?.detail || 'An error occurred');
    }
  };

  const fetchNestedComments = async (commentId: string) => {
    let comment = comments.find((comment) => comment.id === commentId);
    if (comment?.showReplies) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, showReplies: false, nested_comments: [] }
            : comment
        )
      );
      return;
    } else {
      const response = await fetchAPI(URLs.COMMENT(commentId), { method: 'GET', token: true });
      if (!response.error) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? {
                  ...comment,
                  nested_comments: response.data.results.comments,
                  showReplies: true,
                }
              : comment
          )
        );
      } else {
        setError(response?.data?.detail || 'An error occurred');
      }
    }
  };

  const handleReplyComment = async () => {
    if (!newComment.trim() || !focusedComment) return;
    const response = await fetchAPI(
      URLs.COMMENT(), {
      method: 'POST',
      token: true,
      body: {
        article: id,
        parent_comment: focusedComment,
        body: newComment,
      }
    });
    if (!response.error) {
      fetchNestedComments(focusedComment);
      setNewComment('');
      setFocusedComment(null);
      setReplyPreview(null);
    } else {
      setError(response?.data?.detail || 'An error occurred');
    }
  };

  // Slide animation style
  const slideStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, slideOut ? 500 : 500], // Slide in from right, out to right
        }),
      },
    ],
  };

  const handleBack = () => {
    setSlideOut(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  return (
    <View style={styles.bg}>
      <Animated.View style={[styles.animatedContainer, slideStyle]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.card}>
            <Text style={styles.backLink} onPress={handleBack}>&larr; Back to feed</Text>
            {loading ? (
              <ThemedText>Loading...</ThemedText>
            ) : error ? (
              <ThemedText type="error">{error}</ThemedText>
            ) : article ? (
              <>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{article.title}</Text>
                  <Text style={styles.time}>{moment(article.created_at).fromNow()}</Text>
                </View>
                <View style={styles.authorRow}>
                  <Text style={styles.author}>@{article.user_temp_name || 'Unknown'}</Text>
                </View>
                {article.image && (
                  <View style={styles.imageContainer}>
                    <FlatList
                      data={Array.isArray(article.image) ? article.image : [article.image]}
                      horizontal
                      renderItem={({ item }) => (
                        <View style={styles.imageWrapper}>
                          <img src={item} alt="article" style={{ width: 300, height: 180, borderRadius: 12, objectFit: 'cover' }} />
                        </View>
                      )}
                      keyExtractor={(_, idx) => String(idx)}
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                )}
                <Text style={styles.body}>{article.body}</Text>
                <View style={styles.tagsRow}>
                  {article.course_code && article.course_code.split(',').map((tag: string) => (
                    <View key={tag} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statIconRow}>
                    <Ionicons
                      name={articleLiked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={articleLiked ? '#e11d48' : '#444'}
                      style={{ marginRight: 4, cursor: 'pointer' }}
                      onPress={handleArticleLike}
                    />
                    <Text style={styles.stat}>{articleLikes}</Text>
                  </View>
                  <View style={styles.statIconRow}>
                    <Ionicons name="chatbubble-outline" size={20} color="#444" style={{ marginRight: 4 }} />
                    <Text style={styles.stat}>{article.comments_count}</Text>
                  </View>
                  <View style={styles.statIconRow}>
                    <MaterialCommunityIcons name="share-outline" size={20} color="#444" style={{ marginRight: 4 }} />
                  </View>
                </View>
                <Text style={styles.commentsTitle}>Comments</Text>
                <View style={styles.commentsContainer}>
                  <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.commentRow}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>{(item.user_temp_name || 'U')[0]}</Text>
                        </View>
                        <View style={styles.commentContentBox}>
                          <View style={styles.commentHeaderRow}>
                            <Text style={styles.commentAuthor}>@{item.user_temp_name || 'Unknown'}</Text>
                            <Text style={styles.commentTime}>{moment(item.created_at).fromNow()}</Text>
                          </View>
                          <Text style={styles.commentBody}>{item.body}</Text>
                          <View style={styles.commentActionsRow}>
                            <Ionicons
                              name={item.like_status ? 'heart' : 'heart-outline'}
                              size={18}
                              color={item.like_status ? '#e11d48' : '#666'}
                              style={{ marginRight: 2 }}
                              onPress={() => likeComment(item.id, null)}
                            />
                            <Text style={styles.commentActionText}>{item.likes_count}</Text>
                            <Ionicons
                              name="chatbubble-outline"
                              size={18}
                              color="#666"
                              style={{ marginLeft: 12, marginRight: 2 }}
                              onPress={() => {
                                setFocusedComment(item.id);
                                setReplyPreview(item.body);
                              }}
                            />
                            <Text style={styles.commentActionText}>{item.comments_count}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    ListEmptyComponent={<Text style={styles.noComments}>No comments yet.</Text>}
                    showsVerticalScrollIndicator={true}
                    style={styles.commentsList}
                    nestedScrollEnabled={true}
                  />
                </View>
                {replyPreview && (
                  <View style={styles.replyPreviewBox}>
                    <Text style={styles.replyPreviewText}>Replying to: "{replyPreview.length > 40 ? replyPreview.slice(0, 40) + '...' : replyPreview}"</Text>
                    <Ionicons name="close" size={18} color="#888" style={{ marginLeft: 8 }} onPress={() => { setFocusedComment(null); setReplyPreview(null); }} />
                  </View>
                )}
                <View style={styles.commentInputRow}>
                  <Ionicons name="chatbubble-outline" size={22} color="#888" style={{ marginRight: 8 }} />
                  <ThemedInput
                    type="comment"
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder={focusedComment ? 'Reply to comment...' : 'Add a comment...'}
                    onSubmitEditing={focusedComment ? handleReplyComment : handleSendComment}
                    returnKeyType="send"
                    style={styles.commentInput}
                  />
                  <ThemedButton onPress={focusedComment ? handleReplyComment : handleSendComment} type="auth" style={styles.commentButton}>
                    Post
                  </ThemedButton>
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
  },
  animatedContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    maxWidth: 700,
    width: '100%',
    minWidth: 320,
    height: '90vh', // Fixed height for uniform card size
    marginVertical: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  backLink: {
    color: '#666',
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
    cursor: 'pointer',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  author: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    marginRight: 12,
  },
  body: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'justify',
  },
  tagsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#00796b',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 24,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  stat: {
    fontSize: 16,
    color: '#444',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  commentsContainer: {
    flex: 1,
    maxHeight: 300, // Limit height to make it scrollable
    marginBottom: 16,
  },
  commentsList: {
    flex: 1,
  },
  noComments: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    fontSize: 15,
  },
  commentButton: {
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#57EC6B',
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#57EC6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: '300',
    fontSize: 15,
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: '#fafbfc',
    borderRadius: 12,
    padding: 10,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#222',
    fontSize: 15,
  },
  commentTime: {
    color: '#aaa',
    fontSize: 12,
  },
  commentBody: {
    color: '#333',
    fontSize: 15,
    marginBottom: 6,
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  commentActionText: {
    color: '#666',
    fontSize: 13,
    marginRight: 8,
  },
  replyPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  replyPreviewText: {
    color: '#444',
    fontSize: 13,
    fontStyle: 'italic',
  },
}); 