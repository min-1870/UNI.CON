import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedText from '@/components/ThemedText';
import React,  { useState } from "react";
import {fetchAPI, getData} from "@/components/Utils";
import URLs from "@/constants/Urls";
import moment from 'moment';
import { router } from 'expo-router';

type ThemedNotificationProp = {
  notification_data: any;
  last_check_at: any;
  type?: string;
};

export default function ThemedNotification({ notification_data, last_check_at, type='default' }: ThemedNotificationProp) {

  React.useEffect(() => {
    
  }, []);

  const handleViewDetail = () => {
    router.push({
      pathname: '/article/[id]',
      params: { id: String(notification_data.article_id) }, 
    });
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title:{
      marginBottom: 5,
    },
    body:{
      marginBottom: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
  
  return (
    
    <View style={[styles.container]}>
      <Pressable onPress={handleViewDetail}>
        <View style={[styles.title]}>
          <ThemedText  >
            {last_check_at < notification_data.created_at
              ? <ThemedText color='brand'>New {' '}</ThemedText>
              : null}
            <ThemedText font='textBold'>
              { last_check_at < notification_data.created_at 
                ? notification_data.type_name.toLowerCase()
                : notification_data.type_name
              }
            </ThemedText>
            {' '} on {' '}
            <ThemedText font='textBold'>
              {notification_data.title}
            </ThemedText>
          </ThemedText>
        </View>
        <View style={[styles.body]}>
          <ThemedText color='gray'>
            {notification_data.body.length > 100
              ? notification_data.body.slice(0, 100) + '...'
              : notification_data.body
            }
          </ThemedText>
        </View>
        <View style={[styles.buttonContainer]}>
          <ThemedText size='smaller' >
            {moment(notification_data.created_at).fromNow()}
          </ThemedText>
          <ThemedText size='smaller' font='textBold'>
            View Detail
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
};