import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getData, removeData } from '@/components/Utils';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const [accessToken, isValidated] = await Promise.all([
        getData('access'),
        getData('is_validated')
      ]);
      
      const authenticated = !!(accessToken && isValidated);
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear all stored user data
      await Promise.all([
        removeData('id'),
        removeData('access'),
        removeData('email'),
        removeData('points'),
        removeData('university_colors'),
        removeData('university'),
        removeData('refresh'),
        removeData('color'),
        removeData('initial'),
        removeData('is_validated')
      ]);
      
      setIsAuthenticated(false);
      // Navigate to login page
      router.replace('/Login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      checkAuth, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 