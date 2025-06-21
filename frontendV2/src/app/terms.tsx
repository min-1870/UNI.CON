import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import AppContainer from '@/components/AppContainer';

const TermsAndConditions = () => {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !hasReachedBottom) {
      setHasReachedBottom(true);
    }
  };

  const handleButtonPress = () => {
    if (hasReachedBottom) {
      router.replace('/sign-in-complete');
    } else {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppContainer>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.badge}>UNI.CON</ThemedText>
            <ThemedText type="Wording">Terms and Conditions</ThemedText>
            <ThemedText style={styles.subtitle}>Please read carefully before continuing</ThemedText>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.termsContent}>
                {`1. Acceptance of Terms

By accessing and using UNI.CON, you agree to be bound by these Terms and Conditions.

2. User Responsibilities

2.1 You agree to:
- Provide accurate and complete information
- Maintain the security of your account
- Use the platform responsibly and ethically
- Respect other users' rights and privacy

2.2 You agree not to:
- Post harmful or illegal content
- Harass or bully other users
- Share inappropriate or offensive material
- Violate any applicable laws or regulations

3. Privacy and Data Protection

3.1 We collect and process your personal data in accordance with our Privacy Policy.

3.2 You have the right to:
- Access your personal data
- Request corrections to your data
- Request deletion of your data
- Opt-out of marketing communications

4. Intellectual Property

4.1 All content on UNI.CON is protected by copyright and other intellectual property rights.

4.2 You retain ownership of your content but grant us a license to use it.

5. Account Termination

5.1 We reserve the right to suspend or terminate accounts that violate these terms.

5.2 You may terminate your account at any time.

6. Limitation of Liability

6.1 UNI.CON is provided "as is" without warranties of any kind.

6.2 We are not liable for any indirect or consequential damages.

7. Changes to Terms

7.1 We may modify these terms at any time.

7.2 Continued use of UNI.CON constitutes acceptance of modified terms.

8. Governing Law

8.1 These terms are governed by the laws of Australia.

8.2 Any disputes shall be resolved in the courts of New South Wales.

9. Contact Information

For questions about these terms, please contact:
support@unicon.edu.au

10. Final Agreement

By clicking "Continue", you confirm that you have read, understood, and agree to these Terms and Conditions.`}
              </Text>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={handleButtonPress}
                disabled={!hasReachedBottom}
                style={[styles.customButton, !hasReachedBottom && styles.buttonDisabled]}
              >
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, !hasReachedBottom && styles.buttonTextDisabled]}>
                    {hasReachedBottom ? 'I Agree & Continue' : 'Scroll to Bottom'}
                  </Text>
                  <Ionicons 
                    name={hasReachedBottom ? "checkmark-circle" : "arrow-down"} 
                    size={20} 
                    color={hasReachedBottom ? "#fff" : "#ccc"} 
                    style={styles.buttonIcon}
                  />
                </View>
              </TouchableOpacity>
            </View>
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
    height: '90%',
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
  scrollView: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  termsContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  buttonContainer: {
    marginTop: 10,
  },
  customButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default TermsAndConditions; 