import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getData } from '@/components/Utils';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import AppContainer from '@/components/AppContainer';

const Validation = () => {
  useEffect(() => {
    const validateUser = async () => {
      try {
        const access = await getData('access');
        if (!access) {
          router.replace('/Login');
          return;
        }

        // Simulate validation process
        setTimeout(() => {
          router.replace('/terms');
        }, 2000);
      } catch (error) {
        console.error('Validation error:', error);
        router.replace('/Login');
      }
    };

    validateUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
            <ActivityIndicator size="large" color="#57EC6B" />
            <ThemedText type="wording">Validating Account</ThemedText>
            <ThemedText style={styles.subtitle}>Please wait while we verify your information...</ThemedText>
          </ThemedView>
        </ThemedView>
      </AppContainer>
    </SafeAreaView>
  );
};

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default Validation;