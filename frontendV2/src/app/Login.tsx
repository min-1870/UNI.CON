import { Pressable, StyleSheet, View } from 'react-native';
import { fetchAPI, setData } from "@/components/Utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';




WebBrowser.maybeCompleteAuthSession();

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const ALWAYS_WHITE = useThemeColor({}, 'ALWAYS_WHITE');
  

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
      setData('initialData', JSON.stringify(response.data))
      setData('access', response.data.access);
      setData('refresh', response.data.refresh);

      showToast({
        type: 'success',
        text1: `Hi, Welcome Back!!`,
      });
      router.push("/(tabs)");
    } else {
      if (response?.status === 403) {
        setData('initialData', JSON.stringify(response.data))
        setData('access', response.data.access);
        setData('refresh', response.data.refresh);
        showToast({
          type: 'success',
          text1: `Hi, Please validate your account!!`,
        });
        router.push("/validation");
      } else {
        showToast({
          type: 'error',
          text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
        });
      }
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
          showToast({
            type: 'error',
            text1: 'Sorry, Google account is not registered..',
          });
          return;
        }

      } else {
        showToast({
          type: 'error',
          text1: 'Sorry, Failed to login with Google..',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        text1: `Sorry, ${err || "An unexpected error occurred"}!`,
      });
    }
    
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'center',
    },    
    card:{
      gap:20,
    },
    header: {
      marginTop: 20,
    },
    footer:{
      marginTop: 30,
      alignItems: 'center',
      gap: 15,
    },
    socialButtonContainer: {
      alignItems: 'center',
      marginBottom: 30,
      width: '100%',
    },
    googleButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ALWAYS_WHITE,
      width: '70%',
      marginTop: 30,
      marginBottom: 20,
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
    row:{
      gap:20,
    },
    inputWrapper:{
      gap:10,
    },
    forgotPasswordText: {
      textAlign: 'right',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>

        <View style={styles.header}>
          <ThemedText size='h1' font='displayBold'  >Welcome Back</ThemedText>
          <ThemedText size='bigger' font='textMedium' >Sign in to continue</ThemedText>
        </View>

        
        <View style={styles.row}>
          <View style={styles.inputWrapper}>
            <ThemedText>University Email</ThemedText>
            <ThemedInput
              onChangeText={setEmail}
              value={email}
              type="auth"
              keyboardType='email-address'
              placeholder='example@university.edu.au'
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <ThemedText>Password</ThemedText>
              <ThemedInput
                onChangeText={setPassword}
                value={password}
                secureTextEntry={true}
                placeholder='*********'
              />
              <ThemedText
                underline={true}
                size='smaller'
                color='brand'
                style={styles.forgotPasswordText}
                onPress={() => router.push("/forgotPassword")}
              >
                Forgot Password?
              </ThemedText>
            </View>
          </View>
        </View>


        <View style={styles.footer}>
          <ThemedButton  onPress={handleSubmit} disabled={loading} type='auth'>
            <ThemedText size='default' color='black' font='textMedium' >{loading ? 'Logging in...' : 'Login'}</ThemedText>
          </ThemedButton>
          <Pressable onPress={() => router.push("/register")} disabled={loading}>
            <ThemedText color='gray'>
              Don't have an account yet? <ThemedText color='brand'>Sign Up</ThemedText>
            </ThemedText>
          </Pressable>
          
          <Pressable onPress={() => googleLogin()} disabled={loading} style={styles.googleButton}>
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
              <ThemedText color='black'>Continue with Google</ThemedText>
            </View>
          </Pressable>
          
        </View>
      </ThemedCard>
    </ThemedView>
  );
}
