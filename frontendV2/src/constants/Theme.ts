/**
 * Comprehensive Theme System for UNI.CON
 * Centralized styling for easy customization and maintenance
 */

// Base Color Palette
const BaseColors = {
  // Light Theme Colors
  light: {
    // Primary Colors
    primary: '#4ade80',
    primaryLight: '#86efac',
    primaryDark: '#16a34a',
    
    // Background Colors
    background: '#f8f9f7',
    surface: '#ffffff',
    card: '#f7f7f7',
    input: '#f2f2f2',
    
    // Text Colors
    text: '#11181c',
    textSecondary: '#6b7280',
    textMuted: '#a2a9b2',
    
    // Accent Colors
    error: '#f92665',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    
    // Border & Shadow
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Dark Theme Colors
  dark: {
    // Primary Colors
    primary: '#4ade80',
    primaryLight: '#86efac',
    primaryDark: '#16a34a',
    
    // Background Colors
    background: '#121212',
    surface: '#191919',
    card: '#191919',
    input: '#252525',
    
    // Text Colors
    text: 'rgba(255, 255, 255, 0.95)',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.65)',
    
    // Accent Colors
    error: '#ff6b6b',
    warning: '#fcd34d',
    success: '#86efac',
    info: '#93c5fd',
    
    // Border & Shadow
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  }
};

// Typography Scale
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Menlo',
    serif: 'DMSerifDisplay-Regular',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border Radius Scale
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow Presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Component Style Presets
export const ComponentStyles = {
  button: {
    primary: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.xl,
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    
    secondary: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      minHeight: 40,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    
    chip: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      minHeight: 32,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  },
  
  input: {
    primary: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      minHeight: 48,
      fontSize: Typography.fontSize.base,
    },
    
    search: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.full,
      minHeight: 48,
      fontSize: Typography.fontSize.base,
    },
  },
  
  card: {
    primary: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      ...Shadows.md,
    },
    
    elevated: {
      padding: Spacing.xl,
      borderRadius: BorderRadius['2xl'],
      ...Shadows.lg,
    },
  },
};

// Glass Effect Styles
export const GlassEffects = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  dark: {
    backgroundColor: 'rgba(25, 25, 25, 0.7)',
    backdropFilter: 'blur(20px)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};

// Create Theme Object
export const createTheme = (colorScheme: 'light' | 'dark') => {
  const colors = BaseColors[colorScheme];
  
  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    components: ComponentStyles,
    glassEffects: GlassEffects[colorScheme],
    
    // Computed styles based on theme
    computed: {
      shadowColor: colorScheme === 'dark' ? '#000' : colors.shadow,
      glassBackground: colorScheme === 'dark' 
        ? 'rgba(25, 25, 25, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
      overlayBackground: colorScheme === 'dark' 
        ? 'rgba(0, 0, 0, 0.5)' 
        : 'rgba(0, 0, 0, 0.3)',
    }
  };
};

// Theme Type
export type Theme = ReturnType<typeof createTheme>;

// Export default themes
export const LightTheme = createTheme('light');
export const DarkTheme = createTheme('dark'); 