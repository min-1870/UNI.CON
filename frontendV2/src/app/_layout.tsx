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
import BottomNav from '@/components/ui/BottomNav';
import { usePathname } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
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

  // Define which screens should show the bottom nav
  const screensShouldShowBottomNav = [
    '/',
    '/home',
    '/search', 
    '/post',
    '/marketplace',
    '/profile'
  ];

  // Define screens that should NOT show the bottom nav (public routes)
  const screensToHideBottomNav = [
    '/article/',
    '/Login',
    '/register',
    '/validation',
    '/terms',
    '/tnc',
    '/newPassword',
    '/sign-in-complete',
    '/feed'
  ];

  const shouldHideBottomNav = screensToHideBottomNav.some(screen => 
    pathname.startsWith(screen)
  );

  const shouldShowBottomNav = !shouldHideBottomNav && (
    screensShouldShowBottomNav.some(screen => 
      pathname === screen || pathname.startsWith(screen)
    )
  );

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={({ route }) => {
              // Get animation direction from route params for relative navigation
              const animDirection = (route.params as any)?.animDirection;
              
              let animation = 'slide_from_right'; // default
              let duration = 350; // Smoother default timing
              
              // Set animation based on navigation direction
              if (animDirection === 'left') {
                animation = 'slide_from_left';
                duration = 350; // Smoother timing
              } else if (animDirection === 'right') {
                animation = 'slide_from_right';
                duration = 350; // Smoother timing
              } else if (animDirection === 'bottom') {
                animation = 'slide_from_bottom';
                duration = 400; // Slightly longer for bottom slide
              }
              
              // Debug logging
              if (animDirection) {
                console.log(`🎭 Stack Animation: Route ${route.name} → ${animation} (${duration}ms) [${animDirection}]`);
              }
              
              return {
                animation: animation as any,
                headerShown: false,
                animationDuration: duration,
                animationTypeForReplace: 'push',
                // Enhanced animation options for smoother feel
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {
                      stiffness: 1000,
                      damping: 500,
                      mass: 3,
                      overshootClamping: true,
                      restDisplacementThreshold: 0.01,
                      restSpeedThreshold: 0.01,
                    },
                  },
                  close: {
                    animation: 'spring',
                    config: {
                      stiffness: 1000,
                      damping: 500,
                      mass: 3,
                      overshootClamping: true,
                      restDisplacementThreshold: 0.01,
                      restSpeedThreshold: 0.01,
                    },
                  },
                },
              };
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="search" />
            <Stack.Screen name="post" />
            <Stack.Screen name="marketplace" />
            <Stack.Screen name="profile" />
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
            <Stack.Screen 
              name="feed" 
              options={{ 
                animation: 'slide_from_left',
                animationDuration: 250
              }} 
            />
            <Stack.Screen name="article" options={{ headerShown: true }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="sign-in-complete" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="newPassword" />
            <Stack.Screen name="notification" />
          </Stack>
          
          {/* Fixed Bottom Navigation - only show on main app screens */}
          {shouldShowBottomNav && <BottomNav />}
          
          <Toast />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
