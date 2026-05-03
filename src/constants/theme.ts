/**
 * Homico Design System — Theme Constants
 * Vermillion brand + warm paper palette
 */

// Brand vermillion
export const ACCENT_COLOR = '#EF4E24';
export const ACCENT_HOVER = '#D13C14';
export const ACCENT_LIGHT = '#F7B49B';
export const ACCENT_DARK = '#A92B08';

export const BRAND = {
  50:  '#FEEDE6',
  100: '#FBD3C5',
  200: '#F7B49B',
  300: '#F28764',
  400: '#F06B43',
  500: '#EF4E24',
  600: '#D13C14',
  700: '#A92B08',
  800: '#7D1E04',
  900: '#501301',
} as const;

export const NEUTRAL = {
  0:   '#FFFFFF',
  50:  '#FAFAF7',
  100: '#F2F0EB',
  200: '#E3DFD6',
  300: '#C9C3B5',
  400: '#A69F8E',
  500: '#8A8472',
  600: '#5E594C',
  700: '#3D3930',
  800: '#262218',
  900: '#14120E',
} as const;

export const STATUS_COLORS = {
  success: '#3E8F5A',
  warning: '#C88A1D',
  error: '#C24545',
  info: '#3C6BB0',
  neutral: NEUTRAL[500],
} as const;

export const ADMIN_THEME = {
  primary: BRAND[500],
  primaryDark: BRAND[700],
  accent: BRAND[400],
  surface: NEUTRAL[900],
  surfaceLight: '#1D1B15',
  surfaceHover: '#26231B',
  border: '#302B22',
  borderLight: '#25211A',
  text: NEUTRAL[50],
  textMuted: NEUTRAL[400],
  textDim: NEUTRAL[500],
  success: STATUS_COLORS.success,
  warning: STATUS_COLORS.warning,
  error: STATUS_COLORS.error,
  info: STATUS_COLORS.info,
} as const;

export const COLORS = {
  brand: BRAND,
  neutral: NEUTRAL,
  success: { light: '#DCEFE2', main: STATUS_COLORS.success, dark: '#2D6B42' },
  warning: { light: '#F6E7C2', main: STATUS_COLORS.warning, dark: '#9A6A15' },
  error:   { light: '#F5D6D6', main: STATUS_COLORS.error,   dark: '#9A3333' },
  info:    { light: '#D8E3F5', main: STATUS_COLORS.info,    dark: '#2D5290' },
} as const;

export const SHADOWS = {
  xs: '0 1px 2px rgba(20,18,14,0.04)',
  sm: '0 1px 2px rgba(20,18,14,0.06), 0 1px 3px rgba(20,18,14,0.04)',
  md: '0 4px 8px -2px rgba(20,18,14,0.08), 0 2px 4px rgba(20,18,14,0.04)',
  lg: '0 16px 32px -12px rgba(20,18,14,0.16), 0 4px 8px rgba(20,18,14,0.04)',
  xl: '0 32px 64px -16px rgba(20,18,14,0.22)',
  button: { primary: `0 4px 14px rgba(239,78,36,0.3)`, primaryHover: `0 6px 20px rgba(239,78,36,0.4)`, secondary: '0 1px 2px rgba(20,18,14,0.06)' },
  card: { default: '0 1px 2px rgba(20,18,14,0.06), 0 1px 3px rgba(20,18,14,0.04)', hover: '0 4px 8px -2px rgba(20,18,14,0.08), 0 2px 4px rgba(20,18,14,0.04)', elevated: '0 16px 32px -12px rgba(20,18,14,0.16)', accent: `0 2px 12px rgba(239,78,36,0.06)`, accentHover: `0 4px 20px rgba(239,78,36,0.10)` },
  modal: '0 32px 64px -16px rgba(20,18,14,0.22)',
  dropdown: '0 16px 32px -12px rgba(20,18,14,0.16), 0 4px 8px rgba(20,18,14,0.04)',
  status: { success: `0 4px 14px rgba(62,143,90,0.3)`, warning: `0 4px 14px rgba(200,138,29,0.3)`, error: `0 4px 14px rgba(194,69,69,0.3)`, info: `0 4px 14px rgba(60,107,176,0.3)` },
} as const;

export const FONTS = {
  display: '"Fraunces", "Noto Serif Georgian", Georgia, serif',
  body: '"Inter", "Noto Sans Georgian", -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

export const RADIUS = {
  xs: '0',
  sm: '0',
  md: '0',
  lg: '0',
  xl: '0',
  full: '9999px',
} as const;

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

export const MOTION = {
  fast: '120ms',
  base: '180ms',
  slow: '300ms',
  slower: '500ms',
  easeStandard: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
  easeEmphasized: 'cubic-bezier(0.3, 0.85, 0.25, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export const GRADIENTS = {
  card: { warm: `linear-gradient(135deg, ${BRAND[50]} 0%, ${NEUTRAL[50]} 100%)`, warmSubtle: `linear-gradient(135deg, rgba(254,237,230,0.5) 0%, rgba(250,250,247,0.5) 100%)`, neutral: `linear-gradient(135deg, ${NEUTRAL[50]} 0%, ${NEUTRAL[100]} 100%)` },
  accent: { primary: `linear-gradient(135deg, ${BRAND[500]} 0%, ${BRAND[700]} 100%)`, premium: `linear-gradient(90deg, ${BRAND[400]} 0%, ${BRAND[500]} 50%, ${BRAND[400]} 100%)`, success: `linear-gradient(135deg, ${STATUS_COLORS.success} 0%, #2D6B42 100%)`, error: `linear-gradient(135deg, ${STATUS_COLORS.error} 0%, #9A3333 100%)` },
  effects: { shine: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)', shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)', overlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)', overlayLight: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)' },
  decorative: { accentOverlay: `linear-gradient(135deg, rgba(239,78,36,0.05) 0%, transparent 50%, rgba(239,78,36,0.1) 100%)`, accentLine: `linear-gradient(90deg, rgba(239,78,36,0.6) 0%, ${BRAND[500]} 50%, rgba(239,78,36,0.6) 100%)`, radialAccent: `radial-gradient(ellipse at center, rgba(239,78,36,0.1) 0%, transparent 70%)` },
} as const;

export type ThemeColor = typeof BRAND;
export type AdminTheme = typeof ADMIN_THEME;
export type StatusColor = keyof typeof STATUS_COLORS;
