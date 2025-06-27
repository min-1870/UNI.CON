import React  from 'react';
import { Octicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewArticlePage from './post';
import HomePage from './index';
import SearchPage from './search';
import ProfilePage from './profile';
import { useArticlesStore } from '@/store/articleStore';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRef } from 'react';

export type TabParamList = {
  home: undefined;
  search: undefined;
  post: undefined;         
  profile: undefined;
};

const Tabs = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const default_brand_color = useThemeColor({}, 'default_brand_color');
  const routeName = useRef('');
  const tabBarOptions = {
    style: {
      backgroundColor: colorScheme === 'dark' ? '#18181b' : '#fff',
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
      paddingHorizontal: 16,
    },
    activeTintColor: default_brand_color, 
    inactiveTintColor: colorScheme === 'dark' ? '#a1a1aa' : '#6b7280',
  };

  const screenOptions = {
    tabBarActiveTintColor: tabBarOptions.activeTintColor,
    tabBarInactiveTintColor: tabBarOptions.inactiveTintColor,
    tabBarStyle: tabBarOptions.style,
    tabBarItemStyle: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  };
  return (
    <Tabs.Navigator 
    
      screenOptions={screenOptions}
      screenListeners={({ navigation, route }) => ({
      tabPress: (e) => {
        if (route.name === routeName.current) {
          useArticlesStore.getState().reset(route.name);
        }
        routeName.current = route.name; 
      },
      })}
    >
      <Tabs.Screen
        name="home"
        component={HomePage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <Octicons size={23} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        component={SearchPage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <Octicons size={23} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        component={NewArticlePage}
        options={{
          headerShown: true,
          title: 'New Article',
          tabBarStyle: { display: 'none' },
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <Octicons size={23} name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        component={ProfilePage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <Octicons size={23} name="person" color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}
