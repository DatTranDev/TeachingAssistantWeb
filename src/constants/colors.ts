export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  muted: '#6B7280',
  mutedForeground: '#9CA3AF',
  border: '#E5E7EB',
  background: '#F9FAFB',
  surface: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof COLORS;
