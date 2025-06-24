// Styled Components - Centralized theme-aware components
export { default as StyledView } from '../ThemedView';
export { default as StyledText } from '../ThemedText';
export { default as StyledButton } from '../ThemedButton';

// Export theme utilities
export { useTheme } from '../../contexts/ThemeContext';
export type { Theme } from '../../constants/Theme';
export { 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  ComponentStyles,
  LightTheme,
  DarkTheme 
} from '../../constants/Theme';

// Helper for creating theme-aware styles
export const createThemedStyles = (theme: any) => ({
  // Common layout styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing['2xl'],
  },
  
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.md,
  },
  
  input: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  searchInput: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  chip: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  chipSecondary: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // Text styles
  heading: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '600' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  subheading: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  body: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  
  caption: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  
  secondaryButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  spaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Spacing helpers
  marginSm: { margin: theme.spacing.sm },
  marginMd: { margin: theme.spacing.md },
  marginLg: { margin: theme.spacing.lg },
  paddingSm: { padding: theme.spacing.sm },
  paddingMd: { padding: theme.spacing.md },
  paddingLg: { padding: theme.spacing.lg },
  
  // Border helpers
  borderRadius: { borderRadius: theme.borderRadius.lg },
  roundedFull: { borderRadius: theme.borderRadius.full },
}); 