import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import moment from 'moment';

type CommentProps = {
  comment_data: any;
  handleReply?: any;
  handleLike?: any;
  handleNestedComment?: any;
};

export default function ThemedComment({ comment_data, handleReply, handleNestedComment, handleLike}: CommentProps) {

  const default_text_color = useThemeColor({}, 'default_text_color');
  const time_color = useThemeColor({}, 'default_placeholder_color');
  const points_color = useThemeColor({}, 'default_brand_color');
  const button_color = useThemeColor({}, 'default_placeholder_color');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 40,
    },
    nested_container: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 40,
      marginLeft: 40,
      marginTop: 20,
      gap: 10,
    },
    info_container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    uni: {
      color: default_text_color,
      fontWeight: '400',
      fontSize: 15,
    },
    name: {
      color: default_text_color,
      fontWeight: '600',
      fontSize: 18,
    },
    points: {
      color: points_color,
      fontWeight: '400',
      fontSize: 15,
    },
    time: {
      color: time_color,
      fontWeight: '400',
      fontSize: 15,
    },
    body: {
      color: default_text_color,
      fontWeight: '400',
      fontSize: 17,
    },
    button_container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    view_replies_button_container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    button: {
      color: button_color,
      fontSize: 15,
    }
  });

  
  const renderHeader = () => (
    <View style={comment_data.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.info_container}>
          {comment_data.unicon || (
            <Text style={[styles.uni]}>
              {comment_data.user_school.toUpperCase()}
            </Text>
          )}
        <Text style={[styles.name]}>
          {comment_data.user_temp_name}
        </Text>
        <Text style={[styles.points]}>
          {comment_data.user_static_points}
        </Text>
        <Text style={[styles.time]}>
          {moment(comment_data.created_at).fromNow()}
        </Text>
      </View>
      <Text style={styles.body}> {comment_data.body}</Text>
      <View style={styles.button_container}>

        
        {comment_data.parent_comment ? null : (
            <>
              <Pressable onPress={() => handleReply && handleReply(comment_data.id)} >
                <Text style={[styles.button]} >
                  Reply
                </Text>
              </Pressable>
            </>
        )}

        <Pressable onPress={() => handleLike && handleLike(comment_data.id, comment_data.parent_comment)} >
          <Text style={[styles.button]}>
            {comment_data.like_status ? 'Liked' : 'Like'} {comment_data.likes_count}
          </Text>
        </Pressable> 

      </View>
      <View style={styles.view_replies_button_container}>
        {comment_data.parent_comment ? null : (
            <>
              {comment_data.comments_count == 0 ? null : (
                <Pressable onPress={() => handleNestedComment(comment_data.id)} > 
                  <Text style={[styles.button]}>
                    {comment_data.showReplies ? 'Hide Replies..' : `Show ${comment_data.comments_count} Replies`}
                    
                  </Text>
                </Pressable>
              )}
            </>
          )}  
      </View>
    </View>

  );
  return (
    <FlatList
      data={comment_data.nested_comments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ThemedComment comment_data={item} handleLike={handleLike}/>}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} 
      ListHeaderComponent={renderHeader}      
    />
  );
};