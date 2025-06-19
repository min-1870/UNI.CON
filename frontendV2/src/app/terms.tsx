import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '@/components/AppScreen';

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
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.subtitle}>Please read carefully before continuing</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.content}>
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

      <TouchableOpacity 
        style={[styles.button, hasReachedBottom && styles.buttonActive]} 
        onPress={handleButtonPress}
      >
        <Text style={[styles.buttonText, hasReachedBottom && styles.buttonTextActive]}>
          {hasReachedBottom ? 'Continue' : 'Scroll to Bottom'}
        </Text>
        <Ionicons 
          name={hasReachedBottom ? "checkmark-circle" : "arrow-down"} 
          size={24} 
          color={hasReachedBottom ? "#fff" : "#57EC6B"} 
        />
      </TouchableOpacity>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#57EC6B',
  },
  buttonActive: {
    backgroundColor: '#57EC6B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#57EC6B',
    marginRight: 8,
  },
  buttonTextActive: {
    color: '#fff',
  },
});

export default TermsAndConditions; 