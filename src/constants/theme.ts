/**
 * Centralized theme constants for the Homico application
 * Use these instead of defining color constants in individual files
 */

// Main brand terracotta color
export const ACCENT_COLOR = '#C4735B';
export const ACCENT_HOVER = '#B5624A';
export const ACCENT_LIGHT = '#E8A593';
export const ACCENT_DARK = '#A85D4A';

// Company/dashboard variant (warmer orange-terracotta)
export const COMPANY_ACCENT = '#E07B4F';
export const COMPANY_ACCENT_HOVER = '#D26B3F';

/**
 * Terracotta color palette for light/general components
 */
export const TERRACOTTA = {
  primary: '#C4735B',
  primaryHover: '#B5624A',
  primaryDark: '#A85D4A',
  light: '#E8A593',
  warm: '#F5DCD4',
  bg: '#FDF8F6',
  accent: '#D98B74',
} as const;

/**
 * Admin theme - Dark mode with terracotta accents
 */
export const ADMIN_THEME = {
  primary: '#C4735B',
  primaryDark: '#A85D4A',
  accent: '#D4897A',
  surface: '#1A1A1C',
  surfaceLight: '#232326',
  surfaceHover: '#2A2A2E',
  border: '#333338',
  borderLight: '#3D3D42',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/**
 * Status colors for various UI states
 */
export const STATUS_COLORS = {
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280',
} as const;

/**
 * Common color values used across the app
 */
export const COLORS = {
  // Terracotta variants
  terracotta: {
    50: '#FDF8F6',
    100: '#F5DCD4',
    200: '#E8A593',
    300: '#D98B74',
    400: '#C4735B',
    500: '#B5624A',
    600: '#A85D4A',
  },
  // Semantic colors
  success: {
    light: '#DCFCE7',
    main: '#22C55E',
    dark: '#16A34A',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },
} as const;

/**
 * Shadow presets for consistent elevation
 */
export const SHADOWS = {
  // Button shadows
  button: {
    primary: '0 2px 8px rgba(196, 115, 91, 0.3)',
    primaryHover: '0 4px 12px rgba(196, 115, 91, 0.4)',
    secondary: '0 1px 2px rgba(0, 0, 0, 0.05)',
    company: '0 2px 8px rgba(224, 123, 79, 0.3)',
    companyHover: '0 4px 12px rgba(224, 123, 79, 0.4)',
  },
  // Card shadows
  card: {
    default: '0 1px 3px rgba(0, 0, 0, 0.05)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.08)',
    elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
    accent: '0 2px 12px rgba(196, 115, 91, 0.06)',
    accentHover: '0 4px 20px rgba(196, 115, 91, 0.10)',
  },
  // Modal/overlay shadows
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  // Status shadows
  status: {
    success: '0 4px 14px rgba(34, 197, 94, 0.3)',
    warning: '0 4px 14px rgba(245, 158, 11, 0.3)',
    error: '0 4px 14px rgba(239, 68, 68, 0.3)',
    info: '0 4px 14px rgba(59, 130, 246, 0.3)',
  },
} as const;

/**
 * Gradient presets for consistent styling
 */
export const GRADIENTS = {
  // Card backgrounds (light mode)
  card: {
    warm: 'linear-gradient(135deg, #FFFDF9 0%, #FFF9F0 50%, #FDF5E6 100%)',
    warmSubtle: 'linear-gradient(135deg, rgba(255,253,249,0.95) 0%, rgba(255,249,240,0.9) 50%, rgba(253,245,230,0.85) 100%)',
    neutral: 'linear-gradient(135deg, #FDFBF7 0%, #FAF6F0 50%, #F5EFE6 100%)',
  },
  // Button/accent gradients
  accent: {
    primary: 'linear-gradient(135deg, #C4735B 0%, #A85D4A 100%)',
    company: 'linear-gradient(135deg, #E07B4F 0%, #B86349 100%)',
    premium: 'linear-gradient(90deg, #E07B4F 0%, #E8956A 50%, #E07B4F 100%)',
    success: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  // Overlay/shine effects
  effects: {
    shine: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
    overlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
    overlayLight: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
  },
  // Background decorative gradients
  decorative: {
    accentOverlay: 'linear-gradient(135deg, rgba(196,115,91,0.05) 0%, transparent 50%, rgba(196,115,91,0.1) 100%)',
    accentLine: 'linear-gradient(90deg, rgba(196,115,91,0.6) 0%, #C4735B 50%, rgba(196,115,91,0.6) 100%)',
    radialAccent: 'radial-gradient(ellipse at center, rgba(196,115,91,0.1) 0%, transparent 70%)',
  },
} as const;

/**
 * Responsive spacing presets
 */
export const SPACING = {
  card: 'p-4 sm:p-6',
  cardX: 'px-4 sm:px-6',
  cardY: 'py-4 sm:py-6',
  section: 'p-6 sm:p-8',
  sectionX: 'px-6 sm:px-8',
  sectionY: 'py-6 sm:py-8',
  container: 'px-4 sm:px-6 lg:px-8',
  modal: 'p-4 sm:p-6',
} as const;

/**
 * Common border radius values
 */
export const RADIUS = {
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Type exports for type safety
export type ThemeColor = typeof TERRACOTTA;
export type AdminTheme = typeof ADMIN_THEME;
export type StatusColor = keyof typeof STATUS_COLORS;
