import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function EmailVerificationPage() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const [resendCount, setResendCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleInitialSend = () => {
    console.log(`Sending verification code to: ${email}`);
  };

  useEffect(() => {
    handleInitialSend();
  }, []);

  const handleKodeGeneration = (length: number = 6): string => {
    const charset = 'ABCDEFGH!@#$IJ@#$LMNOPQRST@$#&*(%UVWXYZabcdefgh$#@$ijklmnopqrstuvwxyz*($#0123456789';
    const timestamp = Math.floor(new Date().getTime() / 1000).toString();
    const combinedCharset = charset + timestamp; // Include timestamp in the charset to make it unique

    let token = '';
    for (let i = 0; i < length; i++) {
      token += combinedCharset[Math.floor(Math.random() * combinedCharset.length)];
    }
    return token;
  };

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text) || text === '') {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text !== '' && index < 5) {
        setTimeout(() => {
          inputs.current[index + 1]?.focus();
        }, 100); // slight delay for better user experience
      }

      // Auto-submit if all digits are entered
      if (newCode.every(char => char !== '')) {
        handleVerify(newCode.join(''));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      setTimeout(() => {
        inputs.current[index - 1]?.focus();
      }, 100);
    }
  };

  const handleVerify = (entered?: string) => {
    const finalCode = entered || code.join('');
    setLoading(true);

    setTimeout(() => {
      if (finalCode === '123456') {
        Toast.show({
          type: 'success',
          text1: 'Code verified! 🎉',
          text2: 'Redirecting you to the last step.',
        });
        setValidated(true);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          router.push('/tnc'); // Update this path as needed
        }, 1500);
      } else {
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Code is incorrect. 🙁',
          text2: 'Please try again.',
        });
        setCode(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    }, 1000); // simulate 1s loading delay
  };

  const handleResend = () => {
    if (resendCount >= 3) {
      alert('You have reached the maximum resend attempts for today.');
      return;
    }
    setResendCount(resendCount + 1);
    handleInitialSend();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={24} color="white" />
        </View>
        <ThemedText type="title" style={styles.title}>Email Verification</ThemedText>
        <ThemedText style={styles.subtitle}>We have sent you an email to {email} </ThemedText>
        <ThemedText style={styles.subtitle}>It will include 6-digits verification code. <br></br>
        This code will be valid for 7 minutes.</ThemedText>
        <View style={styles.codeInputRow}>
          {[...Array(6)].map((_, i) => (
            <ThemedInput
              key={i}
              style={styles.codeBox}
              maxLength={1}
              keyboardType="number-pad"
              value={code[i]}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              ref={el => inputs.current[i] = el}
              autoFocus={i === 0}
              textAlign="center"
              editable={!validated}
            />
          ))}
        </View>
        
        {/* <ThemedButton onPress={handleVerify} style={styles.verifyButton} disabled={loading || validated}>
          {loading ? 'Verifying...' : validated ? 'Verified' : 'Verify'}
        </ThemedButton> */}
        {validated && loading && (
          <ActivityIndicator size="large" color="#4ade80" style={{ marginTop: 16 }} />
        )}
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={loading || validated}>
          <ThemedText style={styles.resendText}>
          I didn’t receive an email  <Text style={{ color: '#3B82F6' }}>Resend</Text>
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 20,
  },
  card: {
    width: '100%',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: '#dc2626', // red-600
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  codeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  codeBox: {
    backgroundColor: '#f3f4f6', // Tailwind gray-100
    borderRadius: 10,
    height: 48,
    width: 48,
    fontSize: 24,
    color: '#111827', // Tailwind gray-900
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  resendText: {
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  verifyButton: {
    backgroundColor: '#4ade80', // Tailwind green-400
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});