import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppContainer from '@/components/AppContainer';
import { Ionicons } from '@expo/vector-icons';

export default function MarketplacePage() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const brandColor = useThemeColor({}, 'default_brand_color');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: brandColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: brandColor,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: textColor,
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: 24,
      maxWidth: 300,
    },
  });

  return (
    <ProtectedRoute>
      <AppContainer>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={40} color={brandColor} />
          </View>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Coming Soon!</Text>
          <Text style={styles.description}>
            Buy and sell items with your university community. 
            Find textbooks, electronics, furniture, and more from fellow students.
          </Text>
        </View>
      </AppContainer>
    </ProtectedRoute>
  );
} 