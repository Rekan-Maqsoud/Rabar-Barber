export const lightTheme = {
  background: '#F8F9FA', // Off-white
  surface: '#FFFFFF',
  primary: '#D4AF37', // Metallic Gold
  primaryDark: '#AA8C2C',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
  success: '#2E7D32',
  danger: '#D32F2F',
  warning: '#F57C00',
  cardShadow: 'rgba(0,0,0,0.05)',
};

export const darkTheme = {
  background: '#121212', // Deep dark
  surface: '#1E1E1E', // Slightly lighter dark
  primary: '#D4AF37', // Metallic Gold
  primaryDark: '#F3E5AB',
  text: '#F8F9FA',
  textSecondary: '#ADB5BD',
  border: '#2D2D2D',
  success: '#4CAF50',
  danger: '#EF5350',
  warning: '#FFB74D',
  cardShadow: 'rgba(0,0,0,0.3)',
};

export type Theme = typeof lightTheme;
