
import { StyleSheet, View } from 'react-native';
import { router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import ThemedCard from '@/components/ThemedCard';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import React, { useLayoutEffect, useState } from "react";
import { useThemeColor } from '@/hooks/useThemeColor';

import Toast from 'react-native-toast-message';



export default function NewPasswordPage() {
  
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    if (newPassword !== newConfirmPassword) {
      Toast.show({
        type: 'error',
        text1: `Passwords do not match..`,
      });
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
      Toast.show({
        type: 'success',
        text1: `Password Updated Successfully !!`,
      });
       setPassword("");
       setNewPassword("");
       setNewConfirmPassword("");
      router.push(`/profile`);
    }else{
      Toast.show({
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
              secureTextEntry={true}
            />
          </View>
          <View style={styles.newPwWrapper}>
            <ThemedText>New Password</ThemedText>
            <ThemedInput
              onChangeText={setNewPassword}
              value={newPassword}
              placeholder="Password"
              keyboardType='default'
              secureTextEntry={true}
            />
          </View>
          <View style={styles.newPwWrapper}>
            <ThemedText>Confirm Password</ThemedText>
            <ThemedInput
              onChangeText={setNewConfirmPassword}
              value={newConfirmPassword}
              placeholder="Password"
              keyboardType='default'
              secureTextEntry={true}
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
});
