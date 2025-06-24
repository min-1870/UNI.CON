import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createTheme, Theme, LightTheme, DarkTheme } from '@/constants/Theme';

interface ThemeContextType {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
  const isDark = colorScheme === 'dark';

  const value: ThemeContextType = {
    theme,
    colorScheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 