import { StyleSheet, View, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import AppContainer from '@/components/AppContainer';
import { API_URL } from "@/constants/Domains";
import { fetchAPI, setData } from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import React, { useState, useEffect } from "react";
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

WebBrowser.maybeCompleteAuthSession();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Theme colors
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');
  const brandColor = useThemeColor({}, 'default_brand_color');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '654153127818-9aao6il7d5vv3ivdb27nlsa58s7i6knl.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;

      Toast.show({
        type: 'success',
        text1: 'Signed in with Google!',
      });

      // Send token to backend or process login here if needed
      router.push("/" as any);
    }
  }, [response]);

  const handleSubmit = async () => {
    const url = `${API_URL}/account/user/login/`;
    setLoading(true);

    const response = await fetchAPI(url, {
      method: 'POST',
      token: false,
      body: { email, password },
    });

    if (!response.error) {
      setData('id', response.data.id);
      setData('access', response.data.access);
      setData('email', response.data.email);
      setData('points', response.data.points);
      setData('university_colors', response.data.university_colors);
      setData('university', response.data.university);
      setData('refresh', response.data.refresh);
      setData('color', response.data.color);
      setData('initial', response.data.initial);
      setData('is_validated', response.data.is_validated);

      Toast.show({
        type: 'success',
        text1: `Hi, ${response.data.id}!`,
      });

      // Navigate to sign up page
      router.replace("/" as any);
    } else {
      setError(response?.data?.detail || "An error occurred");
      Toast.show({
        type: 'error',
        text1: "We couldn't log you in.",
        text2: "Try again.",
      });
    }

    setLoading(false);
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,

    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    card: {
      width: '100%',
      padding: 24,
      backgroundColor: cardBackground,
      borderRadius: 30,
      shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 30,
      elevation: 10,
      borderWidth: colorScheme === 'dark' ? 1 : 0,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
      color: brandColor,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    title: {
      alignSelf: 'center',
      fontSize: 22,
      fontWeight: 'bold',
      color: textColor,
    },
    subtitle: {
      alignSelf: 'center',
      color: placeholderColor,
      marginBottom: 20,
    },
    emailRow: {
      backgroundColor: 'transparent',
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 6,
      marginBottom: 0,
    },
    passwordRow: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 6,
      marginBottom: 0,
    },
    passwordForgot: {
      color: brandColor,
      fontWeight: '600',
      textAlign: 'right',
      marginBottom: 40,
      textDecorationLine: 'underline',
    },
    loginButton: {
      backgroundColor: brandColor,
      borderRadius: 30,
      paddingVertical: 12,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
      alignSelf: 'stretch',
      marginVertical: 16,
    },
    footerText: {
      textAlign: 'center',
      color: placeholderColor,
      marginBottom: 30,
    },
    link: {
      color: brandColor,
      fontWeight: '600',
    },
    socialButtonContainer: {
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    },
    googleButton: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
      backgroundColor: cardBackground,
      borderRadius: 20,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '70%',
    },
    googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    googleIconWrapper: {
      backgroundColor: 'transparent',
      width: 20,
      height: 20,
    },
    googleButtonText: {
      color: textColor,
      fontWeight: '500',
      fontSize: 14,
    },
    googleIcon: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#4285F4' : '#4285F4', // Google blue color
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
            <Text style={styles.badge}>UNI.CON</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <ThemedText>University Email</ThemedText>
            <View style={styles.emailRow}>
              <ThemedInput
                onChangeText={setEmail}
                value={email}
                keyboardType='email-address'
                height={40}
              />
            </View>

            <ThemedText>Password</ThemedText>
            <View style={styles.passwordRow}>
              <ThemedInput
                onChangeText={setPassword}
                value={password}
                secureTextEntry={true}
                height={40}
              />
            </View>

            {error ? <ThemedText type="error">{error}</ThemedText> : null}

            <Text
              style={styles.passwordForgot}
              onPress={() => router.push("/newPassword" as any)}
            >
              Forgot Password?
            </Text>

            <ThemedButton onPress={handleSubmit} disabled={loading} variant="primary">
              {loading ? 'Logging in...' : 'Login'}
            </ThemedButton>

            <View style={styles.divider} />

            <Text style={styles.footerText}>
              Don't have an account yet? <Link href="/register" style={styles.link}>Sign Up</Link>
            </Text>

            <View style={styles.socialButtonContainer}>
              <ThemedButton onPress={() => promptAsync()} disabled={!request} variant="outline">
                <View style={styles.googleButtonContent}>
                  <View style={styles.googleIconWrapper}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              </ThemedButton>
            </View>
          </ThemedView>
        </ThemedView>
      </AppContainer>
    </SafeAreaView>
  );
}