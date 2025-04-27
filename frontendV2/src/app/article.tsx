import { StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedArticle } from '@/components/ThemedArticle';
import { ThemedComment } from '@/components/ThemedComment';
import { ThemedInput } from '@/components/ThemedInput';
import React, { useState, useEffect } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import { useRoute, RouteProp } from '@react-navigation/native';

export default function ArticlePage() {
  // const articleId = 504; // Replace with dynamic route params if needed
  const route = useRoute<RouteProp<{ params: { id: string } }>>();
  const articleId = route.params?.id;

  const [nextCommentPage, setNextCommentPage] = useState(null);
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
  const [newComment, setNewComment] = useState('');
  const [focusedComment, setFocusedComment] = useState<number | null>(null);
  useEffect(() => {
    fetchArticle();
    
  }, []);
  
  const fetchArticle = async () => {
    setLoading(true);
    const response = await fetchAPI(
      `${API_URL}/community/article/${articleId}`, {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      setArticle(response.data?.results?.article || null);
      setComments(response.data?.results?.comments || []);
      setHeaderContent(<ThemedArticle article_data={response.data?.results?.article} />);
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };

  const handleSendComment = async () => {
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
   
  const handleReplyComment = async () => {
    // console.log('handleReplyComment is triggered', focusedComment)
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
            ? { ...comment,
                newComment: response.data
              }
            : comment
        )
      );
      setNewComment('');
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
  };
  /*
  const handleReplyComment = async () => {
    // console.log('handleReplyComment is triggered', focusedComment)
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
      // let newComment = {
      //   id: response.data.id,
      //   body: response.data.body,
      //   user_temp_name: response.data.user_temp_name,
      //   user_static_points: response.data.user_static_points,
      //   user_school: response.data.user_school,
      //   like_status: response.data.like_status,
      // }
      // console.log('Received the response without the error');
    
            setComments((prevComments) =>
              prevComments.map((comment) =>
                String(comment.id) === String(focusedComment)
                  ? { ...comment,
                      nested_comments: [newComment],
                      comments_count: 1,
                      showReplies: true
                    }
                  : comment
              )
            );
      // if (!('nested_comments' in (comments.find(comment => String(comment.id) === String(focusedComment)) ?? {}))) {
      //   setComments((prevComments) =>
      //     prevComments.map((comment) =>
      //       String(comment.id) === String(focusedComment)
      //         ? { ...comment,
      //             nested_comments: [newComment],
      //             comments_count: 1,
      //             showReplies: true
      //           }
      //         : comment
      //     )
      //   );
      // }else{
      //   setComments((prevComments) =>
      //     prevComments.map((comment) =>
      //       String(comment.id) === String(focusedComment)
      //         ? {
      //             ...comment,
      //             nested_comments: [newComment, ...(comment.nested_comments || [])],
      //             comments_count: comment.comments_count + 1,
      //             showReplies: true
      //         }
      //         : comment
      //     )); 
      // }
      setNewComment('');
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
  };
  */

  return (
    <>
      <ThemedView style={styles.container}>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : (
            <>
            {error && <ThemedText type="error">{error}</ThemedText>}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
              <ThemedComment
                comment_data={item}
                handleReply={setFocusedComment}
                // fetchComments={fetchNestedComments}
              />
              )}
              contentContainerStyle={styles.feedContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<ThemedText>No comments found.</ThemedText>}
              ListHeaderComponent={() => <>{headerContent}</>}
            />
            </>
        )}
      </ThemedView>
      <ThemedView 
        lightColor={'#ffffff'}
        darkColor={'#ffffff'}
        style={styles.focusedCommentContainer}
        >
        <ThemedText>
          You are replying to {focusedComment}
        </ThemedText>
        <ThemedButton
          type={'feedChecked'}
          onPress={() => setFocusedComment(null)}
        >
          X
        </ThemedButton>
      </ThemedView>
      <ThemedView 
        lightColor={'#ffffff'}
        darkColor={'#ffffff'}
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
          Send
        </ThemedButton>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  titleContainer: {
    marginTop: 20,
    gap: 20,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  feedContainer: {
    alignItems: 'stretch',
    gap: 20,
  },
  focusedCommentContainer: {
    height: 30,
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical:10,
    gap: 15,
  },
  commentBarContainer: {
    height: 70,
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical:10,
    gap: 15,
  }
});
