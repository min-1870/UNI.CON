import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack , Slot} from 'expo-router';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import BottomNav from '@/components/ui/BottomNav';

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
        <Stack.Screen name="terms-and-conditions" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="article" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="registration-success" />
      </Stack>
      <Toast />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
