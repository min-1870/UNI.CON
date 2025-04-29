import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import moment from 'moment';

type CommentProps = {
  lightColor?: string;
  darkColor?: string;
  comment_data: any;
  handleReply?: any;
  handleLike?: any;
  handleNestedComment?: any;
};

function ThemedComment({ lightColor, darkColor, comment_data, handleReply, handleNestedComment, handleLike}: CommentProps) {

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentBackground');
  const nameColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentName');
  const timeColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentTime');
  const bodyColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentBody');
  const buttonColor = useThemeColor({ light: lightColor, dark: darkColor }, 'commentButton');
  const pointsColor = useThemeColor({ light: lightColor, dark: darkColor }, 'articlePoints');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor,
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
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    uni: {
      color: nameColor,
      fontWeight: '400',
      fontSize: 15,
    },
    name: {
      color: nameColor,
      fontWeight: '600',
      fontSize: 18,
    },
    points: {
      color: pointsColor,
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
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    viewRepliesButtonContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    button: {
      color: buttonColor,
      fontSize: 15,
    }
  });

  
  const renderHeader = () => (
    <View style={comment_data.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.infoContainer}>
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
      <View style={styles.buttonContainer}>

        
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
      <View style={styles.viewRepliesButtonContainer}>
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
export { ThemedComment };