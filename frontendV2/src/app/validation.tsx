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

export default function EmailVerificationPage() {
  const { showToast } = useToast();
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const [loading, setLoading] = useState(false);
  const { forgotPassword = false } = useLocalSearchParams<{ forgotPassword?: string }>();


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

  const handleResend = () => {
    // implement resend logic here
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedCard style={styles.card}>
        <View style={styles.header}>
          <ThemedText size='h1' font='displayBold' >Email Verification</ThemedText>
          <ThemedText size='default' font='textMedium'>Please enter the code that we sent to {'200134kms@gmail.com'} </ThemedText>
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
              Wrong email? <ThemedText color='brand'>Fix</ThemedText>
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
});