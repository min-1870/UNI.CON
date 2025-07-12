import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import ThemedView from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedCard from '@/components/ThemedCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchAPI, setData } from "@/components/Utils";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EmailVerificationPage() {
  const { showToast } = useToast();
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const resendRef = useRef<number>(0);
  const uniconContent = useThemeColor({}, 'UNICON_CONTENT');

  const [loading, setLoading] = useState(false);
  const { forgotPassword = false } = useLocalSearchParams<{ forgotPassword?: string }>();
  const { fromSetting = false } = useLocalSearchParams<{ fromSetting?: string }>();


  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text) || text === '') {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text && index < inputs.current.length - 1) {
        inputs.current[index + 1]?.focus();
      }

      if (newCode.every(char => char !== '')) {
        handleVerify(newCode.join(''));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      setCode(prev => {
        const newCode = [...prev];
        newCode[index - 1] = '';
        return newCode;
      });
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (entered?: string) => {
    const finalCode = entered || code.join('');
    setLoading(true);
    const response = await fetchAPI(forgotPassword == '1' ? URLs.VALIDATE_FORGOT_PASSWORD : URLs.VALIDATE, {
      method: 'POST',
      token: forgotPassword ? false : true,
      body: { validation_code: finalCode, email: email },
    });
    
    if (!response.error) {
      if (forgotPassword == '1'){
        showToast({
          type: 'success',
          text1: 'Code verified!',
        });
        setLoading(true);
        setData('initialData', JSON.stringify(response.data))
        setData('access', response.data.access);
        setData('refresh', response.data.refresh);
        router.push({
          pathname: '/resetPassword',
          params: { email: email }, 
        });
      } else {
        showToast({
          type: 'success',
          text1: 'Code verified!',
        });
        setLoading(true);
        router.push({
          pathname: '/(tabs)',
        });
      }
    } else {
      setLoading(false);
      showToast({
        type: 'error',
        text1: response?.data?.detail || 'Verification failed',
      });
    }
    
    setCode(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    resendRef.current += 1;
    if (resendRef.current > 3) {
      showToast({
        type: 'error',
        text1: "You've exceeded the maximum number of resend attempts. Please try again later.",
      });
      setLoading(false);
      return;
    }
    const response = await fetchAPI(URLs.RESEND_VALIDATION_CODE, {
      method: 'POST',
      token: false,
      body: { email },
    });

    if (!response.error) {
      showToast({
        type: 'success',
        text1: "We've resent the verification code to your email.",
      });
    } else {
      showToast({
        type: 'error',
        text1: "We couldn't resend the code. Please try again later.",
      });
    }
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      {fromSetting && (
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={uniconContent} />
          <ThemedText color='brand'>Back</ThemedText>
        </Pressable>
      )}
      <ThemedCard style={styles.card}>
        <View style={styles.header}>
          <ThemedText size='h1' font='displayBold' >Email Verification</ThemedText>
          <ThemedText size='default' font='textMedium'>Please enter the code that we sent to {email} </ThemedText>
        </View>
        <View style={styles.codeInputRow}>
          {[...Array(6)].map((digit, i) => (
            <ThemedInput
              key={i}
              type="validation"
              maxLength={1}
              keyboardType="number-pad"
              returnKeyType="next"
              value={digit}
              onKeyPress={e => handleKeyPress(e, i)}
              onChangeText={text => handleChange(text, i)}
              onSubmitEditing={() => inputs.current[i + 1]?.focus()}
              inputRef={(el: TextInput | null) => (inputs.current[i] = el)}    // ← capture ref
              editable={!loading}
            />
          ))}
        </View>
        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/register')} disabled={loading} >
            <ThemedText color='gray'>
              Wrong email? <ThemedText color='brand'>Edit it</ThemedText>
            </ThemedText>
          </Pressable>
          <Pressable onPress={handleResend} disabled={loading} >
            <ThemedText color='gray'>
              Didn't receive email? <ThemedText color='brand'>Resend</ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  card: {
    gap: 40,
  },
    header:{
      marginTop: 30,
    },
    footer:{
      marginBottom: 30,
      alignItems: 'center',
      gap: 10,
    },
  codeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 15,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});