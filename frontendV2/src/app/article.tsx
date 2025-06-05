import { StyleSheet, FlatList, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import ThemedArticle from '@/components/ThemedArticle';
import ThemedComment from '@/components/ThemedComment';
import ThemedInput from '@/components/ThemedInput';
import React, { useState, useEffect, useRef } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";
import { useRoute, RouteProp } from '@react-navigation/native';
import { Animated } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { AntDesign } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
export default function ArticlePage() {
  const route = useRoute<RouteProp<{ params: { id: string } }>>();
  const articleId = route.params?.id;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const background_color = useThemeColor({}, 'default_card_background_color');
  const text_color = useThemeColor({}, 'default_text_color');
  const [nextCommentPage, setNextCommentPage] = useState(null);
  type Article = {
    id: string;
    user: number;
    [key: string]: any;
  };
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<{ id: string; user: number; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
  const [newComment, setNewComment] = useState('');
  const [focusedComment, setFocusedComment] = useState<number | null>(null);
  const navigation = useNavigation();
  const [uid, setUid] = useState<number | null>(null);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: background_color, // navbar background
        shadowColor: 'transparent', // remove iOS bottom border
        elevation: 0, // remove Android shadow
        borderWidth: 0, 
      },
      headerTintColor: text_color,
      headerTitleAlign: 'center',
      headerRight: () => (
        <>
          {article && uid !== null && article.user == uid && 
            <Pressable>
              <ThemedText
                type={'default'} 
                onPress={()=>{
                    router.push(`/edit?id=${article.id}`);
                }} 
                disabled={loading}
                style={{ marginRight: 30 }}
              >
                Edit
              </ThemedText>
            </Pressable>
          }
        </>
      ),
    });
  }, [navigation, article, uid, loading]);

  useEffect(() => {
    fetchArticle();
    const fetchSchool = async () => {
      const storedUid = await getData('id');
      setUid(Number(storedUid)||null)
    };
    fetchSchool();
  }, []);
  
  useEffect(() => {
    if (loading) {
      contentOpacity.setValue(0);
    } else {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const fetchArticle = async () => {
    setLoading(true);
    const response = await fetchAPI(
      URLs.ARTICLE(articleId), {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticle(response.data?.results?.article || null);
      setComments(response.data?.results?.comments || []);
      setHeaderContent(<ThemedArticle type={'detail'} article_data={response.data?.results?.article} />);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };

  const handleSendComment = async () => {
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
      setError(response?.data?.detail || "An error occurred");
    }
  }; 

  const likeComment = async (commentId: string, parent_commentId: string | null) => {
    let url = '';
    if (parent_commentId) {
      url = comments.find((comment) => comment.id === parent_commentId)?.nested_comments.find((nestedComment: { id: string; }) => nestedComment.id === commentId)?.like_status
        ? URLs.COMMENT_LIKE(commentId)  
        : URLs.COMMENT_UNLIKE(commentId);
    }
    else {
      url = comments.find((comment) => comment.id === commentId)?.like_status
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
      const response = await fetchAPI(URLs.COMMENT(commentId), { method: 'GET', token: true });
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
      URLs.COMMENT(), {
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    feedContainer: {
      alignItems: 'stretch',
    },
    focusedCommentContainer: {
      height: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical:10,
      gap: 15,
    },
    commentBarContainer: {
      height: 70,
      flexDirection: 'row',
      paddingHorizontal: 30,
      paddingVertical:10,
      gap: 20,
    },
    NCF: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200
    }
  });

  return (
    <>
      <ThemedView style={styles.container}>
        {loading ? null : (
            <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
            {error && <ThemedText type="error">{error}</ThemedText>}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
              <ThemedComment
                comment_data={item}
                handleReply={setFocusedComment}
                handleLike={likeComment}
                handleNestedComment={fetchNestedComments}
              />
              )}
              contentContainerStyle={styles.feedContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <ThemedView style={styles.NCF}>
                  <ThemedText type='contentPlaceholder'>No comments found.</ThemedText>
                </ThemedView>
              }
              ListHeaderComponent={() => <>{headerContent}</>}
            />
            </Animated.View>
        )}
      </ThemedView>
      {focusedComment && (
        <ThemedView 
          style={styles.focusedCommentContainer}
          >
          <ThemedText>
            You are replying to {
              comments.find((comment) => Number(comment.id) === focusedComment)?.body}
          </ThemedText>
          <ThemedButton
            type={'feedChecked'}
            onPress={() => setFocusedComment(null)}
          >
          <ThemedText type={'feedChecked'}>X</ThemedText>
          </ThemedButton>
        </ThemedView>
      )}
      <ThemedView 
        style={styles.commentBarContainer}
        >
        <ThemedInput
          type={'comment'}
          placeholder='Add Comments'
          value={newComment}
          onChangeText={setNewComment}
        />
        <ThemedButton
          type={'feedChecked'}
          onPress={focusedComment ? handleReplyComment : handleSendComment}
        >
          <AntDesign
            name='arrowright'
            size={25}
            color={'#000'}
          />
        </ThemedButton>
      </ThemedView>
    </>
  );
}
