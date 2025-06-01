import React from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewArticlePage from './post';
import FeedPage from '../feed';
import SearchPage from './search';
import ProfilePage from './profile';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  feed: undefined;
  search: undefined;
  post: undefined;         
  profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#666' : '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="feed"
        component={FeedPage}
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol name="home" color={color} />,
        }}
      />
      <Tab.Screen
        name="search"
        component={SearchPage}
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <IconSymbol name="search" color={color} />,
        }}
      />
      <Tab.Screen
        name="post"
        component={NewArticlePage}
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => <IconSymbol name="plus" color={color} />,
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfilePage}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol name="user" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
