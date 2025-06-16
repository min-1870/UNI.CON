import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, Link } from 'expo-router';
import ThemedView from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '@/hooks/useThemeColor';
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
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ length: false, upper: false, lower: false });

  
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');
  const cardBackgroundColor = useThemeColor({}, 'default_card_background_color');

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleRegister = async () => {

    if (!email || !password || !confirmPassword) {

      Toast.show({
        type: 'error',
        text1: 'Oops ! Please fill all entries. 🙁',
        text2: 'All fields are required.',
      });
      return;
    }

    if (!/\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email. 🙁',
        text2: 'Please use a valid university email.',
      });
      return;
    } else if ( /\S+@+(unsw.edu.au)$/.test(email)) {
      var university = 'unsw' ;
    }
    else  if (/\S+@+(sydney.edu.au)$/.test(email)) {
      var university = 'sydney' ;
    }
    else  if (/\S+@+(uts.edu.au)$/.test(email)) {
      var university = 'uts' ;
    }
    else  if (/\S+@+(unsw.edu.au)$/.test(email)) {
      var university = 'unsw' ;
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
      setError(response?.data?.detail || "An error occurred");
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: backgroundColor,
      padding: 20,
    },
    card: {
      width: '100%',
      padding: 24,
      backgroundColor: cardBackgroundColor,
      borderRadius: 20,
      gap: 30,
      
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: '#d1fae5',
      color: '#059669',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    inputRows: {
      gap: 20,
    },
    inputRow: {
      gap: 5,
    },
    footers:{
      marginTop: 20,
    },
    footerText: {
      textAlign: 'center',
      color: '#6b7280',
    },
    link: {
      color: '#059669',
      fontWeight: '600',
    },
    divider: {
      borderBottomColor: '#e5e7eb', // Tailwind gray-200
      borderBottomWidth: 1,
      marginVertical: 16,
    },
    inputWrapper: {
      position: 'relative',
    },
    eyeIcon: {
      position: 'absolute',
      right: 12,
      top: '30%',
      transform: [{ translateY: -10 }],
      padding: 4,
    },
    nicknameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    atSymbol: {
      fontSize: 16,
      marginRight: 4,
      color: '#6b7280',
    },
    nicknameInput: {
      flex: 1,
    },
  });
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>


        <View>
          <ThemedText style={styles.badge}>UNI.CON</ThemedText>
          <ThemedText type="university" >Create Account</ThemedText>
          <ThemedText type="contentSubTitle">Join our university community</ThemedText>
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
          <ThemedText style={{ fontSize: 12, color: /\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email) ? '#10b981' : '#ef4444', marginLeft: 5, marginRight: 5 }}>
            {/\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email)
              ? '✔️ You can create an account.'
              : '𝗫 Currently 🥲 - only UNSW , University of Sydney , UTS emails are accepted.'}
          </ThemedText>
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
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
          <View style={{ marginTop:6, height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
            <View style={{
              width: `${(Object.values(passwordStrength).filter(Boolean).length / 3) * 100}%`,
              height: '100%',
              backgroundColor: Object.values(passwordStrength).filter(Boolean).length === 3 ? '#10b981' : '#f59e0b',
            }} />
          </View>
          <View style={{ marginTop: 4, marginLeft: 5, marginRight: 5 }}>
            <ThemedText style={{ fontSize: 12, color: passwordStrength.length ? '#10b981' : '#6b7280' }}>
              {passwordStrength.length ? '✔️' : '𝗫'} More than 8 characters required.
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: passwordStrength.upper ? '#10b981' : '#6b7280' }}>
              {passwordStrength.upper ? '✔️' : '𝗫'} At least one uppercase alphabet required.
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: passwordStrength.lower ? '#10b981' : '#6b7280' }}>
              {passwordStrength.lower ? '✔️' : '𝗫'} At least one lowercase alphabet required.
            </ThemedText>
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
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        </View>



        <View style={styles.footers}>
          <ThemedButton type='auth' onPress={handleRegister} disabled={loading}>
            <ThemedText>{loading ? 'Creating Account...' : 'Next'}</ThemedText>
          </ThemedButton>

          <View style={styles.divider} />
          <ThemedText style={styles.footerText}>
            Already have an account? <Link href="/" style={styles.link}>Sign in</Link>
          </ThemedText>
        </View>



      </ThemedView>
    </ThemedView>
  );
}
