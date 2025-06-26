import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'DMSerifDisplay-Regular': require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
      'DMSerifDisplay-Italic': require('../assets/fonts/DMSerifDisplay-Italic.ttf'),
      'Roboto-Regular': require('../assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
  });
  const user = true;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              headerShown: false,
              animationDuration: 200,
              animationTypeForReplace: 'push',
              gestureEnabled: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen 
              name="home" 
              options={{ 
                animation: 'slide_from_left',
                animationDuration: 200
              }} 
            />
            <Stack.Screen 
              name="search" 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: 200
              }} 
            />
            <Stack.Screen 
              name="post" 
              options={{ 
                animation: 'slide_from_bottom',
                animationDuration: 200
              }} 
            />
            <Stack.Screen 
              name="marketplace" 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: 200
              }} 
            />
            <Stack.Screen 
              name="profile" 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: 200
              }} 
            />
            <Stack.Screen 
              name="register" 
              options={{ 
                animation: 'none',
                animationDuration: 0
              }} 
            />
            <Stack.Screen 
              name="Login" 
              options={{ 
                animation: 'none',
                animationDuration: 0
              }} 
            />
            <Stack.Screen name="validation" />
            <Stack.Screen name="tnc" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="article" options={{ headerShown: true }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="sign-in-complete" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="newPassword" />
            <Stack.Screen name="notification" />
          </Stack>
          <Toast />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
