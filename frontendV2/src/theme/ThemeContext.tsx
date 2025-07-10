// theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  system: 'light' | 'dark';
  setMode: (m: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  system: 'light',
  setMode: async () => {},
});

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, _setMode] = useState<ThemeMode>('auto');

  // load saved mode on startup
  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        _setMode(saved);
      }
    });
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    await AsyncStorage.setItem('theme', newMode);
    _setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, system, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
