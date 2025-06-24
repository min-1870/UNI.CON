import { View, Text, Pressable, StyleSheet } from 'react-native';
import React, { useState } from "react";
import { fetchAPI } from "@/components/Utils";
import URLs from "@/constants/Urls";
import moment from 'moment';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

type ThemedArticleProps = {
  article_data: any;
  type?: string;
};

export default function ThemedArticle({ article_data, type = 'default' }: ThemedArticleProps) {
  const { theme } = useTheme();
  const [article, setArticleState] = useState(article_data);

  const handleLike = async () => {
    const url = article.like_status
      ? URLs.ARTICLE_UNLIKE(article.id)
      : URLs.ARTICLE_LIKE(article.id);
    const response_data = await fetchAPI(url, { method: 'POST' })
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

    const data = await fetchAPI(url, { method: 'POST' })
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
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius['2xl'],
      padding: theme.spacing['2xl'],
      shadowColor: theme.computed.shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 13,
      shadowOpacity: 0.08,
      elevation: 10,
      marginBottom: type === 'detail' ? theme.spacing.xl : 0,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xl,
    },
    uni: {
      color: theme.colors.textSecondary,
      fontWeight: '400' as any,
      fontSize: theme.typography.fontSize.sm,
    },
    name: {
      color: theme.colors.text,
      fontWeight: '600' as any,
      fontSize: theme.typography.fontSize.lg,
    },
    points: {
      color: theme.colors.primary,
      fontWeight: '400' as any,
      fontSize: theme.typography.fontSize.sm,
    },
    time: {
      color: theme.colors.textMuted,
      fontWeight: '400' as any,
      fontSize: theme.typography.fontSize.sm,
    },
    title: {
      color: theme.colors.text,
      fontWeight: '600' as any,
      fontSize: theme.typography.fontSize['2xl'],
      marginBottom: theme.spacing.xs,
    },
    body: {
      color: theme.colors.textSecondary,
      fontWeight: '400' as any,
      fontSize: theme.typography.fontSize.base,
      marginBottom: theme.spacing.xl,
      textAlign: 'justify' as any,
      lineHeight: theme.typography.fontSize.base * 1.5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: theme.spacing.sm,
    },
    button: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.fontSize.sm,
    },
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={handleArticleDetail}>
        <View style={styles.infoContainer}>
          {article.unicon && (
            <Text style={styles.uni}>
              {article.user_school.toUpperCase()}
            </Text>
          )}
          <Text style={styles.name}>
            {article.user_temp_name}
          </Text>
          <Text style={styles.points}>
            {article.user_static_points}
          </Text>
          <Text style={styles.time}>
            {moment(article.created_at).fromNow()}
          </Text>
        </View>

        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.body}>{article.body}</Text>
      </Pressable>
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleLike}>
          <Text style={styles.button}>
            {article.like_status ? 'Liked' : 'Like'} {article.likes_count}
          </Text>
        </Pressable>
        <Pressable>
          <Text style={styles.button}>
            comment {article.comments_count}
          </Text>
        </Pressable>
        <Pressable>
          <Text style={styles.button}>
            view {article.views_count}
          </Text>
        </Pressable>
        <Pressable onPress={handleSave}>
          <Text style={styles.button}>
            {article.save_status ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};