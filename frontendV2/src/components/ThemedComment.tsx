import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { CommentType, InitialDataType } from '@/constants/types';
import ThemedShimmer from '@/components/ThemedShimmer';
import { useThemeColor } from '@/hooks/useThemeColor';
import React,  { useState, useEffect  } from "react";
import { numberToString } from '@/components/Utils';
import ThemedText from '@/components/ThemedText';
import ThemedTag from '@/components/ThemedTag';
import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';

type CommentProps = {
  commentData: CommentType;
  setFocusedComment?: any;
  isReplying?: any;
  likeComment?: any;
  fetchNestedComments?: any;
  fetchMoreNestedComment?: any;
  handleCommentBSheet?: any;
  isChild?: boolean;
  isUnicon?: boolean;
  initialData?: InitialDataType;
};

function ThemedComment({handleCommentBSheet, commentData, setFocusedComment, isReplying, isUnicon, fetchNestedComments, fetchMoreNestedComment, likeComment, isChild, initialData}: CommentProps) {

  const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const UNICON_CONTENT = useThemeColor({}, 'UNICON_CONTENT');
  const [loading, setLoading] = useState(false);
  // const prevNestedCommentsCount = useRef(commentData.nested_comments?.length ?? 0);

  useEffect(() => {
    setLoading(false);
  }, [commentData?.nested_comments?.length, commentData?.showReplies]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    nested_container: {
      flex: 1,
      paddingVertical: 10,
      paddingLeft:80,
      paddingRight:16,
      gap: 10,
    },
    load_more: {
      paddingBottom: 10,
      alignItems: 'center',
    },
    info_container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    button_container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    like_reply_container: {
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
    },
    view_replies_button_container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    button: {
      display: 'flex',
      gap: 7,
      minWidth: 30,
      alignItems: 'center',
      flexDirection: 'row',
    },
  });
  
  const renderHeader = () => (
    <View style={commentData.parent_comment ? styles.nested_container : styles.container}>
      <View style={styles.info_container}>
          {isUnicon && (
            <ThemedTag unClickable={true} initialData={initialData} type='uni' text={commentData.user_school.toUpperCase()}/>
          )}
        <ThemedText size='smaller' >
          {commentData.user_temp_name}
        </ThemedText>
        {commentData.user_static_points > 0 && (
          <ThemedText color="brand">
            {commentData.user_static_points}p
          </ThemedText>
        )}
        <ThemedText color="gray" size='smaller'>
          {moment(commentData.created_at).fromNow()}
        </ThemedText>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <ThemedText color="gray" size='smaller'>
            {commentData.deleted ? 'deleted' : commentData.edited ? 'edited' : null}
          </ThemedText>
        </View>
      </View>
      <ThemedText> {commentData.body} </ThemedText>
      <View style={styles.button_container}>
        {initialData && (
            
          <>
            <View style={styles.like_reply_container}>
            <Pressable style={[styles.button]} onPress={() => likeComment && likeComment(commentData.id, commentData.parent_comment)} > 
              <AntDesign
                name={commentData.like_status ? 'heart' : 'hearto'} 
                size={13}
                color={commentData.like_status ? UNICON_CONTENT : DEFAULT_GRAY_TEXT} 
              />
              <ThemedText color="gray" size='smaller' font='textMedium'>
                {numberToString(commentData.likes_count)}
              </ThemedText>
            </Pressable> 

            {!commentData.parent_comment &&(
              <Pressable style={styles.button} onPress={() => {
                if (setFocusedComment) {
                  if (isChild) {
                    setFocusedComment({parent:commentData.parent_comment, child:commentData.id});
                  } else {
                    setFocusedComment({parent:commentData.id, child:null});
                  }
                }
                if (isReplying) {
                  isReplying(true);
                }
              }}>
                <ThemedText color="gray" size='smaller' font='textMedium' justify={true}>
                  Reply
                </ThemedText>
              </Pressable>
            )}
            </View>

            <Pressable  onPress={() => {
              if (setFocusedComment) {
                if (isChild) {
                  handleCommentBSheet(commentData.parent_comment, commentData.id,  commentData.user, commentData.deleted);
                } else {
                  handleCommentBSheet(commentData.id, null, commentData.user, commentData.deleted);
                }
              }
              if (isReplying) {
                isReplying(true);
              }
            }}>
              <Feather
                name={'more-horizontal'} 
                size={15}
                color={DEFAULT_GRAY_TEXT} 
              />
            </Pressable>
          </>
        )}
      </View>
      <View style={styles.view_replies_button_container}>
        {commentData.parent_comment ? null : (
            <>
              {commentData.comments_count == 0 ? null : (
                <Pressable onPress={() => {fetchNestedComments(commentData.id); !commentData.showReplies && setLoading(true);}} > 
                  <ThemedText color="gray" size='smaller' font='textMedium'>
                    {commentData.showReplies 
                      ? 'Hide Replies' 
                      : commentData.nested_comments?.length == 0 && loading
                      ? 'Loading Replies..'
                      : `Show ${commentData.comments_count} Replies`}
                    
                  </ThemedText>
                </Pressable>
              )}
            </>
          )}  
      </View>
    </View>

  );

  const renderFooter = () => (
    <View>
      {loading ?
        <View style={styles.nested_container} >
          {Array.from({ length: Math.min(
            commentData.comments_count - (
              commentData.nested_comments 
                ? commentData.nested_comments?.length 
                : 0
            ), 10) }).map((_, idx) => (
            <ThemedShimmer key={idx} type="comment" />
          ))}
        </View>
      :
        <>
          {commentData.showReplies && commentData.next && (
            <Pressable
              style={styles.load_more}
              onPress={() => {
                fetchMoreNestedComment(commentData.id);
                setLoading(true);
              }}
            >
              <ThemedText color="gray" size="smaller" font="textMedium">
                  Load More
                </ThemedText>
            </Pressable>
          )}
        </>
      }
    </View>
  );

  return (
    <FlatList
      data={commentData.showReplies ? commentData.nested_comments ?? [] : []}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => 
        <ThemedComment
          initialData={initialData}
          commentData={item}
          setFocusedComment={setFocusedComment}
          likeComment={likeComment}
          isUnicon={isUnicon}
          isChild={true}
          isReplying={isReplying}
          handleCommentBSheet={handleCommentBSheet}
        />}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} 
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
    />
  );
};


export default React.memo(
  ThemedComment,
  (prevProps, nextProps) =>
    prevProps.initialData === nextProps.initialData &&
    prevProps.commentData.id === nextProps.commentData.id &&   
    prevProps.commentData.body === nextProps.commentData.body &&
    prevProps.commentData.comments_count === nextProps.commentData.comments_count &&
    prevProps.commentData.like_status === nextProps.commentData.like_status &&
    prevProps.commentData.likes_count === nextProps.commentData.likes_count &&
    (prevProps.commentData.showReplies ?? false) === (nextProps.commentData.showReplies ?? false) &&   
    (prevProps.commentData.nested_comments?.length ?? 0) === (nextProps.commentData.nested_comments?.length ?? 0) &&   
    (
      prevProps.commentData.nested_comments?.every((prevItem, idx) => {
        const nextItem = nextProps.commentData.nested_comments?.[idx];
        return (
          nextItem != null &&
          prevItem.id === nextItem.id &&
          prevItem.body === nextItem.body &&
          prevItem.like_status === nextItem.like_status &&
          prevItem.likes_count === nextItem.likes_count 
        );
      }) ?? true
    ) 
);