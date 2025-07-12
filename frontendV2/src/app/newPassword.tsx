
import { StyleSheet, View } from 'react-native';
import { router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import ThemedCard from '@/components/ThemedCard';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI, passwordStrength} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import React, { useLayoutEffect, useState } from "react";
import { useThemeColor } from '@/hooks/useThemeColor';
import { useToast } from '@/contexts/ToastContext';
import { Octicons } from '@expo/vector-icons';





export default function NewPasswordPage() {
  const { showToast } = useToast();
  
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const passwordStrengthState = passwordStrength(newPassword);
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: DEFAULT_CARD_BACKGROUND, // navbar background
        // shadowColor: 'transparent', // remove iOS bottom border
        elevation: 0, // remove Android shadow
        borderWidth: 0, 
      },
      headerTintColor: DEFAULT_TEXT,
      headerTitleAlign: 'center',
      headerTitle: 'Update Password',
    });
  }, [navigation, loading, DEFAULT_CARD_BACKGROUND, DEFAULT_TEXT]);

  const handleUpdatePassword = async () => {
    setLoading(true);
    if (!password || !newPassword || !newConfirmPassword) {
      showToast({
        type: 'error',
        text1: 'Oops ! Please fill all entries.',
      });
      setLoading(false);
      return;
    }
    if (newPassword !== newConfirmPassword) {
      showToast({
        type: 'error',
        text1: `Passwords do not match..`,
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

    const response = await fetchAPI(URLs.NEW_PASSWORD, {
      method: 'POST',
      token: true,
      body: {
        current_password: password,
        new_password: newPassword,
      },
    });
    if (!response.error) {
      showToast({
        type: 'success',
        text1: `Password Updated Successfully !!`,
      });
       setPassword("");
       setNewPassword("");
       setNewConfirmPassword("");
      router.push(`/profile`);
    }else{
      showToast({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }
    setLoading(false);
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedCard>
        <View style={styles.textInputContainer}>
          <View style={styles.currentPwWrapper}>
            <ThemedText>Current Password</ThemedText>
            <ThemedInput
              onChangeText={setPassword}
              value={password}
              placeholder="Password"
              keyboardType='default'
              type='auth'
            />
          </View>
          <View style={styles.newPwWrapper}>
            <ThemedText>New Password</ThemedText>
            <ThemedInput
              onChangeText={setNewPassword}
              value={newPassword}
              placeholder="Password"
              keyboardType='default'
              type='auth'
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
          <View style={styles.newPwWrapper}>
            <ThemedText>Confirm Password</ThemedText>
            <ThemedInput
              onChangeText={setNewConfirmPassword}
              value={newConfirmPassword}
              placeholder="Password"
              keyboardType='default'
              type='auth'
            />
          </View>
        </View>
      </ThemedCard>
      
      <ThemedView style={styles.buttonContainer}>
        <ThemedButton 
          onPress={handleUpdatePassword} 
          disabled={loading}
          type={'auth'}
        >
          <ThemedText size='default' color='black' font='textMedium'>{loading ? 'Updating Password..' : 'Update'}</ThemedText>
        </ThemedButton>
      </ThemedView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingVertical: 20,
  },
  textInputContainer: {
    alignItems: 'flex-start',
    gap: 20,
    width: '100%',
  },
  currentPwWrapper: {
    gap: 10,
    marginBottom: 30,
    width: '100%',
  },
  newPwWrapper: {
    gap: 10,
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  requirementWrapper: {
    marginLeft: 10,
    gap: 10,
  },
    iconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
});
