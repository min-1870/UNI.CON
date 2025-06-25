import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import ThemedText from '@/components/ThemedText';
import ThemedInput from '@/components/ThemedInput';
import ThemedButton from '@/components/ThemedButton';
import ThemedView from '@/components/ThemedView';
import AppContainer from '@/components/AppContainer';

const getPasswordStrength = (password: string) => {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
  };
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ length: false, upper: false, lower: false });

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
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

    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/validation',
        params: {
          email: email.trim().toLowerCase(),
        },
      });
    }, 1500);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
        <ThemedText style={styles.badge}>UNI.CON</ThemedText>
        <ThemedText type="Wording">Sign in</ThemedText>
        <ThemedText style={styles.subtitle}>Join our university community</ThemedText>

        <ThemedText>University Email</ThemedText>
        <ThemedInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        
        <View style={styles.emailValidation}>
          <ThemedText style={[
            styles.validationText,
            { color: /\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email) ? '#10b981' : '#ef4444' }
          ]}>
            {/\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email)
              ? '✔️ You can create an account.'
              : '𝗫 Currently 🥲 - only UNSW, University of Sydney, UTS emails are accepted.'}
          </ThemedText>
        </View>

        <ThemedText>Password</ThemedText>
        <View style={styles.inputWrapper}>
          <ThemedInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordStrength}>
          <ThemedText style={[styles.strengthText, { color: passwordStrength.length ? '#10b981' : '#ef4444' }]}>
            {passwordStrength.length ? '✔️' : '𝗫'} At least 8 characters
            </ThemedText>
          <ThemedText style={[styles.strengthText, { color: passwordStrength.upper ? '#10b981' : '#ef4444' }]}>
            {passwordStrength.upper ? '✔️' : '𝗫'} One uppercase letter
            </ThemedText>
          <ThemedText style={[styles.strengthText, { color: passwordStrength.lower ? '#10b981' : '#ef4444' }]}>
            {passwordStrength.lower ? '✔️' : '𝗫'} One lowercase letter
            </ThemedText>
        </View>

        <ThemedText>Confirm Password</ThemedText>
        <View style={styles.inputWrapper}>
          <ThemedInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {error ? <ThemedText type="error">{error}</ThemedText> : null}

        <ThemedButton onPress={handleRegister} disabled={loading} type="auth">
          {loading ? 'Creating Account...' : 'Next'}
        </ThemedButton>

        <View style={styles.divider} />
        <ThemedText style={styles.footerText}>
          Already have an account? <Link href="/" style={styles.link}>Sign in</Link>
        </ThemedText>
          </ThemedView>
        </ThemedView>
      </AppContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
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
  subtitle: {
    alignSelf: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  emailValidation: {
    marginTop: 4,
    marginBottom: 12,
  },
  validationText: {
    fontSize: 12,
    marginLeft: 5,
    marginRight: 5,
  },
  inputWrapper: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  passwordStrength: {
    marginTop: 8,
    marginBottom: 16,
  },
  strengthText: {
    fontSize: 12,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 30,
  },
  link: {
    color: '#059669',
    fontWeight: '600',
  },
});