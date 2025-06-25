import React, { useEffect, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import ThemedText from './ThemedText';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isLoading) {
        const isAuth = await checkAuth();
        if (!isAuth) {
          console.log('🔒 User not authenticated, redirecting to login');
          router.replace('/Login');
        }
      }
    };

    verifyAuth();
  }, [isLoading, checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <ActivityIndicator size="large" color="#57EC6B" />
        <ThemedText style={{ marginTop: 16, color: '#666' }}>
          Checking authentication...
        </ThemedText>
      </View>
    );
  }

  // If not authenticated, don't render children (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <ActivityIndicator size="large" color="#57EC6B" />
        <ThemedText style={{ marginTop: 16, color: '#666' }}>
          Redirecting to login...
        </ThemedText>
      </View>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 