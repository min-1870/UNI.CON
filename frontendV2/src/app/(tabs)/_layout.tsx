import React  from 'react';
import { Octicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewArticlePage from './post';
import HomePage from './index';
import SearchPage from './search';
import ProfilePage from './profile';
import MarketplacePage from './marketplace';
import { useArticlesStore } from '@/store/articleStore';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRef } from 'react';
import ThemedBNavBar from '@/components/ThemedBNavBar';

const Tabs = createBottomTabNavigator<TabParamList>();

export type TabParamList = {
  home: undefined;
  search: undefined;
  post: undefined;         
  marketplace: undefined;  
  profile: undefined;
};


export default function TabLayout() {
  const routeName = useRef('');

  return (
    <Tabs.Navigator 
      
      tabBar={props => <ThemedBNavBar {...props} />}
      screenListeners={({ navigation, route }) => ({
      tabPress: (e) => {
        if (route.name === routeName.current) {
          useArticlesStore.getState().reset(route.name);
        }
        routeName.current = route.name; 
        console.log(`Tab pressed: ${route.name}`);
      },
      })}
    >
      <Tabs.Screen
        name="home"
        component={HomePage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="search"
        component={SearchPage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="post"
        component={NewArticlePage}
        options={{
          headerShown: true,
          tabBarStyle: { display: 'none' },
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        component={MarketplacePage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        component={ProfilePage}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      />
    </Tabs.Navigator>
  );
}
