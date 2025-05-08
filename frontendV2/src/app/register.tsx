import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, Link } from 'expo-router';
import ThemedView from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

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
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText style={styles.badge}>UNI.CON</ThemedText>
        <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
        <ThemedText style={styles.subtitle}>Join our university community</ThemedText>

        <ThemedText>User Name</ThemedText>
        <View style={styles.inputWrapper}>
          <ThemedInput
            value={`@${name}`}
            onChangeText={(text) => setName(text.replace(/^@/, ''))}
            style={styles.input}
          />
        </View>

        <ThemedText>University Email</ThemedText>
        <ThemedInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        

        <View style={{ marginTop: 4, marginBottom: 12 }}>
          <ThemedText style={{ fontSize: 12, color: /\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email) ? '#10b981' : '#ef4444', marginLeft: 5, marginRight: 5 }}>
            {/\S+@+(unsw.edu.au|sydney.edu.au|uts.edu.au)$/.test(email)
              ? '✔️ You can create an account.'
              : '𝗫 Currently 🥲 - only UNSW , University of Sydney , UTS emails are accepted.'}
          </ThemedText>
        </View>

        <ThemedText>Password</ThemedText>
        <View style={styles.inputWrapper}>
          <ThemedInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 8 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
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

        <ThemedText>Confirm Password</ThemedText>
        <View style={styles.inputWrapper}>
          <ThemedInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {error ? <ThemedText type="error">{error}</ThemedText> : null}

        <ThemedButton onPress={handleRegister} disabled={loading}>
          {loading ? 'Creating Account...' : 'Next'}
        </ThemedButton>
        <View style={styles.divider} />
        <ThemedText style={styles.footerText}>
          Already have an account? <Link href="/" style={styles.link}>Sign in</Link>
        </ThemedText>
      </ThemedView>
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
  title: {
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    alignSelf: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  footerText: {
    marginTop: 16,
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
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f3f4f6', // Tailwind gray-100
    borderRadius: 10,
    height: 48,
    fontSize: 16,
    color: '#111827', // Tailwind gray-900
    paddingHorizontal: 16,
    paddingRight: 40, // 👈 makes room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '40%',
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