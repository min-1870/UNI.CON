import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, FlatList, View, Pressable } from 'react-native';
import { Link, router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import URLs from "@/constants/Urls";
import {fetchAPI, removeData, getData, setData} from "@/components/Utils";
import ThemedCard from '@/components/ThemedCard';
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useThemeColor } from '@/hooks/useThemeColor';
import * as AuthSession from 'expo-auth-session';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useArticlesStore } from '@/store/articleStore';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import ThemedPopup from '@/components/ThemedPopup';

import { ThemedDropdown, Option } from '@/components/ThemedDropdown';
import { InitialDataType } from '@/constants/types';
const themeOption: Option[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];
const emailNotificationPreferenceOption: Option[] = [
  { label: 'Always', value: 5 },
  { label: 'Sometimes', value: 10 }, 
  { label: 'Rarely', value: 20 }, 
  { label: 'Never', value: 0 }, 
];

export default function SettingPage() {
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupBody, setPopupBody] = useState('');
  const [popupFunction, setPopupFunction] = useState<() => void>(() => () => {});
  const { showToast } = useToast();
  const { mode, setMode } = useTheme();
  const [emailNotificationPreference, setEmailNotificationPreference] = useState<Number>(5);
  const [gmail, setGmail] = useState<String|null>(null);
  const [initialData, setInitialData] = useState<InitialDataType|null>(null);
  const [loading, setLoading] = useState(false);
  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const ERROR_TEXT = useThemeColor({}, 'ERROR_TEXT');
  const navigation = useNavigation();

  const discovery = {
    authorizationEndpoint: URLs.authorizationEndpoint,
    tokenEndpoint: URLs.tokenEndpoint,
  };

  useEffect(() => {
      const fetchWhoami = async () => {
        setLoading(true);
        const response = await fetchAPI(URLs.WHOAMI, {
          method: 'POST',
          token: true,
        });

        if (!response.error) {
          setData('initialData', JSON.stringify(response.data));
          setData('access', response.data.access);
          setData('refresh', response.data.refresh);
          setInitialData(response.data);
          setEmailNotificationPreference(response.data.email_notifications_threshold);
          setGmail(response.data.gmail);
        } else {
          showToast({
            type: 'error',
            text1: "Failed to fetch user data.",
          });
        }

        setLoading(false);
      };
      fetchWhoami();
  }, []);

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

  const handleForgotPassword = async () => {
    setLoading(true);
    const storedStr = await getData('initialData');
    const initialData = storedStr ? JSON.parse(storedStr) : {};
    const response = await fetchAPI(URLs.FORGOT_PASSWORD, {
      method: 'POST',
      token: true,
      body: { email: initialData.email },
    });

    if (!response.error) {
      showToast({
        type: 'success',
        text1: "We've sent you a validation code to your email.",
      });
      router.push({
        pathname: '/validation',
        params: { forgotPassword: 1 , fromSetting: 1 , email: initialData.email }, 
      });
    } else {
      showToast({
        type: 'error',
        text1: "We couldn't find your account in.",
      });
    }

    setLoading(false);
  };
    
  
  const handleEmailNotificationPreference = async (threshold:Number) => {
    setLoading(true);
    const response = await fetchAPI(URLs.EMAIL_NOTIFICATION_THRESHOLD, {
      method: 'POST',
      token: true,
      body: { threshold },
    });

    if (!response.error) {
      showToast({
        type: 'success',
        text1: response.data?.detail || 'Email notification preference updated successfully.',
      });
      setEmailNotificationPreference(threshold);
    } else {
      showToast({
        type: 'error',
        text1: `Sorry, ${response?.data?.detail || "An error occurred"}!`,
      });
    }
    setLoading(false);
  };

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
      const state = response.data.state;
      // Generate a code verifier and challenge for PKCE
      const request = new AuthSession.AuthRequest({
        clientId: URLs.GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'], 
        redirectUri: GOOGLE_LINK_CALLBACK_URL,
        responseType: 'code',
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
          state: state,
        },
      });

      // Send to Oauth
      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { code } = result.params;

        // Send back the response to API server
        const response = await fetchAPI(
          URLs.GOOGLE_LINK_URL, {
          method: 'POST',
          token: true,
          body: { code, state, code_verifier: request.codeVerifier }
        });

        if (!response.error) {
          showToast({
            type: 'success',
            text1: 'Google account connected successfully.',
          });

        } else {
          showToast({
            type: 'error',
            text1: `Sorry, ${response?.data?.detail || "Unexpected Error"}!`
          });
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
  
  const handleDeleteAccount = () => {
    showToast({
      type: 'error',
      text1: 'This feature is not implemented yet.',
    });
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
            <Pressable style={styles.button} onPress={handleForgotPassword}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="lock" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Forgot Password</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={()=>{gmail ? null : connectGoogle()}}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="link" size={15} color={DEFAULT_TEXT} />
                <ThemedText >{gmail ? 'Google Account' : 'Connect Google Account'}</ThemedText>
              </View>
              {gmail ? (
                <ThemedText size='smaller' color='gray'>{gmail}</ThemedText>
              ):(
                <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
              )}
            </Pressable>
          </View>
          <View >
            <Pressable style={styles.button} onPress={()=> {
              setPopupTitle('Logout');
              setPopupBody('Are you sure you want to logout?');
              setPopupFunction(() => handleLogout);
              setPopupVisible(true);
            }}>
              <View style={styles.buttonText}>
                <Feather style={{marginTop:2}} name="log-out" size={15} color={ERROR_TEXT} />
                <ThemedText color='red' >Logout</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={ERROR_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>

      <View style={{zIndex:1000}}>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Appearance</ThemedText>
            <View style={styles.button}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="moon" size={15} color={DEFAULT_TEXT} />
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

      <View style={{zIndex:900}}>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Notification</ThemedText>
          <View style={[styles.button, {zIndex:1}]}>
            <View style={styles.buttonText}>
              <Octicons style={{marginTop:2}} name="mail" size={15} color={DEFAULT_TEXT} />
              <ThemedText >Email notifications</ThemedText>
            </View>
            <ThemedDropdown
              options={emailNotificationPreferenceOption}
              selectedValue={emailNotificationPreference}
              onValueChange={(v) => {handleEmailNotificationPreference(v);}}
              style={{width:130}}
            />
          </View>
          <View >
            <Pressable style={styles.button} onPress={() => {
              setPopupTitle('Turn off push notification');
              setPopupBody('Are you sure you want to turn off push notification? You will not receive any notifications from the app.');
              setPopupFunction(() => () => {
                showToast({
                  type: 'success',
                  text1: 'Push notification turned off successfully.',
                });
              });
              setPopupVisible(true);
            }}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="bell" size={15} color={DEFAULT_TEXT} />
                <ThemedText >Push notifications</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={DEFAULT_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>

      <View>
        <ThemedCard style={styles.card}>
          <ThemedText size='h3' font='textBold' style={styles.title}>Graduation</ThemedText>
          <View >
            <Pressable style={styles.button} onPress={() => {
              setPopupTitle('Delete Account');
              setPopupBody('Are you sure you want to delete your account? This action cannot be undone.');
              setPopupFunction(() => handleDeleteAccount);
              setPopupVisible(true);
            }}>
              <View style={styles.buttonText}>
                <Octicons style={{marginTop:2}} name="mortar-board" size={15} color={ERROR_TEXT} />
                <ThemedText color='red' >Delete your account</ThemedText>
              </View>
              <AntDesign style={{marginTop:2}} name="arrowright" size={15} color={ERROR_TEXT} />
            </Pressable>
          </View>
        </ThemedCard>
      </View>
      <ThemedPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupBody}
        onCancel={() => setPopupVisible(false)}
        onConfirm={() => {
          setPopupVisible(false);
          popupFunction();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
