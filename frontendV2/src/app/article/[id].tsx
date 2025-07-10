
import { Animated as RNAnimated } from 'react-native';
import { ArticleType, CommentType, InitialDataType } from '@/constants/types';
import { useRoute, RouteProp } from '@react-navigation/native';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import OverflowMenu from '@/components/ThemedOverflowMenu';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useArticlesStore } from '@/store/articleStore';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedComment from '@/components/ThemedComment';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import {fetchAPI, getData} from "@/components/Utils";
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import { useLayoutEffect } from 'react';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import URLs from "@/constants/Urls";

const styles = StyleSheet.create({
  container: { flex: 1 },
  feedContainer: {
    alignItems: 'stretch',
  },
  NCF: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  commentBarContainer: {
    height: 60,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  focusedCommentContainer: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15,
  },
});

export default function ArticlePage() {
  // Local states
  const [focusedComment, setFocusedComment] = useState<{ parent: any; child: any } | null>(null);
  const [isReply, setIsReply] = useState<boolean>(false);
  const [orgComment, setOrgComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Separate state for comment input:
  const [newComment, setNewComment] = useState('');

  // Article & comments data
  const [initialData, setInitialData] = useState<InitialDataType>();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [nextCommentPage, setNextCommentPage] = useState(null);

  // UI transitions
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const fetchedCommentPage = useRef(null);

  // Navigation & theming
  const navigation = useNavigation();
  const route = useRoute();

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const articleId = (route.params as { id: string }).id;
  const articlesById = useArticlesStore((s) => s.articlesById) || {};
  const article = articlesById[Number(articleId)] || null;

  // Menu visibility
  const [menuVisible, setMenuVisible] = useState(false);


  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: DEFAULT_CARD_BACKGROUND, // navbar background
        // shadowColor: 'transparent', // remove iOS bottom border
        elevation: 0, // remove Android shadow
        borderWidth: 0, 
      },
      headerTintColor: DEFAULT_TEXT,
      headerTitleAlign: 'center',
      headerTitle: 'Article',    
            headerRight: () =>
        initialData &&
        article &&
        initialData.id === article.user &&
        !article.deleted ? (
          <Feather
            name="more-vertical"
            size={24}
            color={DEFAULT_TEXT}
            style={{ marginRight: 16 }}
            onPress={() => setMenuVisible(true)}
          />
        ) : null,
    });
  }, [navigation, article, initialData, loading]);

  // Fetch initial user data
  useEffect(() => {
    const fetchInitialData = async () => {
      const stored = await getData('initialData');
      if (stored) setInitialData(JSON.parse(stored));
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Once initialData is ready, fetch article details
    if (initialData) fetchArticle();
  }, [initialData]);

  // Assign text to orgComment whenever user selects a comment to edit/reply
  useEffect(() => {
    let body = '';
    if (focusedComment) {
      const parentComment = comments.find(
        (comment) => String(comment.id) === String(focusedComment.parent)
      );
      body = parentComment?.body ?? '';
      if (parentComment && parentComment.nested_comments && focusedComment.child) {
        const childComment = parentComment.nested_comments.find(
          (nestedComment) => String(nestedComment.id) === String(focusedComment.child)
        );
        body = childComment?.body ?? '';
      }
    }
    setOrgComment(body);
    isReply ? setNewComment('') : setNewComment(body);
  }, [focusedComment, isReply, comments]);

  // Fade-in effect after loading
  useEffect(() => {
    if (loading) {
      contentOpacity.setValue(0);
    } else {
      RNAnimated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, contentOpacity]);

  // Fetch article & comments
  const fetchArticle = async () => {
    setLoading(true);
    const response = await fetchAPI(URLs.ARTICLE(articleId), {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      useArticlesStore
        .getState()
        .updateArticle(Number(articleId), response.data?.results?.article);
      setComments(response.data?.results?.comments || []);
      setNextCommentPage(response.data?.next);
      fetchedCommentPage.current = null;
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || 'An error occurred'}!`,
      });
    }
    setLoading(false);
  };

  // Handling infinite scroll for top-level comments
  const fetchMoreComments = async () => {
    if (!nextCommentPage || nextCommentPage === fetchedCommentPage.current) return;
    const response = await fetchAPI(nextCommentPage, { method: 'GET', token: true });
    if (!response.error) {
      setComments((prev) => [...prev, ...response.data?.results?.comments]);
      fetchedCommentPage.current = nextCommentPage;
      setNextCommentPage(response.data?.next);
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || 'An error occurred'}!`,
      });
    }
  };

  const fetchNestedComments = async (commentId: string) => {
    let comment = comments.find((comment) => String(comment.id) === String(commentId))
    if (comment?.showReplies) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          String(comment.id) === String(commentId)
            ? { ...comment, showReplies: false }
            : comment
        )
      );
      return;
    }else{
      if (comment?.nested_comments){
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? { ...comment, showReplies: true }
              : comment
          )
        );
        return;
      }
      const response = await fetchAPI(URLs.COMMENT(commentId), { method: 'GET', token: true });
      if (!response.error) {
        // await new Promise(resolve => setTimeout(resolve, 2000));
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? { ...comment,
                  nested_comments: response.data.results.comments,
                  next: response.data.next,
                  showReplies: true,
                }
              : comment
          )
        );
      } else {
        Toast.show({
          type: 'success',
          text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
        });
      }
    }
  };

  // Load more nested comments
   const fetchMoreNestedComments = async (commentId: string) => {
     
     const nextUrl = comments.find(
       comment => String(comment.id) === String(commentId)
     )?.next;
 
     if (!nextUrl) {
       return;
     }
 
     const response = await fetchAPI(
       nextUrl, {
       method: 'GET',
       token: true,
     });
     if (!response.error) {
      // await new Promise(resolve => setTimeout(resolve, 3000));
       setComments((prevComments) =>
         prevComments.map((comment) =>
           String(comment.id) === String(commentId)
             ? { ...comment,
                 nested_comments: [
                   ...comment.nested_comments,
                   ...response.data.results.comments
                 ],
                 next: response.data.next
               }
             : comment
         )
       );
     } else {
       Toast.show({
         type: 'success',
         text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
       });
     }
   };

  // Send top-level comment
  const sendComment = async () => {
    const response = await fetchAPI(
      URLs.COMMENT(), {
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
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  }; 

  // Send nested comment
  const replyComment = async () => {
    const response = await fetchAPI(
      URLs.COMMENT(), {
      method: 'POST',
      token: true,
      body: {
        article: articleId,
        parent_comment: focusedComment?.parent,
        body: newComment,
      }
    });
    if (!response.error) {
      const focusedCommentData = comments.find(
        comment => String(comment.id) === String(focusedComment?.parent)
      );
      if (focusedCommentData?.showReplies) {
        setComments(prevComments =>
          prevComments.map(comment => {
            if (String(comment.id) !== String(focusedComment?.parent)) return comment;
            const nested = comment.nested_comments ?? [];
            return {
              ...comment,
              showReplies: true,
              comments_count: comment.comments_count + 1,
              nested_comments: [
                { ...response.data, id: response.data.id, like_status: response.data.like_status },
                ...nested
              ]
            };
          })
        );
      } else {
        fetchNestedComments(focusedComment?.parent.toString());
      }
      setNewComment('');
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  };  

  // Edit comment
  const editComment = async () => {
    const response = await fetchAPI(
      URLs.COMMENT(
        String(focusedComment?.child ? focusedComment?.child : focusedComment?.parent) + '/'
      ), {
      method: 'PATCH',
      token: true,
      body: {
        body: newComment,
      }
    });
    if (!response.error) {
      focusedComment?.child ?
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(focusedComment.parent)
              ? { ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: CommentType) =>
                    String(nestedComment.id) === String(focusedComment.child)
                      ? { ...nestedComment,
                          body: newComment,
                          edited: true
                        }
                      : nestedComment
                  ),
                }
              : comment
          )
        )
        :
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(focusedComment?.parent)
              ? { ...comment,
                  body: newComment,
                  edited: true
                }
              : comment
          )
        )
      setFocusedComment(null)
      setNewComment('');
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string, parent_commentId: string | null) => {
    const response = await fetchAPI(
      URLs.COMMENT(String(commentId) + '/'), {
      method: 'DELETE',
      token: true,
      body: {}
    });
    if (!response.error) {
      parent_commentId ?
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(parent_commentId)
              ? { ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: CommentType) =>
                    String(nestedComment.id) === String(commentId)
                      ? { ...nestedComment,
                          body: '[DELETED CONTENT]',
                          deleted: true
                        }
                      : nestedComment
                  ),
                }
              : comment
          )
        )
        :
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(commentId)
              ? { ...comment,
                  body: '[DELETED CONTENT]',
                  deleted: true
                }
              : comment
          )
        )
      setFocusedComment(null)
      setNewComment('');
    } else {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  };

  // Like/unlike comment
  const likeComment = async (commentId: string, parent_commentId: string | null) => {
    let url = '';
    if (parent_commentId) {
      url = comments.find((comment) => 
        String(comment.id) === String(parent_commentId)
      )?.nested_comments.find(
        (nestedComment: CommentType) => 
        String(nestedComment.id) === String(commentId)
      )?.like_status
        ? URLs.COMMENT_UNLIKE(commentId)  
        : URLs.COMMENT_LIKE(commentId);
    }
    else {
      url = comments.find((comment) => String(comment.id) === String(commentId))?.like_status
        ? URLs.COMMENT_UNLIKE(commentId)  
        : URLs.COMMENT_LIKE(commentId);
    };
    const response = await fetchAPI(url, { method: 'POST', token: true });
    if (!response.error) {
      if (parent_commentId) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(parent_commentId)
              ? { ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: CommentType) =>
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
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  };

  // Render each comment
  const renderItem = useCallback(
    ({ item }: { item: CommentType }) => (
      <ThemedComment
        commentData={item}
        setFocusedComment={setFocusedComment}
        isReplying={setIsReply}
        isUnicon={article?.unicon}
        likeComment={likeComment}
        deleteComment={deleteComment}
        fetchNestedComments={fetchNestedComments}
        fetchMoreNestedComment={fetchMoreNestedComments}
        initialData={initialData}
      />
    ),
    [comments, initialData]
  );

  // Delete article
  const handleDelete = async () => {
    if (!article || !article.title || !article.body) {
      Toast.show({ type: 'error', text1: 'Title and body cannot be empty!' });
      return;
    }
    setLoading(true);
    const response = await fetchAPI(URLs.ARTICLE(String(articleId)), {
      method: 'DELETE',
      token: true,
      body: {},
    });
    if (!response.error) {
      useArticlesStore.getState().updateArticle(article.id, {
        ...article,
        title: '[DELETED ARTICLE]',
        body: '[DELETED CONTENT]',
        tag: [],
        deleted: true,
      });
      Toast.show({ type: 'success', text1: response.data?.detail || 'Article deleted!' });
    } else {
      Toast.show({ type: 'error', text1: response?.data?.detail || 'An error occurred!' });
    }
    setLoading(false);
  };

  return (
    <>
      <ThemedView style={styles.container}>
        {loading ? null : (
          <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.feedContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <ThemedView style={styles.NCF}>
                  <ThemedText size='h3' font='textMedium' color="gray" >No comments found.</ThemedText>
                </ThemedView>
              }
              ListHeaderComponent={
                article ? (
                  <ThemedArticle initialData={initialData} type="detail" articleData={article} />
                ) : null
              }
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews
              onEndReachedThreshold={0.5}
              onEndReached={fetchMoreComments}
            />
          </Animated.View>
        )}
      </ThemedView>
      {focusedComment && (
        <ThemedView style={styles.focusedCommentContainer}>
          <ThemedText>
            {isReply ? 'You are replying to ' : 'You are editing '}
            {orgComment}
          </ThemedText>
          <ThemedButton type="feedChecked" onPress={() => setFocusedComment(null)}>
            <Feather name="x" size={13} color="#000" />
          </ThemedButton>
        </ThemedView>
      )}
      <ThemedView style={[styles.commentBarContainer, { backgroundColor: DEFAULT_CARD_BACKGROUND }]}>
        <ThemedInput
          type="comment"
          placeholder="Add Comments"
          value={newComment}
          onChangeText={setNewComment}
        />
        <ThemedButton
          type="feedChecked"
          onPress={focusedComment ? (isReply ? replyComment : editComment) : sendComment}
        >
          <AntDesign name="arrowright" size={25} color={ALWAYS_BLACK} />
        </ThemedButton>
      </ThemedView>
      <OverflowMenu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        options={[
          {
            label: 'Edit',
            onPress: () => {
              if (article) {
                router.push({ pathname: '/edit/[id]', params: { id: String(article.id) } });
              }
            },
          },
          {
            label: 'Delete',
            onPress: handleDelete,
          },
        ]}
      />
    </>
  );
}