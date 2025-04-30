import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import {API_URL} from "@/constants/Domains";
import {fetchAPI, setData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import React, { useState } from "react";


export default function RegisterPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: any) => {

    if (password !== confirmationPassword) {
      setError("Passwords do not match");
      return
    }

    if (e && e.preventDefault) e.preventDefault();
    const url = `${API_URL}/account/user/`;
    setLoading(true);
    const response = await fetchAPI(url, {
      method: 'POST',
      token: false,
      body: {
        email: email,
        password: password,
      },
    });

    if (!response.error) {
      setData('id', response.data.id);
      setData('access', response.data.access);
      setData('refresh', response.data.refresh);
      setData('color', response.data.color);
      setData('initial', response.data.initial);
      setData('is_validated', response.data.is_validated);
      setData('email', email);
      router.push("/validation");
    } else {
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">UNI.CON</ThemedText>
      </ThemedView>
      {/* <Link href="/(tabs)" style={{ color: 'blue' }}>SIGN IN</Link>
      <Link href="/register" style={{ color: 'blue' }}>GO TO SIGN UP PAGE</Link> */}
      
      <ThemedView style={styles.textInputContainer}> TODO Fix the input field to match the design
        <ThemedText type="defaultSemiBold">University Email</ThemedText>
        <ThemedInput
          onChangeText={setEmail}
          value={email}
          placeholder="example@university.edu.au"
          keyboardType='email-address'
        />
        <ThemedText type="defaultSemiBold">Password</ThemedText>
        <ThemedInput
          onChangeText={setPassword}
          value={password}
          placeholder="Your Password"
          keyboardType='default'
          secureTextEntry={true}
        />
        <ThemedText type="defaultSemiBold">Password Confirmation</ThemedText>
        <ThemedInput
          onChangeText={setConfirmationPassword}
          value={confirmationPassword}
          placeholder="Your Password"
          keyboardType='default'
          secureTextEntry={true}
        />
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>TODO Fix the button to match the design
        {error || <ThemedText type="error">{error}</ThemedText>}
        <ThemedButton 
          onPress={handleSubmit} 
          disabled={loading}
          type={'auth'}
        >
          {loading ? 'Signing Up..' : 'Sign Up'}
        </ThemedButton>
        <ThemedText type="default">
          Do you have an account? <Link href="/">Log In</Link>
        </ThemedText>
      </ThemedView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  textInputContainer: {
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 300,
    width: '100%',
    gap: 10,
  },
});
