import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import HomePage from './index';
import SearchPage from './search (deprecated)';
import ProfilePage from './profile (deprecated)';
import BottomNav from '@/components/ui/BottomNav';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  home: undefined;
  search: undefined;
  profile: undefined;
};

const Tabs = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
  const colorScheme = useColorScheme();



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
          name="profile"
          component={ProfilePage}
          options={{
            headerShown: false,
          }}
        />
      </Tabs.Navigator>
      
      {/* Custom Liquid Glass Navigation */}
      <BottomNav />
    </>
  );
}
