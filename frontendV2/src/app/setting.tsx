import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, FlatList, View, Pressable } from 'react-native';
import { Link, router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI, removeData} from "@/components/Utils";
import ThemedCard from '@/components/ThemedCard';
import React, { useLayoutEffect, useState } from "react";
import { useThemeColor } from '@/hooks/useThemeColor';
import * as AuthSession from 'expo-auth-session';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useArticlesStore } from '@/store/articleStore';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';


import { ThemedDropdown, Option } from '@/components/ThemedDropdown';
const themeOption: Option[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export default function SettingPage() {
  const { showToast } = useToast();
  const { mode, setMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
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
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
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
          showToast({
            type: 'error',
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
  
      
  const handleLogout = async () => {
    removeData();
    useArticlesStore.getState().clear();
    showToast({
      type: 'success',
      text1: 'Logged out successfully',
    });
    router.replace('/login');
  }
  
  return (
    <ThemedView style={[styles.container, { overflow: 'visible' }]}>
      <View>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Account</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/newPassword')}>
              <View style={styles.buttonText}>
                <Octicons name="key" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Update Password</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
              
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={() => router.push('/forgotPassword')}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="lock" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Forgot Password</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={connectGoogle}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="link" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Connect Google Account</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={handleLogout}>
              <View style={styles.buttonText}>
                <Feather style={{marginTop:2}} name="log-out" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Logout</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>

      <View style={{zIndex:1000}}>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Appearance</ThemedText>
            <View style={styles.button}>
              <View style={styles.buttonText}>
                <Feather style={{marginTop:2}} name="moon" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Theme</ThemedText>
              </View>
              <ThemedDropdown
                options={themeOption}
                selectedValue={mode}
                onValueChange={(v) => setMode(v as ThemeMode)}
                style={{width:90}}
              />
          </View>
        </ThemedCard>
      </View>

      <View>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Notification</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => (showToast({ type: 'error', text1: `Hi, welcomwelccomewelcomwelccomewelcomwelccomewelcomwelccome !`,}))}>
              <ThemedText >Turn off email notification</ThemedText>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
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
    paddingVertical: 3,
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
