import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack , Slot} from 'expo-router';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const DEFAULT_BACKGROUND = useThemeColor({}, 'DEFAULT_BACKGROUND');
  
  const maxContentWidth = 500;
  const containerWidth =
    Platform.OS === 'web' ? Math.min(width, maxContentWidth) : width;
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'DMSerifDisplay-Regular': require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
      'DMSerifDisplay-Italic': require('../assets/fonts/DMSerifDisplay-Italic.ttf'),
      'Roboto-Regular': require('../assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: DEFAULT_BACKGROUND,
    },
    outer: {
      flex: 1,
      alignSelf: 'center',
      width: containerWidth,
    },
  });
  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              animation: 'default',
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />
            <Stack.Screen name="validation" />
            <Stack.Screen name="tnc" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="edit/[id]" options={{ headerShown: true }} />
            <Stack.Screen name="notification" options={{ headerShown: true }} />
            <Stack.Screen name="newPassword" options={{ headerShown: true }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="registerComplete" />      
            <Stack.Screen name="article/[id]" options={{ headerShown: true }} />
          </Stack>
          <Toast />
          <StatusBar style="auto" />
        </ThemeProvider>
      </View>
    </View>
  );
}
