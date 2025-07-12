import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import ThemedView from '@/components/ThemedView';
import ThemedCard from '@/components/ThemedCard';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Octicons } from '@expo/vector-icons';
import { fetchAPI, setData, passwordStrength } from "@/components/Utils";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';


export default function RegisterPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordStrengthState = passwordStrength(password);

  const handleRegister = async () => {

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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail}`,
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
    body:{
      gap:20,
    },
    footer:{
      marginTop: 30,
      alignItems: 'center',
      gap: 15,
      marginBottom: 20,
    },
    inputWrapper: {
      gap:10,
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
          <ThemedText size='h1' font='displayBold' >Create Account</ThemedText>
          <ThemedText size='bigger' font='textMedium' >Join our university community</ThemedText>
        </View>

        <View style={styles.body}>
          <View style={styles.inputWrapper}>
            <ThemedText>University Email</ThemedText>
            <ThemedInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder='example@university.edu.au'
            />
          </View>


          <View style={styles.inputWrapper}>
            <ThemedText>Password</ThemedText>
            <ThemedInput
              value={password}
              onChangeText={setPassword}
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


          <View style={styles.inputWrapper}>
            <ThemedText>Confirm Password</ThemedText>
            <ThemedInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              type="auth"
            />
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
