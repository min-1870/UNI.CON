import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
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
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ArticleDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [focusedComment, setFocusedComment] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [slideOut, setSlideOut] = useState(false);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [articleLiked, setArticleLiked] = useState(false);
  const [articleLikes, setArticleLikes] = useState(0);
  const [articleSaved, setArticleSaved] = useState(false);

  // Dynamic color scheme
  const backgroundColor = colorScheme === 'dark' ? '#101214' : '#FFFFFF';
  const cardBackground = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#F9FAFB' : '#222';
  const secondaryTextColor = colorScheme === 'dark' ? '#D1D5DB' : '#666';
  const mutedTextColor = colorScheme === 'dark' ? '#9CA3AF' : '#888';
  const borderColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
  const commentBackground = colorScheme === 'dark' ? '#374151' : '#fafbfc';
  const inputBackground = colorScheme === 'dark' ? '#4B5563' : '#f3f4f6';
  const linkColor = colorScheme === 'dark' ? '#60A5FA' : '#007AFF';
  const tagBackground = colorScheme === 'dark' ? '#374151' : '#F3F4F6';
  const tagTextColor = colorScheme === 'dark' ? '#10B981' : '#00796b';
  const iconColor = colorScheme === 'dark' ? '#9CA3AF' : '#444';

  useEffect(() => {
    // Smooth entry animation
    slideAnim.setValue(1);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    
    // Parallel animations for smooth entry
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      })
    ]).start();
    
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
      const articleData = response.data?.results?.article || null;
      setArticle(articleData);
      setComments(response.data?.results?.comments || []);
      setArticleLiked(articleData?.like_status || false);
      setArticleLikes(articleData?.likes_count || 0);
      setArticleSaved(articleData?.save_status || false);
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

  const handleArticleSave = async () => {
    if (!article) return;
    try {
      const url = articleSaved ? URLs.ARTICLE_UNSAVE(article.id) : URLs.ARTICLE_SAVE(article.id);
      const response = await fetchAPI(url, { 
        method: 'POST', 
        token: true
      });
      
      // Check for successful response
      if (!response.error) {
        setArticleSaved(!articleSaved);
      } else {
        console.error('Save failed:', response);
        setError('Failed to save article. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save article. Please try again.');
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
      try {
        console.log('Fetching nested comments for:', commentId);
        const response = await fetchAPI(URLs.COMMENT(commentId), { method: 'GET', token: true });
        console.log('Nested comments response:', response);
        
        if (!response.error) {
          // Try different response structures
          const nestedComments = response.data?.results?.comments || 
                                response.data?.comments || 
                                response.data?.nested_comments || 
                                response.data || [];
          
          console.log('Extracted nested comments:', nestedComments);
          
          setComments((prevComments) =>
            prevComments.map((comment) =>
              String(comment.id) === String(commentId)
                ? {
                    ...comment,
                    nested_comments: nestedComments,
                    showReplies: true,
                  }
                : comment
            )
          );
        } else {
          console.error('API error:', response);
          setError(response?.data?.detail || 'Failed to load replies');
        }
      } catch (err) {
        console.error('Network error:', err);
        setError('Failed to load replies. Please check your connection.');
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

  // Render nested comments with proper indentation
  const renderNestedComments = (nestedComments: any[], level: number = 1, parentCommentId?: string) => {
    return nestedComments.map((nestedComment) => (
      <View key={nestedComment.id} style={[styles.commentRow, { marginLeft: level * 20 }]}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{(nestedComment.user_temp_name || 'U')[0]}</Text>
        </View>
        <View style={styles.commentContentBox}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentAuthor}>@{nestedComment.user_temp_name || 'Unknown'}</Text>
            <Text style={styles.commentTime}>{moment(nestedComment.created_at).fromNow()}</Text>
          </View>
          <Text style={styles.commentBody}>{nestedComment.body}</Text>
          <View style={styles.commentActionsRow}>
            <Ionicons
              name={nestedComment.like_status ? 'heart' : 'heart-outline'}
              size={16}
              color={nestedComment.like_status ? '#e11d48' : iconColor}
              style={{ marginRight: 2 }}
              onPress={() => likeComment(nestedComment.id, nestedComment.parent_comment)}
            />
            <Text style={styles.commentActionText}>{nestedComment.likes_count}</Text>
            <TouchableOpacity onPress={() => {
              // Reply to the parent comment (the top-level comment), not to the nested comment
              const parentId = parentCommentId || nestedComment.parent_comment;
              setFocusedComment(parentId);
              setReplyPreview(`@${nestedComment.user_temp_name}: ${nestedComment.body}`);
            }}>
              <Text style={styles.replyButton}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ));
  };

  // Combined animation style
  const animationStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, slideOut ? 500 : 500],
        }),
      },
      {
        scale: scaleAnim,
      },
    ],
    opacity: fadeAnim,
  };

  const handleBack = () => {
    setSlideOut(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 300,
        easing: Easing.in(Easing.back(1.1)),
        useNativeDriver: true,
      })
    ]).start(() => {
      router.back();
    });
  };

  const styles = useMemo(() => StyleSheet.create({
    bg: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: secondaryTextColor,
      marginTop: 12,
    },
    animatedContainer: {
      flex: 1,
      width: '100%',
    },
    card: {
      backgroundColor: cardBackground,
      flex: 1,
      width: '100%',
      position: 'relative',
    },
    contentContainer: {
      flex: 1,
      padding: 20,
      paddingTop: 60,
      paddingBottom: 80,
    },
    backLink: {
      color: linkColor,
      marginBottom: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 8,
      color: textColor,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    author: {
      fontSize: 16,
      color: secondaryTextColor,
      fontWeight: '600',
    },
    imageContainer: {
      marginBottom: 16,
    },
    imageWrapper: {
      marginRight: 12,
    },
    body: {
      fontSize: 14,
      color: textColor,
      marginBottom: 16,
      textAlign: 'justify',
      lineHeight: 20,
    },
    tagsRow: {
      flexDirection: 'row',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    },
    tagBadge: {
      backgroundColor: tagBackground,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 6,
      borderWidth: colorScheme === 'dark' ? 1 : 0,
      borderColor: borderColor,
    },
    tagText: {
      fontSize: 13,
      color: tagTextColor,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: borderColor,
      marginVertical: 16,
      width: '100%',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 24,
      paddingVertical: 8,
    },
    statIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    stat: {
      fontSize: 16,
      color: textColor,
    },
    commentsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: textColor,
    },
    commentsContainer: {
      flex: 1,
      marginBottom: 16,
    },
    commentsList: {
      flex: 1,
    },
    noComments: {
      color: mutedTextColor,
      textAlign: 'center',
      marginVertical: 20,
    },
    fixedCommentBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: cardBackground,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    commentInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 80,
      borderRadius: 24,
      backgroundColor: inputBackground,
      paddingHorizontal: 16,
      fontSize: 15,
      color: textColor,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    time: {
      fontSize: 12,
      color: mutedTextColor,
      fontWeight: '400',
      alignSelf: 'flex-end',
      marginBottom: 8,
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
      backgroundColor: commentBackground,
      borderRadius: 12,
      padding: 10,
      borderWidth: colorScheme === 'dark' ? 1 : 0,
      borderColor: borderColor,
    },
    commentHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    commentAuthor: {
      fontWeight: '600',
      color: textColor,
      fontSize: 15,
    },
    commentTime: {
      color: mutedTextColor,
      fontSize: 12,
    },
    commentBody: {
      color: secondaryTextColor,
      fontSize: 15,
      marginBottom: 6,
    },
    commentActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    commentActionText: {
      color: mutedTextColor,
      fontSize: 13,
      marginRight: 8,
    },
    repliesButton: {
      color: linkColor,
      fontSize: 13,
      marginLeft: 12,
      fontWeight: '500',
    },
    replyButton: {
      color: linkColor,
      fontSize: 13,
      marginLeft: 12,
      fontWeight: '500',
    },
    replyPreviewBox: {
      position: 'absolute',
      bottom: 70,
      left: 16,
      right: 16,
      backgroundColor: inputBackground,
      borderRadius: 8,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
      borderWidth: 1,
      borderColor: borderColor,
    },
    replyPreviewText: {
      color: secondaryTextColor,
      fontSize: 13,
      fontStyle: 'italic',
      flex: 1,
    },
  }), [colorScheme, backgroundColor, cardBackground, textColor, secondaryTextColor, mutedTextColor, borderColor, commentBackground, inputBackground, linkColor, tagBackground, tagTextColor, iconColor]);

  return (
    <View style={styles.bg}>
      <Animated.View style={[styles.animatedContainer, animationStyle]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              <Text style={styles.backLink} onPress={handleBack}>&larr; Back to feed</Text>
              {loading && !article ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#57EC6B" />
                  <Text style={styles.loadingText}>Loading article...</Text>
                </View>
              ) : error ? (
                <ThemedText type="error">{error}</ThemedText>
              ) : article ? (
                <>
                  <Text style={styles.time}>{moment(article.created_at).fromNow()}</Text>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>{article.title}</Text>
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
                  
                  {/* Divider between content and toolbar */}
                  <View style={styles.divider} />
                  
                  {/* Action toolbar - removed comment button */}
                  <View style={styles.statsRow}>
                    <View style={styles.statIconRow}>
                      <Ionicons
                        name={articleLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={articleLiked ? '#e11d48' : iconColor}
                        style={{ marginRight: 4 }}
                        onPress={handleArticleLike}
                      />
                      <Text style={styles.stat}>{articleLikes}</Text>
                    </View>
                    <View style={styles.statIconRow}>
                      <Ionicons
                        name={articleSaved ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={articleSaved ? '#f59e0b' : iconColor}
                        style={{ marginRight: 4 }}
                        onPress={handleArticleSave}
                      />
                    </View>
                    <View style={styles.statIconRow}>
                      <MaterialCommunityIcons name="share-outline" size={20} color={iconColor} style={{ marginRight: 4 }} />
                    </View>
                  </View>
                  
                  <Text style={styles.commentsTitle}>Comments</Text>
                  <View style={styles.commentsContainer}>
                    <FlatList
                      data={comments}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View>
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
                                  color={item.like_status ? '#e11d48' : iconColor}
                                  style={{ marginRight: 2 }}
                                  onPress={() => likeComment(item.id, null)}
                                />
                                <Text style={styles.commentActionText}>{item.likes_count}</Text>
                                <Ionicons
                                  name="chatbubble-outline"
                                  size={18}
                                  color={iconColor}
                                  style={{ marginLeft: 12, marginRight: 2 }}
                                  onPress={() => {
                                    setFocusedComment(item.id);
                                    setReplyPreview(item.body);
                                  }}
                                />
                                <Text style={styles.commentActionText}>{item.comments_count}</Text>
                                {item.comments_count > 0 && (
                                  <Text 
                                    style={styles.repliesButton} 
                                    onPress={() => fetchNestedComments(item.id)}
                                  >
                                    {item.showReplies ? 'Hide replies' : `${item.comments_count} replies`}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                          {/* Render nested comments with indentation */}
                          {item.showReplies && item.nested_comments && renderNestedComments(item.nested_comments, 1, item.id)}
                        </View>
                      )}
                      ListEmptyComponent={<Text style={styles.noComments}>No comments yet.</Text>}
                      showsVerticalScrollIndicator={true}
                      style={styles.commentsList}
                      nestedScrollEnabled={true}
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  </View>
                </>
              ) : null}
            </View>
            
            {/* Fixed comment input bar at bottom */}
            {replyPreview && (
              <View style={styles.replyPreviewBox}>
                <Text style={styles.replyPreviewText}>Replying to: "{replyPreview.length > 40 ? replyPreview.slice(0, 40) + '...' : replyPreview}"</Text>
                <Ionicons name="close" size={18} color={mutedTextColor} style={{ marginLeft: 8 }} onPress={() => { setFocusedComment(null); setReplyPreview(null); }} />
              </View>
            )}
            <View style={styles.fixedCommentBar}>
              <ThemedInput
                type="comment"
                value={newComment}
                onChangeText={setNewComment}
                placeholder={focusedComment ? 'Reply to comment...' : 'Add a comment...'}
                onSubmitEditing={focusedComment ? handleReplyComment : handleSendComment}
                returnKeyType="send"
                style={[styles.commentInput, { color: textColor }]}
                placeholderTextColor={mutedTextColor}
              />
              <ThemedButton onPress={focusedComment ? handleReplyComment : handleSendComment} variant="primary">
                <Ionicons name="checkmark-outline" size={25} color="#FFFFFF" />
              </ThemedButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}