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
  type?: string;
};

export default function ThemedNotification({ notification_data, type='default' }: ThemedNotificationProp) {

  React.useEffect(() => {
    
  }, []);

  const handleViewDetail = () => {
    router.push({
      pathname: '/article/[id]',
      params: { id: String(notification_data.object_id) }, 
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
          <ThemedText type="notificationTitle">
            New{' '}
            <ThemedText type="notificationTitleBold">
              { notification_data.group == 0 ?
                'Comment'
                : 'Like'
              }
            </ThemedText>{' '}
            on your{' '}
            <ThemedText type="notificationTitleBold">{notification_data.type_name}</ThemedText>
            {notification_data.type_name === 'comment' ? ' in ' : ' '}
            <ThemedText type="notificationTitleBold">
              {notification_data.title}
            </ThemedText>
          </ThemedText>
        </View>
        <View style={[styles.body]}>
          <ThemedText type='notificationBody'>
            {notification_data.body.length > 100
              ? notification_data.body.slice(0, 100) + '...'
              : notification_data.body
            }
          </ThemedText>
        </View>
        <View style={[styles.buttonContainer]}>
          <ThemedText type='articleDate'>
            {moment(notification_data.created_at).fromNow()}
          </ThemedText>
          <ThemedText type='notificationButton'>
            View Detail
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
};