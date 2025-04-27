import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import React,  { useState } from "react";
import {fetchAPI} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import moment from 'moment';

type CommentProps = {
  lightColor?: string;
  darkColor?: string;
  comment_data: any;
  handleReply?: any;
  fetchComments?: any;
  newComment?: any;
};

function ThemedComment({ lightColor, darkColor, comment_data, handleReply, newComment }: CommentProps) {
  const [comment, setComment] = useState(comment_data);

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentBackground');
  const nameColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentName');
  const timeColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentTime');
  const bodyColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentBody');
  const buttonColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentButton');

  
  console.log(newComment)

  
  const handleLike = async () => {
      const url = comment.like_status
          ? `${API_URL}/community/comment/${comment.id}/unlike/`
          : `${API_URL}/community/comment/${comment.id}/like/`;
      const response_data = await fetchAPI(url, {method: 'POST'})
      if (response_data) {
          setComment((prevState: any) => ({
            ...prevState,
            like_status: !prevState.like_status,
            likes_count: prevState.likes_count + (prevState.like_status ? -1 : 1),
          }));
      }
  };

  
  const fetchNestedComments = async (comment_id: string) => {
    console.log('fetching', comment_id)
    const url = `${API_URL}/community/comment/${comment_id}`;
    const response = await fetchAPI(url, {method: 'GET'})
    if (!response.error) {
      console.log(response.data.results.comments);
      setComment((prevComment: any) => ({
        ...prevComment,
        nested_comments: response.data.results.comments,
        showReplies: true,
      }));
      console.log('Updated comments:', comment);
    }
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
      padding: 20,
    },
    nested_container: {
      flex: 1,
      backgroundColor,
      padding: 20,
      marginLeft: 40,
      marginTop: 20
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    nameUniContainer: {
      flexDirection: 'row',      
      gap: 5,
    },
    name: {
      color: nameColor,
      fontWeight: '400',
      fontSize: 15,
    },
    uni: {
      color: nameColor,
      fontWeight: '400',
      fontSize: 15,
    },
    time: {
      color: timeColor,
      fontWeight: '400',
      fontSize: 15,
    },
    body: {
      color: bodyColor,
      fontWeight: '400',
      fontSize: 17,
      marginBottom: 10,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 10,
    },
    button: {
      color: buttonColor,
      fontSize: 15,
    }
  });

  
  const renderHeader = () => (
    <View style={comment.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.infoContainer}>
        <View style={styles.nameUniContainer}>
          <Text style={styles.uni}> {comment.user_temp_name}</Text>
          <Text style={styles.uni}> {comment.user_school.toUpperCase()}</Text>
        </View>
        <Text style={styles.time} >{moment(comment.created_at).fromNow()}</Text>
      </View>
      <Text style={styles.body}> {comment.body}</Text>
      <View style={styles.buttonContainer}>        
        <Pressable onPress={handleLike}>
          <Text style={[styles.button]}>
            {comment.like_status ? 'Liked' : 'Like'} {comment.likes_count}
          </Text>
        </Pressable> 
        <Pressable onPress={() => handleReply && handleReply(comment.id)} >
          <Text style={[styles.button]} >
            Reply
          </Text>
        </Pressable>
        {comment.comments_count == 0 ? null : (
          <Pressable onPress={() => fetchNestedComments(comment.id)} > 
            <Text style={[styles.button]}>
              View {comment.comments_count} Replies
            </Text>
          </Pressable>
        )}
      </View>
    </View>

  );
  console.log(comment.nested_comments)
  return (
    <FlatList
      // data={comment.showReplies ? comment.nested_comments : []}
      data={comment.nested_comments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ThemedComment comment_data={item} />}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} 
      ListHeaderComponent={renderHeader}      
    />
  );
};
export { ThemedComment };