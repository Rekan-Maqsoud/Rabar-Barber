export const lightTheme = {
  // Core backgrounds
  background: '#F5F1EA',
  backgroundSecondary: '#ECE8DF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFDF8',

  // Brand
  primary: '#B5892B',
  primaryDark: '#8C6A1F',
  primaryLight: '#F3E8D0',
  primaryMuted: '#D4B66A',

  // Accent
  accent: '#536B5A',
  accentLight: '#DAE8DE',

  // Text
  text: '#1C1816',
  textSecondary: '#6E685F',
  textMuted: '#9E978D',

  // Borders
  border: '#E2DDD3',
  borderLight: '#EDE9E0',

  // Status
  success: '#2D6B4E',
  successLight: '#D1F2DC',
  danger: '#A22B2B',
  dangerLight: '#FAD4D4',
  warning: '#B86E12',
  warningLight: '#FFF0D1',

  // Shadows
  cardShadow: 'rgba(28, 24, 22, 0.07)',
  elevatedShadow: 'rgba(28, 24, 22, 0.14)',

  // Gradients
  gradientPrimaryStart: '#C99F3E',
  gradientPrimaryEnd: '#8E6A1F',
  gradientSuccessStart: '#3D8B56',
  gradientSuccessEnd: '#2D6B4E',
  gradientDangerStart: '#C53636',
  gradientDangerEnd: '#A22B2B',
  gradientWarningStart: '#D4851A',
  gradientWarningEnd: '#B86E12',
  gradientAccentStart: '#637D6A',
  gradientAccentEnd: '#4E6350',
  gradientSurfaceStart: '#FFFFFF',
  gradientSurfaceEnd: '#F8F5EE',
  gradientHeaderStart: '#F5F1EA',
  gradientHeaderEnd: '#ECE8DF',
};

export const darkTheme = {
  // Core backgrounds
  background: '#0E0C09',
  backgroundSecondary: '#161310',
  surface: '#1C1916',
  surfaceElevated: '#262320',

  // Brand
  primary: '#D4A94D',
  primaryDark: '#F0D088',
  primaryLight: '#2A2318',
  primaryMuted: '#A88838',

  // Accent
  accent: '#7FA074',
  accentLight: '#1E2D22',

  // Text
  text: '#F2EFE8',
  textSecondary: '#9C968C',
  textMuted: '#6B665D',

  // Borders
  border: '#2A2720',
  borderLight: '#33302A',

  // Status
  success: '#5BB77A',
  successLight: '#1A2F22',
  danger: '#E25757',
  dangerLight: '#2F1A1A',
  warning: '#E8A740',
  warningLight: '#2F2518',

  // Shadows
  cardShadow: 'rgba(0, 0, 0, 0.45)',
  elevatedShadow: 'rgba(0, 0, 0, 0.65)',

  // Gradients
  gradientPrimaryStart: '#D4A94D',
  gradientPrimaryEnd: '#9A7725',
  gradientSuccessStart: '#5BB77A',
  gradientSuccessEnd: '#3D8B56',
  gradientDangerStart: '#E25757',
  gradientDangerEnd: '#C53636',
  gradientWarningStart: '#E8A740',
  gradientWarningEnd: '#D4851A',
  gradientAccentStart: '#7FA074',
  gradientAccentEnd: '#5B7553',
  gradientSurfaceStart: '#1C1916',
  gradientSurfaceEnd: '#14120F',
  gradientHeaderStart: '#0E0C09',
  gradientHeaderEnd: '#161310',
};

export type Theme = typeof lightTheme;
