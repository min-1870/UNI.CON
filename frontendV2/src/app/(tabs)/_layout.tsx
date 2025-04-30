import React from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewArticlePage from './post';
import HomePage from './index';
import SearchPage from './search';
import ProfilePage from './profile';

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

  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="home"
        component={HomePage}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        component={SearchPage}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        />
      <Tabs.Screen
        name="post"
        component={NewArticlePage}
        options={{
          headerShown: true,
          title: 'New Article',
          tabBarStyle: { display: 'none' },  
          tabBarLabel: 'Post', 
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        component={ProfilePage}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        />
    </Tabs.Navigator>
  );
}
