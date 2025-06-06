import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedTag from '@/components/ThemedTag';
import ThemedText from '@/components/ThemedText';
import React,  { useState } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";
import moment from 'moment';
import { router } from 'expo-router';
import { AntDesign, FontAwesome } from '@expo/vector-icons';

type ThemedArticleProps = {
  article_data: any;
  type?: string;
};

export default function ThemedArticle({ article_data, type='default' }: ThemedArticleProps) {
  const background_color = useThemeColor({}, 'default_card_background_color');
  const view_background_color = useThemeColor({}, 'default_view_card_background_color');
  const default_text_color = useThemeColor({}, 'default_text_color');
  const button_color = useThemeColor({}, 'default_placeholder_color');
  const [trending_tags, setTrendingTags] = useState<string[]>([]);
  
  React.useEffect(() => {
    const fetchTrendingTags = async () => {
      const tags = await getData('trending_tags');
      setTrendingTags(Array.isArray(tags) ? tags : []);
    };
    fetchTrendingTags();
  }, []);

  const [article, setArticleState] = useState(article_data);

  const handleLike = async () => {
    console.log(123);
    console.log(article);
      const url = article.like_status
          ? URLs.ARTICLE_UNLIKE(article.id)
          : URLs.ARTICLE_LIKE(article.id);
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
      ? URLs.ARTICLE_UNSAVE(article.id)
      : URLs.ARTICLE_SAVE(article.id);
      
      const data = await fetchAPI(url, {method: 'POST'})
      if (data) {
          setArticleState((prevState: any) => ({
          ...prevState,
          save_status: !article.save_status,
          }));
      }    
  };

  const handleArticleDetail = () => {
    setArticleState((prevState: any) => ({
      ...prevState,
      view_status: true,
    }));
    router.push(`/article?id=${article.id}`);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: type == 'default' && article.view_status ? view_background_color : background_color,
      borderRadius: 20,
      borderTopRightRadius: type=='detail' ? 0 : 20,
      borderTopLeftRadius: type=='detail' ? 0 : 20,
      padding: 16, 
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
      marginBottom: 14,
    },
    body: {
      color: default_text_color,
      fontWeight: '400',
      fontSize: 17,
      textAlign: 'justify',
      marginBottom: 3,
    },
    tagContainer:{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 10,
    },
    button: {
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      flexDirection: 'row',
    },
  });

  return (
    
    <View style={[styles.container]}>
      <Pressable onPress={handleArticleDetail}>
        <View style={[styles.infoContainer]}>
            {article.unicon && (
              <ThemedText type='articleAuthor'>
              {article.user_school.toUpperCase()}
              </ThemedText>
            )}
          <ThemedText type='articleAuthor'>
            {article.user_temp_name}
          </ThemedText>
          <ThemedText type='articlePoints'>
            {article.user_static_points}
          </ThemedText>
          <ThemedText type='articleDate'>
            {moment(article.created_at).fromNow()}
          </ThemedText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
           <ThemedText type='articleDate' >
             {article.deleted? 'deleted' : article.edited ? null : 'edited'}
           </ThemedText>
          </View>
        </View>

        <ThemedText type='articleTitle'>{article.title}</ThemedText>
        <ThemedText type='articleBody'>
          {article.body.length > 200 && type == 'default' 
            ? article.body.slice(0, 200) + ' ... read more'
            : article.body
          }
        </ThemedText>
        <View style={styles.tagContainer}>
          {article.tag.length > 0 && article.tag
            .map((tag: string, i: number) => (
              <ThemedTag
                text={tag}
                type={trending_tags.includes(tag) ? 'ranked' : 'default'}
                key={i}
              />
          ))}
        </View>
      </Pressable>
      <View style={[styles.buttonContainer]}>
        <Pressable onPress={handleLike} style={[styles.button]}>
          <AntDesign
            name={article.like_status ? 'heart' : 'hearto'} // different glyphs if you prefer
            size={15}
            color={button_color} // use a color from your theme
          />
          <ThemedText type='articleButton'>
            {article.likes_count}
          </ThemedText>
        </Pressable>
        <View style={[styles.button]}>
          <AntDesign
            name={'message1'} // different glyphs if you prefer
            size={15}
            color={button_color} // use a color from your theme
          />
          <ThemedText type='articleButton'>
            {article.comments_count}
          </ThemedText>
        </View>
        <View style={[styles.button]}>
          <AntDesign
            name={'eyeo'} // different glyphs if you prefer
            size={15}
            color={button_color} // use a color from your theme
          />
          <ThemedText type='articleButton'>
            {article.views_count}
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} style={[styles.button]}>
          <FontAwesome
            name={article.save_status ? 'bookmark' : 'bookmark-o'} // different glyphs if you prefer
            size={15}
            color={button_color} // use a color from your theme
          />
        </Pressable>
      </View>
    </View>
  );
};