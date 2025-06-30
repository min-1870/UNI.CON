import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, FlatList, View, Pressable } from 'react-native';
import { Link, router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI, setData} from "@/components/Utils";
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedCard from '@/components/ThemedCard';
import React, { useLayoutEffect, useState } from "react";
import { useThemeColor } from '@/hooks/useThemeColor';
import * as AuthSession from 'expo-auth-session';
import Toast from 'react-native-toast-message';
import { AntDesign } from '@expo/vector-icons';



export default function SettingPage() {
  
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const navigation = useNavigation();

  const discovery = {
    authorizationEndpoint: URLs.authorizationEndpoint,
    tokenEndpoint: URLs.tokenEndpoint,
  };

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
      headerTitle: 'Settings',
    });
  }, [navigation, loading, DEFAULT_CARD_BACKGROUND, DEFAULT_TEXT]);



  const connectGoogle = async () => {
    const GOOGLE_LINK_CALLBACK_URL = AuthSession.makeRedirectUri();
    try {

      // Get temp session ID from the API server
      const response = await fetchAPI(URLs.TEMP_STATE, {
        method: 'GET',
        token: true,
      });

      if (response.error) {
      Toast.show({
        type: 'success',
        text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
      });
        return;
      }

      // Generate a code verifier and challenge for PKCE
      const request = new AuthSession.AuthRequest({
        clientId: URLs.GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'], 
        redirectUri: GOOGLE_LINK_CALLBACK_URL,
        responseType: 'code',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
          state: response.data.state,
        },
      });

      // Send to Oauth
      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { code, state } = result.params;

        // Send back the response to API server
        const response = await fetchAPI(
          URLs.GOOGLE_LINK_URL, {
          method: 'POST',
          token: true,
          body: { code, state, code_verifier: request.codeVerifier }
        });

        if (response.error) {
          Toast.show({
            type: 'success',
            text1: `Hi, ${response?.data?.detail || "An error occurred"}!`,
          });
          return;
        }

      } else {
        console.log("Google sign-in cancelled or failed:", result);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View>
        <ThemedCard style={styles.card}>
          <ThemedText type='contentTitle' style={styles.title}>Account</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/newPassword')}>
              <View style={styles.buttonText}>
                <Octicons name="key" size={10} color={DEFAULT_TEXT} />
                <ThemedText type='default'>Update Password</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color={DEFAULT_TEXT} />
              
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/newPassword')}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="lock" size={10} color={DEFAULT_TEXT} />
                <ThemedText type='default'>Forgot Password</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={connectGoogle}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="link" size={10} color={DEFAULT_TEXT} />
                <ThemedText type='default'>Connect Google Account</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>

      <View>
        <ThemedCard style={styles.card}>
          <ThemedText type='contentTitle' style={styles.title}>Appearance</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/newPassword')}>
              <ThemedText type='default'>Dark Mode</ThemedText>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>

      <View>
        <ThemedCard style={styles.card}>
          <ThemedText type='contentTitle' style={styles.title}>Notification</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/newPassword')}>
              <ThemedText type='default'>Turn off email notification</ThemedText>
              <AntDesign style={{marginTop:2}} name="arrowright" size={10} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    gap: 15,
    paddingVertical: 20,
  },
  title:{
    // margin: 15,
    marginBottom: 10,
  },
  card:{
    gap:20
  },
  button:{
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent: 'space-between'
  },
  buttonText:{
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    gap: 10,
  },
});
