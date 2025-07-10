import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import ThemedView from '@/components/ThemedView';
import ThemedCard from '@/components/ThemedCard';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Octicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fetchAPI, setData } from "@/components/Utils";
import URLs from "@/constants/Urls";
function getPasswordStrength(password: string): {
  length: boolean;
  upper: boolean;
  lower: boolean;
} {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
  };
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ length: false, upper: false, lower: false });


  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleRegister = async () => {

    if (!email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Oops ! Please fill all entries.',
        text2: 'All fields are required.',
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match. 🙁',
        text2: 'Try again.',
      });
      return;
    }
    if (!passwordStrength.length || !passwordStrength.upper || !passwordStrength.lower) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password 🙁',
        text2: 'Password must be 8+ chars, include uppercase and lowercase.',
      });
      return;
    }

    setLoading(true);

    const response = await fetchAPI(URLs.REGISTER, {
      method: 'POST',
      token: false,
      body: { email, password },
    });

    if (!response.error) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
      setData('initialData', JSON.stringify(response.data))
      setData('access', response.data.access);
      setData('refresh', response.data.refresh);
      router.push("/validation");
    } else {
      Toast.show({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail}`,
        text2: "Try again.",
      });
    }
    setEmail('');
    setPassword('');
    setConfirmPassword('');
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
    inputRows: {
      gap: 20,
    },
    inputRow: {
      gap: 5,
    },
    inputWrapper: {
      position: 'relative',
    },
    eyeIcon: {
      position: 'absolute',
      right: 12,
      top: '37%',
      transform: [{ translateY: -10 }],
      padding: 4,
    },
    iconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  });
  
  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>


        <View style={styles.header}>
          <ThemedText size='h1' font='displayBold' >Create Account</ThemedText>
          <ThemedText size='bigger' font='textMedium' >Join our university community</ThemedText>
        </View>

        <View style={styles.inputRows}>
        <View style={styles.inputRow}>
          <ThemedText>University Email</ThemedText>
          <ThemedInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            type="auth"
          />
        </View>


        <View style={styles.inputRow}>
          <ThemedText>Password</ThemedText>
          <View style={styles.inputWrapper}>
            <ThemedInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              type="auth"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Octicons name={showPassword ? 'eye-closed' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
            <View >
              <View style = {styles.iconWrapper}>
                <Octicons
                  name={passwordStrength.length ? 'dot-fill' : 'dot'}
                  size={15}
                  color={passwordStrength.length ? '#059669' : '#d1d5db'}
                />
                <ThemedText color={passwordStrength.length ? 'brand' : 'gray'} size='smaller'>
                  More than 8 characters required.
                </ThemedText>
              </View>
              <View style = {styles.iconWrapper}>
                <Octicons
                  name={passwordStrength.upper ? 'dot-fill' : 'dot'}
                  size={15}
                  color={passwordStrength.upper ? '#059669' : '#d1d5db'}
                />
                <ThemedText color={passwordStrength.upper ? 'brand' : 'gray'} size='smaller'>
                  At least one uppercase alphabet required.
                </ThemedText>
              </View>
              <View style = {styles.iconWrapper}>
                <Octicons
                  name={passwordStrength.lower ? 'dot-fill' : 'dot'}
                  size={15}
                  color={passwordStrength.lower ? '#059669' : '#d1d5db'}
                />
                <ThemedText color={passwordStrength.lower ? 'brand' : 'gray'} size='smaller'>
                  At least one lowercase alphabet required.
                </ThemedText>
              </View>
            </View>
          </View>


        <View style={styles.inputRow}>
          <ThemedText>Confirm Password</ThemedText>
          <View style={styles.inputWrapper}>
            <ThemedInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
                  type="auth"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Octicons name={showConfirmPassword ? 'eye-closed' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        </View>

        <View style={styles.footer}>
          <ThemedButton type='auth' onPress={handleRegister} disabled={loading}>
            <ThemedText size='default' color='black' font='textMedium' >{loading ? 'Sending Code...' : 'Next'}</ThemedText>
          </ThemedButton>
          <Pressable onPress={() => router.push("/login")} disabled={loading}>
            <ThemedText color='gray'>
              Have an account? <ThemedText color='brand'>Sign In</ThemedText>
            </ThemedText>
          </Pressable>
        </View>


      </ThemedCard>
    </ThemedView>
  );
}
