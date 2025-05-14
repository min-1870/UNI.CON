import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI, setData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import React, { useState } from "react";



export default function NewPasswordPage() {
  
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword !== newConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const response = await fetchAPI(URLs.NEW_PASSWORD, {
      method: 'POST',
      token: true,
      body: {
        current_password: password,
        new_password: newPassword,
      },
    });
    if (!response.error) {
      setSuccess(true);
    }else{
      setError(response?.data?.detail || "An error occurred");
    }
    setLoading(false);
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.textInputContainer}>
        <ThemedText type="defaultSemiBold">Initial Password</ThemedText>
        <ThemedInput
          onChangeText={setPassword}
          value={password}
          editable={!success}
          placeholder="Password"
          keyboardType='default'
          secureTextEntry={true}
        />
        <ThemedText type="defaultSemiBold">New Password</ThemedText>
        <ThemedInput
          onChangeText={setNewPassword}
          value={newPassword}
          editable={!success}
          placeholder="Password"
          keyboardType='default'
          secureTextEntry={true}
        />
        <ThemedText type="defaultSemiBold">Confirm Password</ThemedText>
        <ThemedInput
          onChangeText={setNewConfirmPassword}
          value={newConfirmPassword}
          editable={!success}
          placeholder="Password"
          keyboardType='default'
          secureTextEntry={true}
        />
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>
        {error || <ThemedText type="error">{error}</ThemedText>}
        {success && (
          <ThemedText type="defaultSemiBold">Password Updated Successfully</ThemedText>
        )}
        <ThemedButton 
          onPress={success ? ()=>{
            setPassword("");
            setNewPassword("");
            setNewConfirmPassword("");
            router.push(`/profile`);
          } : handleUpdatePassword} 
          disabled={loading}
          type={'auth'}
        >
          {success ? 'Back to Profile' : loading ? 'Updating Password..' : 'Update Password'}
        </ThemedButton>
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
  textInputContainer: {
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
});
