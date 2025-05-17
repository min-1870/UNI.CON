
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,

} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import Toast from 'react-native-toast-message';

const TERMS_TEXT = `
1. Introduction
Welcome to our service. By using our services, you are agreeing to these terms. Please read them carefully.

2. Using Our Services
You must follow any policies made available to you within the Services. Don't misuse our Services. For example, don't interfere with our Services or try to access them using a method other than the interface and the instructions that we provide.

3. Privacy and Copyright Protection
Our privacy policies explain how we treat your personal data and protect your privacy when you use our Services. By using our Services, you agree that we can use such data in accordance with our privacy policies.

4. Your Content in our Services
Some of our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content.

1. Introduction
Welcome to our service. By using our services, you are agreeing to these terms. Please read them carefully.

2. Using Our Services
You must follow any policies made available to you within the Services. Don't misuse our Services. For example, don't interfere with our Services or try to access them using a method other than the interface and the instructions that we provide.

3. Privacy and Copyright Protection
Our privacy policies explain how we treat your personal data and protect your privacy when you use our Services. By using our Services, you agree that we can use such data in accordance with our privacy policies.

4. Your Content in our Services
Some of our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content.


`;

export default function TermsAndConditions() {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 1;
    setScrolledToEnd(isAtEnd);
  };

  return (
    <View style={styles.container}>
      <ThemedText type='Wording'>Terms and Conditions</ThemedText>
      <Text style={styles.subtitle}>
        Please review and accept the terms and conditions to continue
      </Text>

      <View style={styles.termsBox}>
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.termsText}>{TERMS_TEXT}</Text>
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: scrolledToEnd ? '#57EC6B' : '#C8ECCC' },
        ]}
        onPress={() => {
          if (scrolledToEnd) {
            Toast.show({
                type: 'success',
                text1: 'You have accepted the terms and conditions.',
                text2: 'Proceeding to registration.',

                });

        setTimeout(() => {
              navigation.navigate('registration-success');
            }, 2500);
          } else {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        <Text style={styles.buttonText}>
          {scrolledToEnd ? 'Agree and Continue' : 'Continue to Next Section'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'left',
  },
  termsBox: {
    backgroundColor:'rgb(255, 255, 255)',
    borderRadius: 10,
    padding: 16,
    maxHeight: Dimensions.get('window').height * 0.45,
    marginBottom: 20,
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFF',
    paddingBottom: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
    loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
