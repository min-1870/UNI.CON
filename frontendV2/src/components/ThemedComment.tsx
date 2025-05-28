import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedText from '@/components/ThemedText';
import moment from 'moment';

import { AntDesign } from '@expo/vector-icons';

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
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      flexDirection: 'row',
    },
  });

  
  const renderHeader = () => (
    <View style={comment_data.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.info_container}>
          {comment_data.unicon || (
            <ThemedText type='articleAuthor' style={{fontSize:12}}>
              {comment_data.user_school.toUpperCase()}
            </ThemedText>
          )}
        <ThemedText type='articleAuthor' style={{fontSize:12}}>
          {comment_data.user_temp_name}
        </ThemedText>
        <ThemedText type='articlePoints' style={{fontSize:9}}>
          {comment_data.user_static_points}
        </ThemedText>
        <ThemedText type='articleDate' style={{fontSize:9}}>
          {moment(comment_data.created_at).fromNow()}
        </ThemedText>
      </View>
      <ThemedText type='articleBody'> {comment_data.body} </ThemedText>
      <View style={styles.button_container}>

        
        {comment_data.parent_comment ? null : (
            <>
              <Pressable onPress={() => handleReply && handleReply(comment_data.id)} >
                <ThemedText type='articleButton' >
                  Reply
                </ThemedText>
              </Pressable>
            </>
        )}

        <Pressable style={[styles.button]} onPress={() => handleLike && handleLike(comment_data.id, comment_data.parent_comment)} >
          
          <AntDesign
            name={comment_data.like_status ? 'heart' : 'hearto'} // different glyphs if you prefer
            size={15}
            color={button_color} // use a color from your theme
          />
          <ThemedText type='articleButton'>
            {comment_data.likes_count}
          </ThemedText>
        </Pressable> 

      </View>
      <View style={styles.view_replies_button_container}>
        {comment_data.parent_comment ? null : (
            <>
              {comment_data.comments_count == 0 ? null : (
                <Pressable onPress={() => handleNestedComment(comment_data.id)} > 
                  <ThemedText type='articleButton'>
                    {comment_data.showReplies ? 'Hide Replies..' : `Show ${comment_data.comments_count} Replies`}
                    
                  </ThemedText>
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