import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';


import {API_URL} from "@/constants/Domains";
import {fetchAPI, getData, setData} from "@/components/Utils";
import { SolidButton } from '@/components/ThemedButtons';
import { AuthTextInput } from '@/components/ThemedInputs';
import React, { useState, useEffect } from "react";


export default function ValidationPage() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = await getData('email');
      setEmail(storedEmail||"");
    };
    setData('email', 'z5364523@unsw.edu.au')
    fetchEmail();
  }, []);

  
  const [validationCode, setValidationCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    const url = `${API_URL}/account/user/login/`;
    setLoading(true);
    const response = await fetchAPI(url, {
      method: 'POST',
      token: false,
      body: {
        email: validationCode
      },
    });
    if (!response.error) {
      setData('is_validated', 'true');

      router.push("/(tabs)");
    } else {
      setError(response?.data || "An error occurred");
    }
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer1}>
        <ThemedText type="subtitle">We have sent you an email to</ThemedText>
        <ThemedText type="default">{email}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer2}>
        <ThemedText type="default">It will include 6-digits authentication number.</ThemedText>
        <ThemedText type="default">This code will be valid for 7 minutes.</ThemedText>
      </ThemedView>
      {/* <Link href="/(tabs)" style={{ color: 'blue' }}>SIGN IN</Link>
      <Link href="/register" style={{ color: 'blue' }}>GO TO SIGN UP PAGE</Link> */}
      
      <ThemedView style={styles.textInputContainer}>
        <AuthTextInput
          onChangeText={setValidationCode}
          value={validationCode}
          placeholder="Validation Code"
          keyboardType='number-pad'
        />
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>
        {error || <ThemedText type="error">{error}</ThemedText>}
        <SolidButton 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? 'Submitting..' : 'Submit'}
        </SolidButton>
        <ThemedText type="default">
          I didn't received an email
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
  titleContainer1: {
    alignItems: 'center',
    marginTop: 100,
  },
  titleContainer2: {
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
