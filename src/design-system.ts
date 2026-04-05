// Kalimero Design System Tokens
export const colors = {
  primary: '#FF6B00',
  'primary-dark': '#E55A00',
  'primary-light': '#FFF0E6',
  secondary: '#1A1A2E',
  accent: '#00D4AA',
  surface: '#FFFFFF',
  'surface-2': '#F8F8FA',
  'surface-3': '#F0F0F5',
  'text-primary': '#0D0D0D',
  'text-secondary': '#6B6B80',
  'text-muted': '#A0A0B0',
  border: '#E8E8F0',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
} as const;

export const typography = {
  fontDisplay: "'Plus Jakarta Sans', sans-serif",
  fontBody: "'Inter', sans-serif",
  scale: [11, 13, 15, 17, 20, 24, 28, 34, 42] as const,
} as const;

export const spacing = {
  base: 4,
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] as const,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const shadows = {
  card: '0 2px 12px rgba(0,0,0,0.08)',
  elevated: '0 8px 32px rgba(0,0,0,0.12)',
  modal: '0 16px 64px rgba(0,0,0,0.16)',
} as const;

export default { colors, typography, spacing, radius, shadows };
