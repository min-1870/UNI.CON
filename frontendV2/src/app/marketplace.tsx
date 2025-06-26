import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '@/components/AppContainer';
import BottomNav from '@/components/ui/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MarketplacePage() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      backgroundColor: cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    icon: {
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <ProtectedRoute>
      <AppContainer>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Ionicons 
              name="storefront" 
              size={80} 
              color="#57EC6B" 
              style={styles.icon}
            />
            <Text style={styles.title}>Marketplace</Text>
            <Text style={styles.subtitle}>
              Buy and sell items with your university community.{'\n'}
              Coming soon!
            </Text>
          </View>
                </View>

        <BottomNav />
      </AppContainer>
    </ProtectedRoute>
  );
} 