
import { Animated as RNAnimated, View } from 'react-native';
import { ArticleType, CommentType, InitialDataType } from '@/constants/types';
import { useRoute, RouteProp } from '@react-navigation/native';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import ThemedOverflowMenu from '@/components/ThemedOverflowMenu';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Feather, Octicons } from '@expo/vector-icons';
import { useArticlesStore } from '@/store/articleStore';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedComment from '@/components/ThemedComment';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import {fetchAPI, getData} from "@/components/Utils";
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { useLayoutEffect } from 'react';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';
import ThemedPopup from '@/components/ThemedPopup';
import ThemedBottomSheet from '@/components/ThemedBSheet';

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
  button:{
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    gap: 10,
  },
});

export default function ArticlePage() {
  
  const [bSheetVisible, setBSheetVisible] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupBody, setPopupBody] = useState('');
  const [popupFunction, setPopupFunction] = useState<() => void>(() => () => {});

  const { showToast } = useToast();
  // Local states
  const [focusedComment, setFocusedComment] = useState<{ parent: any; child: any } | null>(null);
  const [bSheetComment, setBSheetComment] = useState<{ parent: any; child: any } | null>(null);
  const [bSheetCommentAuthor, seBSheetCommentAuthor] = useState<any>(null);
  const [bSheetArticleMode, setBSheetArticleMode] = useState<boolean>(true);
  const [bSheetCommentDeleted, setBSheetCommentDeleted] = useState<boolean>(false);
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
  const ERROR_TEXT = useThemeColor({}, 'ERROR_TEXT');
  const articleId = (route.params as { id: string }).id;
  const articlesById = useArticlesStore((s) => s.articlesById) || {};
  const article = articlesById[Number(articleId)] || null;


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
      headerTitle: article.marketplace ? 'Market Place':'Article',    
            headerRight: () =>
        initialData &&
        article &&
        !article.deleted ? (
          <Feather
            name="more-vertical"
            size={24}
            color={DEFAULT_TEXT}
            style={{ marginRight: 16 }}
            onPress={() => {
              setBSheetVisible(true);
              setBSheetArticleMode(true);
            }}
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
        showToast({
          type: 'error',
          text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
       showToast({
         type: 'error',
         text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
       });
     }
   };
  
  
  const handleCommentBSheet = ( parent: any, child: any, author: any , deleted:boolean) => {
    setBSheetComment({ parent, child });
    setBSheetVisible(true);
    setBSheetArticleMode(false);
    seBSheetCommentAuthor(author);
    setBSheetCommentDeleted(deleted);
  }

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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
  };

  // Delete comment
  const deleteComment = async () => {
    const commentId = bSheetComment?.child ? bSheetComment.child : bSheetComment?.parent;
    const response = await fetchAPI(
      URLs.COMMENT(String(commentId) + '/'), {
      method: 'DELETE',
      token: true,
      body: {}
    });
    if (!response.error) {
      showToast({
        type: 'success',
        text1: response.data?.detail || 'Comment deleted!',
      });
      bSheetComment?.child ?
        setComments((prevComments) =>
          prevComments.map((comment) =>
            String(comment.id) === String(bSheetComment.parent)
              ? { ...comment,
                  nested_comments: comment.nested_comments.map((nestedComment: CommentType) =>
                    String(nestedComment.id) === String(bSheetComment.child)
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setBSheetVisible(false);
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
        fetchNestedComments={fetchNestedComments}
        fetchMoreNestedComment={fetchMoreNestedComments}
        handleCommentBSheet={handleCommentBSheet}
        initialData={initialData}
      />
    ),
    [comments, initialData]
  );

  // Delete article
  const handleDelete = async () => {
    if (!article || !article.title || !article.body) {
      showToast({ type: 'error', text1: 'Title and body cannot be empty!' });
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
      showToast({ type: 'success', text1: response.data?.detail || 'Article deleted!' });
    } else {
      showToast({ type: 'error', text1: response?.data?.detail || 'An error occurred!' });
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
      {article && (
        <ThemedBottomSheet visible={bSheetVisible} onDismiss={() => {setBSheetVisible(false)}} height={
          article.user === initialData?.id 
            ? 200 
            : !bSheetArticleMode
            ? Number(bSheetCommentAuthor) === initialData?.id && !bSheetCommentDeleted
              ? 160
              : 85 
            : 120
          }>
          <View style={{ flex: 1, gap: 20, paddingVertical: 10 }}>
            {bSheetArticleMode ? (
              <>
                <Pressable style={styles.button} onPress={()=>(showToast({ type: 'info', text1: 'This feature is not implemented yet.' }))}>
                  <Octicons style={{marginTop:2}} name="share" size={15} color={DEFAULT_TEXT} />
                  <ThemedText> Share </ThemedText>
                </Pressable>
                {article.user === initialData?.id && (
                  <Pressable style={styles.button} onPress={() => {
                    setBSheetVisible(false);
                    router.push({
                      pathname: '/(tabs)/post',
                      params: { id: articleId },
                    });
                  }}>
                    <Octicons style={{marginTop:2}} name="pencil" size={15} color={DEFAULT_TEXT} />
                    <ThemedText> Edit </ThemedText>
                  </Pressable>
                )}
                <Pressable style={styles.button} onPress={()=>(showToast({ type: 'info', text1: 'This feature is not implemented yet.' }))}>
                  <Octicons style={{marginTop:2}} name="report" size={15} color={ERROR_TEXT} />
                  <ThemedText color='red'> Report </ThemedText>
                </Pressable>
                {article.user === initialData?.id && (
                  <Pressable style={styles.button} onPress={() => {
                    setPopupTitle('Delete Article');
                    setPopupBody('Are you sure you want to delete this article? This action cannot be undone.');
                    setPopupFunction(() => handleDelete);
                    setPopupVisible(true);
                  }}>
                    <Octicons style={{marginTop:2}} name="trash" size={15} color={ERROR_TEXT} />
                    <ThemedText color='red'> Delete </ThemedText>
                  </Pressable>
                )}
              </>
            ):(
              <>
                {Number(bSheetCommentAuthor) === initialData?.id && !bSheetCommentDeleted  && (
                  <Pressable style={styles.button} onPress={() => {
                    setBSheetVisible(false);
                    setIsReply(false);
                    setFocusedComment(bSheetComment);
                  }}>
                    <Octicons style={{marginTop:2}} name="pencil" size={15} color={DEFAULT_TEXT} />
                    <ThemedText> Edit </ThemedText>
                  </Pressable>
                )}
                <Pressable style={styles.button} onPress={()=>(showToast({ type: 'info', text1: 'This feature is not implemented yet.' }))}>
                  <Octicons style={{marginTop:2}} name="report" size={15} color={ERROR_TEXT} />
                  <ThemedText color='red'> Report </ThemedText>
                </Pressable>
                {Number(bSheetCommentAuthor) === initialData?.id && !bSheetCommentDeleted && (
                  <Pressable style={styles.button} onPress={() => {
                    setPopupTitle('Delete Comment');
                    setPopupBody('Are you sure you want to delete this comment? This action cannot be undone.');
                    setPopupFunction(() => deleteComment);
                    setPopupVisible(true);
                  }}>
                    <Octicons style={{marginTop:2}} name="trash" size={15} color={ERROR_TEXT} />
                    <ThemedText color='red'> Delete </ThemedText>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </ThemedBottomSheet>
      )}
      <ThemedPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupBody}
        onCancel={() => setPopupVisible(false)}
        onConfirm={() => {
          setPopupVisible(false);
          popupFunction();
        }}
      />
    </>
  );
}