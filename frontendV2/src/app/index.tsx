import { fetchAPI, setData } from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import AppContainer from '@/components/AppContainer';
import * as AuthSession from 'expo-auth-session';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { Link, router } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";

WebBrowser.maybeCompleteAuthSession();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const GOOGLE_LOGIN_CALLBACK_URL = AuthSession.makeRedirectUri();
  const discovery = {
    authorizationEndpoint: URLs.authorizationEndpoint,
    tokenEndpoint: URLs.tokenEndpoint,
  };

  const handleSubmit = async () => {
    setLoading(true);

    const response = await fetchAPI(URLs.LOGIN, {
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

      router.push("/feed");
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

  const googleLogin = async () => {
    setLoading(true);
    try {
      const request = new AuthSession.AuthRequest({
        clientId: URLs.GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'], 
        redirectUri: GOOGLE_LOGIN_CALLBACK_URL,
        responseType: 'code',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      await request.makeAuthUrlAsync(discovery);
      const oauth_response = await request.promptAsync(discovery);

      if (oauth_response.type === 'success') {
        const { code } = oauth_response.params;
        
        const login_response = await fetchAPI(
          URLs.GOOGLE_LOGIN, {
          method: 'POST',
          token: false,
          body: { code, code_verifier: request.codeVerifier }
        });

        if (!login_response.error) {
          router.push("/(tabs)");
        } else {
          console.log(login_response)
          setError(login_response?.data?.detail || "Google account is not registered");
          return;
        }
      } else {
        setError("Failed to login with Google");
      }
    } catch (err) {
      setError(`Unexpected error: ${err}`);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
        <ThemedText style={styles.badge}>UNI.CON</ThemedText>
        <ThemedText type="Wording">Welcome Back</ThemedText>
        <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>

        <ThemedText>University Email</ThemedText>
        <View style={styles.emailRow}>
          <ThemedInput
            onChangeText={setEmail}
            value={email}
            keyboardType='email-address'
          />
        </View>

        <ThemedText>Password</ThemedText>
        <View style={styles.passwordRow}>
          <ThemedInput
            onChangeText={setPassword}
            value={password}
            secureTextEntry={true}
          />
        </View>

        {error ? <ThemedText type="error">{error}</ThemedText> : null}

        <ThemedText
          type="link"
          onPress={() => router.push("/Login")}
          style={styles.passwordForgot}
        >
          Forgot Password?
        </ThemedText>

        <ThemedButton onPress={handleSubmit} disabled={loading} type="auth">
          {loading ? 'Logging in...' : 'Login'}
        </ThemedButton>

        <View style={styles.divider} />

        <ThemedText style={styles.footerText}>
          Don't have an account yet? <Link href="/register" style={styles.link}>Sign Up</Link>
        </ThemedText>

        <View style={styles.socialButtonContainer}>
          <ThemedButton onPress={() => googleLogin()} disabled={loading} type="auth">
            <View style={styles.googleButtonContent}>
              <View style={styles.googleIconWrapper}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
            </View>
          </ThemedButton>
        </View>
          </ThemedView>
        </ThemedView>
      </AppContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#d1fae5',
    color: '#059669',
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
  },
  subtitle: {
    alignSelf: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  emailRow: {
    backgroundColor: '#f3f4f6',
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
    color: '#059669',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 40,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 30,
  },
  link: {
    color: '#059669',
    fontWeight: '600',
  },
  socialButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconWrapper: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});