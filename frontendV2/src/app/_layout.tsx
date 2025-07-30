
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import ThemedView from '@/components/ThemedView';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const maxContentWidth = 500;
  const containerWidth = Math.min(width, maxContentWidth)

  return (
    <ThemeProvider>
      <ToastProvider>
        <ThemedView style={styles.screen}>
          <View style={[styles.outer, { width: width == 0 ? maxContentWidth : containerWidth }]}>
            <Stack
              screenOptions={{
                animation: 'default',
                headerShown: false,
              }}
            >
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="forgotPassword" />
              <Stack.Screen name="resetPassword" />
              <Stack.Screen name="validation" />
              <Stack.Screen name="tnc" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="article/[id]" options={{ headerShown: true }} />
              <Stack.Screen name="notification" options={{ headerShown: true }} />
              <Stack.Screen name="newPassword" options={{ headerShown: true }} />
              <Stack.Screen name="setting" options={{ headerShown: true }} />
              <Stack.Screen name="+not-found" />  
            </Stack>
          </View>
          <StatusBar style="auto" />
        </ThemedView>
      </ToastProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  outer: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 0,
  },
});
