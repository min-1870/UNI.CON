import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import React,  { useState } from "react";
import {fetchAPI} from "@/components/Utils";
import {API_URL} from "@/constants/Domains";
import moment from 'moment';
import { router } from 'expo-router';


type ThemedArticleProps = {
  article_data: any;
  type?: string;
};

export default function ThemedArticle({ article_data, type='default' }: ThemedArticleProps) {
  const background_color = useThemeColor({}, 'default_card_background_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  const time_color = useThemeColor({}, 'default_placeholder_color');
  const points_color = useThemeColor({}, 'default_brand_color');
  const button_color = useThemeColor({}, 'default_placeholder_color');
  
  const [article, setArticleState] = useState(article_data);

  const handleLike = async () => {
      const url = article.like_status
          ? `${API_URL}/community/article/${article.id}/unlike/`
          : `${API_URL}/community/article/${article.id}/like/`;
      const response_data = await fetchAPI(url, {method: 'POST'})
      if (response_data) {
          setArticleState((prevState: any) => ({
            ...prevState,
            like_status: !prevState.like_status,
            likes_count: prevState.likes_count + (prevState.like_status ? -1 : 1),
          }));
      }
  };
    
  const handleSave = async () => {
      const url = article.save_status
      ? `${API_URL}/community/article/${article.id}/unsave/`
      : `${API_URL}/community/article/${article.id}/save/`;
      
      const data = await fetchAPI(url, {method: 'POST'})
      if (data) {
          setArticleState((prevState: any) => ({
          ...prevState,
          save_status: !article.save_status,
          }));
      }    
  };

  const handleArticleDetail = () => {
    router.push(`/article?id=${article.id}`);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      color: background_color,
      borderRadius: 30,
      padding: 30, 
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 3 },
      
      shadowRadius: 13,
      shadowOpacity: 0.08,
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow

      marginBottom: type=='detail' ? 20 : 0,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 20,
    },
    uni: {
      color: default_text_color,
      fontWeight: '400',
      fontSize: 15,
    },
    name: {
      color: default_text_color,
      fontWeight: '600',
      fontSize: 20,
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
    title: {
      color: default_text_color,
      fontWeight: '600',
      fontSize: 23,
      marginBottom: 5,
    },
    body: {
      color: default_text_color,
      fontWeight: '400',
      fontSize: 17,
      marginBottom: 20,
      textAlign: 'justify' 
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 10,
    },
    button: {
      color: button_color,
      fontSize: 15,
    },
  });

  return (
    
    <View style={[styles.container]}>
      <Pressable onPress={handleArticleDetail}>
        <View style={[styles.infoContainer]}>
            {article.unicon && (
              <Text style={[styles.uni]}>
              {article.user_school.toUpperCase()}
              </Text>
            )}
          <Text style={[styles.name]}>
            {article.user_temp_name}
          </Text>
          <Text style={[styles.points]}>
            {article.user_static_points}
          </Text>
          <Text style={[styles.time]}>
            {moment(article.created_at).fromNow()}
          </Text>
        </View>

        <Text style={[styles.title]}>{article.title}</Text>
        <Text style={[styles.body]}>{article.body}</Text>
      </Pressable>
      <View style={[styles.buttonContainer]}>
        <Pressable onPress={handleLike}>
            <Text style={[styles.button]}>
              {article.like_status ? 'Liked' : 'Like'} {article.likes_count}
            </Text>
        </Pressable>
        <Pressable>
            <Text style={[styles.button]}>
              comment {article.comments_count}
            </Text>
        </Pressable>
        <Pressable>
            <Text style={[styles.button]}>
              view {article.views_count}
            </Text>
        </Pressable>
        <Pressable onPress={handleSave}>
            <Text style={[styles.button]}>
              {article.save_status ? 'Saved' : 'Save'}
            </Text>
        </Pressable>
      </View>
    </View>
  );
};