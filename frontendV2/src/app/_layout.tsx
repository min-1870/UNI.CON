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
                duration = 700; // Extra long for maximum spring fun! 🎯
              }
              
              // Debug logging
              if (animDirection) {
                console.log(`🎭 Stack Animation: Route ${route.name} → ${animation} (${duration}ms) [${animDirection}]`);
              }
              
              // Special enhanced animation for post screen (bottom slide)
              const isPostScreen = animDirection === 'bottom';
              
              return {
                animation: animation as any,
                headerShown: false,
                animationDuration: duration,
                animationTypeForReplace: 'push',
                // Enhanced animation options for smoother feel
                gestureEnabled: true,
                gestureDirection: isPostScreen ? 'vertical' : 'horizontal',
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: isPostScreen ? {
                      // SUPER bouncy spring animation for post screen! 🚀
                      stiffness: 400,
                      damping: 1,
                      mass: 0.8,
                      overshootClamping: false, // Allow maximum bounce!
                      restDisplacementThreshold: 0.001,
                      restSpeedThreshold: 0.001,
                    } : {
                      // Regular smooth animation for other screens
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
                                         config: isPostScreen ? {
                       // Fun bouncy close animation for post screen! 🎪
                       stiffness: 250,
                       damping: 20,
                       mass: 1,
                       overshootClamping: false,
                       restDisplacementThreshold: 0.001,
                       restSpeedThreshold: 0.001,
                     } : {
                      // Regular smooth animation for other screens
                      stiffness: 1000,
                      damping: 500,
                      mass: 3,
                      overshootClamping: true,
                      restDisplacementThreshold: 0.01,
                      restSpeedThreshold: 0.01,
                    },
                  },
                },
                // Additional fancy effects for post screen
                ...(isPostScreen && {
                  cardStyle: {
                    backgroundColor: 'transparent',
                  },
                                     cardStyleInterpolator: ({ current, next, layouts }: any) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateY: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [layouts.screen.height, 0],
                              extrapolate: 'clamp',
                            }),
                          },
                                                     {
                             scale: current.progress.interpolate({
                               inputRange: [0, 0.6, 0.8, 0.95, 1],
                               outputRange: [0.7, 1.1, 0.95, 1.05, 1],
                               extrapolate: 'clamp',
                             }),
                           },
                           {
                             rotate: current.progress.interpolate({
                               inputRange: [0, 0.3, 0.6, 1],
                               outputRange: ['-2deg', '1deg', '-0.5deg', '0deg'],
                               extrapolate: 'clamp',
                             }),
                           },
                        ],
                                                 opacity: current.progress.interpolate({
                           inputRange: [0, 0.2, 0.4, 0.7, 1],
                           outputRange: [0, 0.3, 0.8, 0.95, 1],
                           extrapolate: 'clamp',
                         }),
                      },
                                             overlayStyle: {
                         opacity: current.progress.interpolate({
                           inputRange: [0, 0.5, 1],
                           outputRange: [0, 0.2, 0.4],
                           extrapolate: 'clamp',
                         }),
                         backgroundColor: current.progress.interpolate({
                           inputRange: [0, 1],
                           outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'],
                         }),
                       },
                    };
                  },
                }),
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
