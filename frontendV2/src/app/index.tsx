import { fetchAPI, setData } from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import * as AuthSession from 'expo-auth-session';
import { StyleSheet, View } from 'react-native';
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
    tokenEndpoint:         URLs.tokenEndpoint,
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
      setData('university_colors', JSON.stringify(response.data.university_colors));
      setData('university', response.data.university);
      setData('refresh', response.data.refresh);
      setData('color', response.data.color);
      setData('initial', response.data.initial);
      setData('is_validated', response.data.is_validated);

      Toast.show({
        type: 'success',
        text1: `Hi, ${response.data.id}!`,
      });

      router.push("/(tabs)");
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
      // Generate a code verifier and challenge for PKCE
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

      // Send to Oauth
      await request.makeAuthUrlAsync(discovery);
      const oauth_response = await request.promptAsync(discovery);

      if (oauth_response.type === 'success') {
        const { code } = oauth_response.params;
        
        // Send back the response to API server
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
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText style={styles.badge}>UNI.CON</ThemedText>
        <ThemedText type="university" >Welcome Back</ThemedText>
        <ThemedText type='contentSubTitle'>Sign in to continue</ThemedText>

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
  onPress={() => router.push("/forgot-password")}
  style={styles.passwordForgot}
>
  Forgot Password?
</ThemedText>

        <ThemedButton onPress={handleSubmit} disabled={loading} style={styles.loginButton}>
          <ThemedText>{loading ? 'Logging in...' : 'Login'}</ThemedText>
        </ThemedButton>

        <View style={styles.divider} />

        <ThemedText style={styles.footerText}>
          Don't have an account yet? <Link href="/register" style={styles.link}>Sign Up</Link>
        </ThemedText>

        <View style={styles.socialButtonContainer}>
          <ThemedButton onPress={() => googleLogin()} disabled={loading} style={styles.googleButton}>
            <View style={styles.googleButtonContent}>
              <View style={styles.googleIconWrapper}>
                {/* @ts-ignore */}
                <svg viewBox="0 0 48 48" width="20" height="20">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              </View>
              <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
            </View>
          </ThemedButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9fafb',
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
    backgroundColor:'f3f4f6',
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
  loginButton: {
    backgroundColor: '#4ade80',
    borderRadius: 30,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  googleButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
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
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
});