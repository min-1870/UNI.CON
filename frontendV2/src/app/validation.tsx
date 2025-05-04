import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { useLocalSearchParams } from 'expo-router';
const { email } = useLocalSearchParams();

export default function EmailVerificationPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text) || text === '') {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      if (text !== '' && index < 5) {
        setTimeout(() => {
          inputs.current[index + 1]?.focus();
        }, 100);
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

  const handleVerify = () => {
    // Verification logic here
  };

  const handleResend = () => {
    // Resend code logic here
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={24} color="white" />
        </View>
        <ThemedText type="title" style={styles.title}>Email Verification</ThemedText>
        <ThemedText style={styles.subtitle}>Please enter the 6-digit code sent to your email</ThemedText>
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
            />
          ))}
        </View>
        
        <ThemedButton onPress={handleVerify} style={styles.verifyButton}>
          Verify
        </ThemedButton>
        <View style={styles.divider} />
        <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
          <ThemedText style={styles.resendText}>
            Didn't receive a code? <Text style={{ color: '#3B82F6' }}>Resend</Text>
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