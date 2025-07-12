import { Pressable, StyleSheet, View } from 'react-native';
import { fetchAPI } from "@/components/Utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';   

export default function forgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');

  const handleSubmit = async () => {
    setLoading(true);

    const response = await fetchAPI(URLs.FORGOT_PASSWORD, {
      method: 'POST',
      token: false,
      body: { email },
    });

    if (!response.error) {
      router.push({
        pathname: '/validation',
        params: { forgotPassword: 1 , email: email }, 
      });
    } else {
      showToast({
        type: 'error',
        text1: "We couldn't find your account in.",
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
      paddingTop: 32,
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
    backButton: {
      position: 'absolute',
      top: 25,
      left: 15,
      zIndex: 10,
    },
  });

  return (
    <ThemedView style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={uniconContent} />
        </Pressable>
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
            keyboardType='email-address'
            placeholder='example@university.edu.au'
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
