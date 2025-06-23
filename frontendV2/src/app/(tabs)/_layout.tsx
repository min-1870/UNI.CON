import React from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewArticlePage from './post';
import HomePage from './index';
import SearchPage from './search';
import ProfilePage from './profile';
import BottomNav from '@/components/ui/BottomNav';
import { router } from 'expo-router';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  home: undefined;
  search: undefined;
  post: undefined;         
  profile: undefined;
};

const Tabs = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const handleSearchClick = () => {
    router.push('/(tabs)/search');
  };

  const handleAddClick = () => {
    router.push('/(tabs)/post');
  };

  return (
    <>
      <Tabs.Navigator
        screenOptions={{
          tabBarStyle: { display: 'none' }, // Hide the default tab bar completely
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          component={HomePage}
          options={{
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="search"
          component={SearchPage}
          options={{
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="post"
          component={NewArticlePage}
          options={{
            headerShown: true,
            title: 'New Article',
          }}
        />
        <Tabs.Screen
          name="profile"
          component={ProfilePage}
          options={{
            headerShown: false,
          }}
        />
      </Tabs.Navigator>
      
      {/* Custom Liquid Glass Navigation */}
      <BottomNav 
        onSearchClick={handleSearchClick}
        onAddClick={handleAddClick}
      />
    </>
  );
}
