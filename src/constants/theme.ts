import { Colors } from './colors';

export const Theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
    h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
    h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
    h4: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
    body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
    caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
