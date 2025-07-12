import { Pressable, StyleSheet, View } from 'react-native';
import { fetchAPI, passwordStrength } from "@/components/Utils";
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
import { Octicons } from '@expo/vector-icons';




export default function LoginPage() {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const ALWAYS_WHITE = useThemeColor({}, 'ALWAYS_WHITE');
  const passwordStrengthState = passwordStrength(password);

  const handleSubmit = async () => {
    setLoading(true);
    if (!password || !confirmPassword) {
      showToast({
        type: 'error',
        text1: 'Oops ! Please fill all entries.',
      });
      setLoading(false);
      return;
    }

    if (passwordStrengthState.overall === false) {
      showToast({
        type: 'error',
        text1: 'Weak Password 🙁'
        });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        type: 'error',
        text1: "Passwords do not match.",
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
      showToast({
        type: 'success',
        text1: `Hi, Welcome Back!!`,
      });
      router.push("/(tabs)");
    } else {
      showToast({
        type: 'error',
        text1: "We couldn't log you in.",
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
    iconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    requirementWrapper: {
      marginLeft: 10,
      gap: 10,
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
                type="auth"
              />
              <View style={styles.requirementWrapper}>
                <View style = {styles.iconWrapper}>
                  <Octicons
                    name={passwordStrengthState.isValidLength ? 'dot-fill' : 'dot'}
                    size={15}
                    color={passwordStrengthState.isValidLength ? '#059669' : '#d1d5db'}
                  />
                  <ThemedText color={passwordStrengthState.isValidLength ? 'brand' : 'gray'} size='smaller'>
                    More than 8 characters required.
                  </ThemedText>
                </View>
                <View style = {styles.iconWrapper}>
                  <Octicons
                    name={passwordStrengthState.hasUpperCase ? 'dot-fill' : 'dot'}
                    size={15}
                    color={passwordStrengthState.hasUpperCase ? '#059669' : '#d1d5db'}
                  />
                  <ThemedText color={passwordStrengthState.hasUpperCase ? 'brand' : 'gray'} size='smaller'>
                    At least one uppercase alphabet required.
                  </ThemedText>
                </View>
                <View style = {styles.iconWrapper}>
                  <Octicons
                    name={passwordStrengthState.hasLowerCase ? 'dot-fill' : 'dot'}
                    size={15}
                    color={passwordStrengthState.hasLowerCase ? '#059669' : '#d1d5db'}
                  />
                  <ThemedText color={passwordStrengthState.hasLowerCase ? 'brand' : 'gray'} size='smaller'>
                    At least one lowercase alphabet required.
                  </ThemedText>
                </View>
                <View style = {styles.iconWrapper}>
                  <Octicons
                    name={passwordStrengthState.hasNumbers ? 'dot-fill' : 'dot'}
                    size={15}
                    color={passwordStrengthState.hasNumbers ? '#059669' : '#d1d5db'}
                  />
                  <ThemedText color={passwordStrengthState.hasNumbers ? 'brand' : 'gray'} size='smaller'>
                    At least one number required.
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <ThemedText>Confirm Password</ThemedText>
              <ThemedInput
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                type="auth"
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
