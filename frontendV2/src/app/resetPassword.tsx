import { Pressable, StyleSheet, View } from 'react-native';
import { fetchAPI } from "@/components/Utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from "react";
import URLs from "@/constants/Urls";



export default function LoginPage() {
  const { email = 'unknown' } = useLocalSearchParams<{ email?: string }>();
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const ALWAYS_WHITE = useThemeColor({}, 'ALWAYS_WHITE');
  

  const handleSubmit = async () => {
    setLoading(true);
    if (password !== confirmedPassword) {
      setError("Passwords do not match");
      Toast.show({
        type: 'error',
        text1: "Passwords do not match.",
        text2: "Please try again.",
      });
      setLoading(false);
      return;
    }
    const response = await fetchAPI(URLs.RESET_FORGOT_PASSWORD, {
      method: 'POST',
      token: true,
      body: { password },
    });

    if (!response.error) {
      Toast.show({
        type: 'success',
        text1: `Hi, Welcome Back!!`,
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
            <ThemedText size='h1' font='displayBold'>Reset Password</ThemedText>
            <ThemedText size='default' font='textMedium'>Enter your new password below</ThemedText>
        </View>

        
        <View style={styles.row}>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <ThemedText>Password</ThemedText>
              <ThemedInput
                onChangeText={setPassword}
                value={password}
                secureTextEntry={true}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <ThemedText>Password</ThemedText>
              <ThemedInput
                onChangeText={setConfirmedPassword}
                value={confirmedPassword}
                secureTextEntry={true}
              />
            </View>
          </View>
        </View>


        <View style={styles.footer}>
          <ThemedButton  onPress={handleSubmit} disabled={loading} type='auth'>
            <ThemedText size='default' color='black' font='textMedium'>{loading ? 'Resetting password in...' : 'Reset password'}</ThemedText>
          </ThemedButton>
          <Pressable onPress={() => router.push('/login')} disabled={loading} >
            <ThemedText color='gray'>
              Remember password? <ThemedText color='brand'>Sign In</ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </ThemedCard>
    </ThemedView>
  );
}
