import { Pressable, StyleSheet, View } from 'react-native';
import { fetchAPI } from "@/components/Utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";

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
      marginBottom: 20,
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
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>

        <View style={styles.header}>
            <ThemedText size='h1' font='displayBold'>Forgot Password</ThemedText>
            <ThemedText size='bigger' font='textMedium'>Enter your university email to receive a Code</ThemedText>
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
        
        <View style={styles.footer}>
          <ThemedButton type='auth' onPress={handleSubmit} disabled={loading}>
            <ThemedText size='default' color='black' font='textMedium' >{loading ? 'Sending OTP...' : 'Next'}</ThemedText>
          </ThemedButton>
          <Pressable onPress={() => router.push("/login")} disabled={loading}>
            <ThemedText color='gray'>
              Remember your password? <ThemedText color='brand'>Sign In</ThemedText>
            </ThemedText>
          </Pressable>
        </View>

      </ThemedCard>
    </ThemedView>
  );
}
