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
import Toast from 'react-native-toast-message';
import { Link, router } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";



WebBrowser.maybeCompleteAuthSession();

export default function forgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const backgroundColor = useThemeColor({}, 'DEFAULT_BACKGROUND');
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');
  
  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const ALWAYS_WHITE = useThemeColor({}, 'ALWAYS_WHITE');
  


  const handleSubmit = async () => {
    setLoading(true);

    const response = await fetchAPI(URLs.FORGOT_PASSWORD, {
      method: 'POST',
      token: false,
      body: { email },
    });

    if (!response.error) {
      Toast.show({
        type: 'success',
        text1: `Hi, Welcome Back!!`,
      });
      router.push({
        pathname: '/validation',
        params: { forgotPassword: 1 , email: email }, 
      });
    } else {
      setError(response?.data?.detail || "An error occurred");
      Toast.show({
        type: 'error',
        text1: "We couldn't find your account in.",
        text2: "Try again.",
      });
    }

    setLoading(false);
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    socialButtonContainer: {
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    },
    googleButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 20,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ALWAYS_WHITE,
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
      color: ALWAYS_BLACK,
    },
    header: {
      marginTop: 30,
    },
    card:{
      width:'90%',
      maxWidth:500,
      gap:50,
    },
    row:{
      gap:20,
    },
    inputWrapper:{
      gap:10,
    },
    forgotPasswordText: {
      textAlign: 'right',
      color: uniconContent,
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    submitButtonWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonText: {
      color: ALWAYS_BLACK
    }
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>

        <View style={styles.header}>
            <ThemedText type="university">Forgot Password</ThemedText>
            <ThemedText type='contentSubTitle'>Enter your university email to receive a OTP</ThemedText>
        </View>

        
        <View style={styles.inputWrapper}>
          <ThemedText>University Email</ThemedText>
          <ThemedInput
            onChangeText={setEmail}
            value={email}
            type="auth"
            keyboardType='email-address'
          />
        </View>


        <View style={styles.submitButtonWrapper}>
          <ThemedButton  onPress={handleSubmit} disabled={loading} type='auth'>
            <ThemedText style={styles.submitButtonText}>{loading ? 'Sending OTP again...' : 'Send OTP'}</ThemedText>
          </ThemedButton>
            <ThemedText>
            Remember your password? <Link href="/login">Sign In</Link>
            </ThemedText>
        </View>
        

      </ThemedCard>
    </ThemedView>
  );
}
