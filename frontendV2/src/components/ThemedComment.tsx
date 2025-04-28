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
    <View style={comment_data.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.infoContainer}>
        <View style={styles.nameUniContainer}>
          <Text style={styles.uni}> {comment_data.user_temp_name}</Text>
          <Text style={styles.uni}> {comment_data.user_school.toUpperCase()}</Text>
        </View>
        <Text style={styles.time} >{moment(comment_data.created_at).fromNow()}</Text>
      </View>
      <Text style={styles.body}> {comment_data.body}</Text>
      <View style={styles.buttonContainer}>        
        <Pressable onPress={() => handleLike && handleLike(comment_data.id, comment_data.parent_comment)} >
          <Text style={[styles.button]}>
            {comment_data.like_status ? 'Liked' : 'Like'} {comment_data.likes_count}
          </Text>
        </Pressable> 
        {comment_data.parent_comment ? null : (
          <>
            <Pressable onPress={() => handleReply && handleReply(comment_data.id)} >
              <Text style={[styles.button]} >
                Reply
              </Text>
            </Pressable>
            {comment_data.comments_count == 0 ? null : (
              <Pressable onPress={() => handleNestedComment(comment_data.id)} > 
                <Text style={[styles.button]}>
                  View {comment_data.comments_count} Replies
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